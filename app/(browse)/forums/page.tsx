import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils/format-time";

export const metadata = { title: "Community Forums — Hoddle" };

type ThreadRow = {
  id: string;
  slug: string;
  title: string;
  category_slug: string;
  pinned: boolean;
  last_activity_at: string;
  is_anonymous: boolean;
  view_count: number;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
  forum_posts: { count: number }[];
};

type CategoryMeta = { slug: string; name: string; description: string | null };

type SessionRow = {
  id: string;
  title: string;
  scheduled_at: string;
  mentors: { profiles: { full_name: string | null } | null } | null;
};

export default async function ForumsPage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: threads }, { data: sessions }] =
    await Promise.all([
      supabase
        .from("forum_categories")
        .select("slug, name, description")
        .order("sort_order"),
      supabase
        .from("forum_threads")
        .select(
          `id, slug, title, category_slug, pinned, last_activity_at, is_anonymous, view_count,
           profiles!forum_threads_author_id_fkey(full_name, avatar_url),
           forum_posts(count)`,
        )
        .is("deleted_at", null)
        .order("pinned", { ascending: false })
        .order("last_activity_at", { ascending: false })
        .limit(30),
      supabase
        .from("live_sessions")
        .select(
          `id, title, scheduled_at,
           mentors!live_sessions_mentor_id_fkey(
             profiles!mentors_profile_id_fkey(full_name)
           )`,
        )
        .gte("scheduled_at", new Date().toISOString())
        .eq("status", "scheduled")
        .order("scheduled_at")
        .limit(3),
    ]);

  const typedThreads = (threads ?? []) as unknown as ThreadRow[];
  const typedSessions = (sessions ?? []) as unknown as SessionRow[];

  return (
    <Container className="py-10 sm:py-16">
      {/* Page header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 sm:gap-6 mb-8 sm:mb-12">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-on-surface mb-3">
            Community Forums
          </h1>
          <p className="font-body text-base sm:text-xl text-on-surface-variant max-w-lg">
            Ask questions, share experiences, and support each other in your
            Melbourne journey.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/forums/new">
            <PlusCircle strokeWidth={1.5} className="w-5 h-5" />
            Ask a question
          </Link>
        </Button>
      </header>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2 mb-6 sm:mb-10">
        <span className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-primary text-on-primary font-body font-medium text-sm">
          All
        </span>
        {(categories ?? []).map((cat) => (
          <Link
            key={cat.slug}
            href={`/forums/${cat.slug}`}
            className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high transition-colors font-body text-sm"
          >
            {cat.name}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Thread list */}
        <div className="lg:col-span-8 space-y-1">
          {typedThreads.length === 0 ? (
            <div className="py-20 text-center text-on-surface-variant font-body">
              No threads yet. Be the first to start a discussion.
            </div>
          ) : (
            typedThreads.map((thread) => (
              <ThreadRow
                key={thread.id}
                thread={thread}
                categories={categories ?? []}
              />
            ))
          )}
        </div>

        {/* Sidebar */}
        <ForumsSidebar
          sessions={typedSessions}
          categories={categories ?? []}
        />
      </div>
    </Container>
  );
}

// ── Thread row ─────────────────────────────────────────────────────────────────

