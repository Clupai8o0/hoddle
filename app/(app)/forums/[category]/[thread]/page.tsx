import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Lock, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/container";
import { formatRelativeTime } from "@/lib/utils/format-time";
import { ReplyForm } from "./reply-form";
import { ReactionButtons } from "./reaction-buttons";
import { EditPostControls } from "./edit-post-form";

interface PageProps {
  params: Promise<{ category: string; thread: string }>;
}

type PostRow = {
  id: string;
  body: string;
  created_at: string;
  edited_at: string | null;
  parent_post_id: string | null;
  author_id: string;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
  forum_reactions: { reaction: "heart" | "thanks" | "helpful"; profile_id: string }[];
};

export async function generateMetadata({ params }: PageProps) {
  const { thread } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("forum_threads")
    .select("title")
    .eq("slug", thread)
    .single();
  if (!data) return { title: "Forums — Hoddle" };
  return { title: `${data.title} — Hoddle Forums` };
}

export default async function ThreadPage({ params }: PageProps) {
  const { category, thread: threadSlug } = await params;
  const supabase = await createClient();

  // Get current user for ownership checks and reaction state
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: threadData }, { data: categoryData }] = await Promise.all([
    supabase
      .from("forum_threads")
      .select(
        `id, slug, title, body, category_slug, pinned, locked, created_at, last_activity_at,
         author_id,
         profiles!forum_threads_author_id_fkey(full_name, avatar_url)`,
      )
      .eq("slug", threadSlug)
      .eq("category_slug", category)
      .is("deleted_at", null)
      .single(),
    supabase
      .from("forum_categories")
      .select("name, slug")
      .eq("slug", category)
      .single(),
  ]);

  if (!threadData || !categoryData) notFound();

  // Fetch posts (top-level + replies)
  const { data: posts } = await supabase
    .from("forum_posts")
    .select(
      `id, body, created_at, edited_at, parent_post_id, author_id,
       profiles!forum_posts_author_id_fkey(full_name, avatar_url),
       forum_reactions(reaction, profile_id)`,
    )
    .eq("thread_id", threadData.id)
    .is("deleted_at", null)
    .order("created_at");

  // Check if any post author is a verified mentor (for "Mentor Answer" badge)
  const authorIds = [...new Set((posts ?? []).map((p) => p.author_id))];
  const { data: mentorProfiles } =
    authorIds.length > 0
      ? await supabase
          .from("mentors")
          .select("profile_id, slug")
          .in("profile_id", authorIds)
          .not("verified_at", "is", null)
      : { data: [] };

  const mentorSet = new Set((mentorProfiles ?? []).map((m) => m.profile_id));
  const mentorSlugMap = Object.fromEntries(
    (mentorProfiles ?? []).map((m) => [m.profile_id, m.slug]),
  );

  const typedPosts = (posts ?? []) as unknown as PostRow[];
  const threadPath = `/forums/${category}/${threadSlug}`;
  const threadAuthor = threadData.profiles as {
    full_name: string | null;
    avatar_url: string | null;
  } | null;

  // Separate top-level posts from replies (max 2 levels)
  const topLevel = typedPosts.filter((p) => !p.parent_post_id);
  const repliesByParent = typedPosts
    .filter((p) => p.parent_post_id)
    .reduce<Record<string, PostRow[]>>((acc, p) => {
      const key = p.parent_post_id!;
      if (!acc[key]) acc[key] = [];
      acc[key].push(p);
      return acc;
    }, {});

  return (
    <>
      <Container className="py-16 max-w-3xl pb-32">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-sm font-body text-on-surface-variant">
          <Link href="/forums" className="hover:text-primary transition-colors">
            Forums
          </Link>
          <ChevronLeft
            strokeWidth={1.5}
            className="w-3.5 h-3.5 rotate-180"
          />
          <Link
            href={`/forums/${category}`}
            className="hover:text-primary transition-colors"
          >
            {categoryData.name}
          </Link>
        </div>

        {/* Thread header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-full text-xs font-body font-bold tracking-widest uppercase bg-surface-container-high text-on-surface-variant">
              {categoryData.name}
            </span>
            <span className="text-on-surface-variant text-sm font-body">
              {formatRelativeTime(threadData.created_at)}
            </span>
            {threadData.locked && (
              <span className="flex items-center gap-1 text-xs text-on-surface-variant font-body">
                <Lock strokeWidth={1.5} className="w-3.5 h-3.5" />
                Locked
              </span>
            )}
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight mb-6 leading-tight">
            {threadData.title}
          </h1>
          <AuthorByline profile={threadAuthor} />
        </header>

        {/* Original post body */}
        <article className="bg-surface-container-lowest rounded-3xl p-8 md:p-10 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
          <div className="prose prose-stone max-w-none font-body text-on-surface leading-relaxed text-lg whitespace-pre-wrap">
            {threadData.body}
          </div>

          {/* Reactions on the original post */}
          {topLevel.length > 0 ? null : (
            <OriginalPostReactions
              threadId={threadData.id}
              currentUserId={user?.id}
              threadPath={threadPath}
            />
          )}
        </article>

        {/* Posts + replies */}
        <div className="space-y-6">
          {topLevel.length === 0 && (
            <p className="text-center text-on-surface-variant font-body py-8">
              No replies yet. Be the first to respond.
            </p>
          )}

          {topLevel.map((post) => {
            const isMentor = mentorSet.has(post.author_id);
            const mentorSlug = mentorSlugMap[post.author_id];
            const postReplies = repliesByParent[post.id] ?? [];

            const reactionCounts = aggregateReactions(
              post.forum_reactions,
              user?.id,
            );
            const isOwn = user?.id === post.author_id;

            return (
              <div key={post.id}>
                {/* Mentor highlighted post */}
                {isMentor ? (
                  <MentorPost
                    post={post}
                    mentorSlug={mentorSlug}
                    reactionCounts={reactionCounts}
                    currentUserId={user?.id}
                    threadPath={threadPath}
                    isOwn={isOwn}
                  />
                ) : (
                  <RegularPost
                    post={post}
                    reactionCounts={reactionCounts}
                    currentUserId={user?.id}
                    threadPath={threadPath}
                    isOwn={isOwn}
                  />
                )}

                {/* Nested replies (max 1 level deep in UI) */}
                {postReplies.length > 0 && (
                  <div className="ml-8 mt-3 space-y-3 border-l-2 border-surface-variant pl-6">
                    {postReplies.map((reply) => {
                      const replyReactions = aggregateReactions(
                        reply.forum_reactions,
                        user?.id,
                      );
                      return (
                        <RegularPost
                          key={reply.id}
                          post={reply}
                          reactionCounts={replyReactions}
                          currentUserId={user?.id}
                          threadPath={threadPath}
                          isOwn={user?.id === reply.author_id}
                          compact
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Container>

      {/* Sticky reply input */}
      <ReplyForm
        threadId={threadData.id}
        threadPath={threadPath}
        locked={threadData.locked}
      />
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function aggregateReactions(
  reactions: { reaction: "heart" | "thanks" | "helpful"; profile_id: string }[],
  currentUserId: string | undefined,
): { reaction: "heart" | "thanks" | "helpful"; count: number; userReacted: boolean }[] {
  const map: Record<string, { count: number; userReacted: boolean }> = {
    helpful: { count: 0, userReacted: false },
    heart: { count: 0, userReacted: false },
    thanks: { count: 0, userReacted: false },
  };
  for (const r of reactions) {
    if (!map[r.reaction]) continue;
    map[r.reaction].count++;
    if (r.profile_id === currentUserId) map[r.reaction].userReacted = true;
  }
  return (["helpful", "heart", "thanks"] as const).map((r) => ({
    reaction: r,
    count: map[r].count,
    userReacted: map[r].userReacted,
  }));
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AuthorByline({
  profile,
}: {
  profile: { full_name: string | null; avatar_url: string | null } | null;
}) {
  const initials = (profile?.full_name ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-4">
      {profile?.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.avatar_url}
          alt={profile.full_name ?? ""}
          className="w-12 h-12 rounded-full object-cover"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center font-display font-bold text-on-surface-variant">
          {initials}
        </div>
      )}
      <div>
        <p className="font-display font-bold text-on-surface">
          {profile?.full_name ?? "Unknown"}
        </p>
      </div>
    </div>
  );
}

type PostProps = {
  post: PostRow;
  reactionCounts: { reaction: "heart" | "thanks" | "helpful"; count: number; userReacted: boolean }[];
  currentUserId: string | undefined;
  threadPath: string;
  isOwn: boolean;
  compact?: boolean;
};

function RegularPost({
  post,
  reactionCounts,
  currentUserId,
  threadPath,
  isOwn,
  compact = false,
}: PostProps) {
  const profile = post.profiles as {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  const initials = (profile?.full_name ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`flex gap-4 p-6 bg-surface-container-low rounded-2xl ${compact ? "p-4" : ""}`}
    >
      {profile?.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.avatar_url}
          alt={profile.full_name ?? ""}
          className={`${compact ? "w-8 h-8" : "w-10 h-10"} rounded-full object-cover shrink-0`}
        />
      ) : (
        <div
          className={`${compact ? "w-8 h-8" : "w-10 h-10"} rounded-full bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-on-surface-variant shrink-0`}
        >
          {initials}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-2">
          <span className="font-display font-bold text-on-surface text-sm">
            {profile?.full_name ?? "Unknown"}
          </span>
          <span className="text-xs text-on-surface-variant font-body">
            {formatRelativeTime(post.created_at)}
            {post.edited_at && (
              <span className="italic ml-1">(edited)</span>
            )}
          </span>
        </div>
        <p className="text-on-surface-variant leading-relaxed font-body whitespace-pre-wrap">
          {post.body}
        </p>

        {/* Reactions — only show if not compact */}
        {!compact && currentUserId && (
          <ReactionButtons
            postId={post.id}
            reactions={reactionCounts}
            threadPath={threadPath}
          />
        )}

        {/* Edit/delete controls (own posts only) */}
        {isOwn && (
          <EditPostControls
            postId={post.id}
            initialBody={post.body}
            createdAt={post.created_at}
            threadPath={threadPath}
          />
        )}
      </div>
    </div>
  );
}

function MentorPost({
  post,
  mentorSlug,
  reactionCounts,
  currentUserId,
  threadPath,
  isOwn,
}: PostProps & { mentorSlug: string }) {
  const profile = post.profiles as {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  const initials = (profile?.full_name ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4 px-2">
        <CheckCircle strokeWidth={1.5} className="w-5 h-5 text-secondary" />
        <h2 className="font-display text-base font-bold text-secondary uppercase tracking-wider">
          Mentor answer
        </h2>
      </div>
      <div className="bg-secondary/5 border-2 border-secondary/10 rounded-3xl p-8 md:p-10 relative">
        <div className="flex items-start gap-6 mb-6">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={profile.full_name ?? ""}
              className="w-16 h-16 rounded-2xl object-cover shadow-ambient shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center font-display font-bold text-on-surface-variant text-lg shrink-0">
              {initials}
            </div>
          )}
          <div>
            <Link
              href={`/mentors/${mentorSlug}`}
              className="font-display font-bold text-on-surface hover:text-primary transition-colors"
            >
              {profile?.full_name ?? "Mentor"}
            </Link>
            <p className="text-secondary text-sm font-body font-medium mt-0.5">
              Verified Mentor
            </p>
          </div>
        </div>

        <p className="text-on-surface leading-relaxed font-body text-lg whitespace-pre-wrap mb-6">
          {post.body}
        </p>

        {post.edited_at && (
          <p className="text-xs text-on-surface-variant font-body italic mb-4">
            Edited {formatRelativeTime(post.edited_at)}
          </p>
        )}

        {currentUserId && (
          <ReactionButtons
            postId={post.id}
            reactions={reactionCounts}
            threadPath={threadPath}
          />
        )}

        {isOwn && (
          <EditPostControls
            postId={post.id}
            initialBody={post.body}
            createdAt={post.created_at}
            threadPath={threadPath}
          />
        )}
      </div>
    </section>
  );
}

// Placeholder — original post has no DB post row; reactions are on forum_posts only
function OriginalPostReactions({
  threadId: _threadId,
  currentUserId: _userId,
  threadPath: _path,
}: {
  threadId: string;
  currentUserId: string | undefined;
  threadPath: string;
}) {
  // Original thread body is stored in forum_threads.body (no reactions).
  // Reactions only apply to forum_posts. This component is intentionally empty.
  return null;
}