function ThreadRow({
  thread,
  categories,
}: {
  thread: ThreadRow;
  categories: CategoryMeta[];
}) {
  const cat = categories.find((c) => c.slug === thread.category_slug);
  const replyCount = thread.forum_posts[0]?.count ?? 0;
  const displayName = thread.is_anonymous
    ? "Anonymous"
    : (thread.profiles?.full_name ?? "Unknown");
  const initials = thread.is_anonymous
    ? "A"
    : (thread.profiles?.full_name ?? "?")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

  return (
    <Link
      href={`/forums/${thread.category_slug}/${thread.slug}`}
      className={[
        "block bg-surface-container-lowest hover:bg-surface-container-low",
        "transition-colors rounded-2xl p-4 sm:p-6",
        "flex flex-col md:flex-row gap-4 sm:gap-6 items-start group",
        thread.pinned ? "border-l-4 border-primary" : "",
      ].join(" ")}
    >
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-3">
          {cat && (
            <span className="text-[11px] font-body font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-surface-container-high text-on-surface-variant">
              {cat.name}
            </span>
          )}
          {thread.pinned && (
            <span className="text-[10px] font-body font-black uppercase tracking-wider px-2 py-1 rounded-md bg-primary/10 text-primary">
              Pinned
            </span>
          )}
        </div>
        <h2 className="font-display text-xl font-bold mb-4 text-on-surface group-hover:text-primary transition-colors">
          {thread.title}
        </h2>
        <div className="flex items-center gap-4 text-sm text-on-surface-variant font-body">
          <div className="flex items-center gap-2">
            {!thread.is_anonymous && thread.profiles?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thread.profiles.avatar_url}
                alt={thread.profiles.full_name ?? ""}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-on-surface-variant">
                {initials}
              </div>
            )}
            <span className="font-medium text-on-surface">
              {displayName}
            </span>
          </div>
          <span>• {formatRelativeTime(thread.last_activity_at)}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex md:flex-col items-center gap-6 self-center md:self-stretch justify-center border-t md:border-t-0 md:border-l border-surface-variant pt-4 md:pt-0 md:pl-8 shrink-0">
        <div className="text-center">
          <div className="font-display font-bold text-lg text-on-surface">
            {replyCount}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-on-surface-variant font-body">
            Replies
          </div>
        </div>
        <div className="text-center">
          <div className="font-display font-bold text-lg text-on-surface">
            {(thread.view_count ?? 0).toLocaleString()}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-on-surface-variant font-body">
            Views
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function ForumsSidebar({
  sessions,
  categories,
}: {
  sessions: SessionRow[];
  categories: CategoryMeta[];
}) {
  return (
    <aside className="lg:col-span-4 space-y-12">
      {/* Browse categories */}
      <section>
        <h3 className="text-xs font-body uppercase tracking-widest text-on-surface-variant mb-6 flex items-center gap-2">
          <span className="w-6 h-px bg-outline-variant" />
          Browse categories
        </h3>
        <div className="space-y-3">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/forums/${cat.slug}`}
              className="block p-4 bg-surface-container-low rounded-xl hover:bg-surface-container transition-colors group"
            >
              <p className="font-display font-semibold text-sm text-on-surface group-hover:text-primary transition-colors">
                {cat.name}
              </p>
              {cat.description && (
                <p className="text-xs text-on-surface-variant font-body mt-1 line-clamp-1">
                  {cat.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* Upcoming Q&As */}
      {sessions.length > 0 && (
        <section>
          <h3 className="text-xs font-body uppercase tracking-widest text-on-surface-variant mb-6 flex items-center gap-2">
            <span className="w-6 h-px bg-outline-variant" />
            Upcoming Q&amp;As
          </h3>
          <div className="space-y-4">
            {sessions.map((session) => {
              const d = new Date(session.scheduled_at);
              const dateStr = d.toLocaleDateString("en-AU", {
                weekday: "short",
                day: "numeric",
                month: "short",
              });
              const timeStr = d.toLocaleTimeString("en-AU", {
                hour: "2-digit",
                minute: "2-digit",
              });
              const mentorName =
                (
                  session.mentors?.profiles as
                    | { full_name: string | null }
                    | null
                )?.full_name ?? "A mentor";

              return (
                <Link
                  key={session.id}
                  href={`/sessions/${session.id}`}
                  className="block p-4 bg-surface-container rounded-2xl hover:bg-surface-container-high transition-colors"
                >
                  <p className="text-[10px] font-body font-bold uppercase tracking-widest text-secondary mb-2">
                    {dateStr} • {timeStr}
                  </p>
                  <h4 className="font-display font-bold text-sm text-on-surface leading-tight">
                    {session.title}
                  </h4>
                  <p className="text-xs text-on-surface-variant font-body mt-2">
                    With {mentorName}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </aside>
  );
}
