import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/container";
import { Tag } from "@/components/ui/tag";
import { ModerationButtons } from "./moderation-buttons";
import { formatRelativeTime } from "@/lib/utils/format-time";

export const metadata = { title: "Story Moderation — Admin — Hoddle" };

type StoryRow = {
  id: string;
  slug: string;
  title: string;
  body: string;
  milestones: string[];
  status: string;
  created_at: string;
  profiles: { full_name: string | null; university: string | null } | null;
};

export default async function AdminStoriesPage() {
  const supabase = await createClient();

  const [{ data: pending }, { data: recent }] = await Promise.all([
    supabase
      .from("success_stories")
      .select(
        `id, slug, title, body, milestones, status, created_at,
         profiles!success_stories_author_id_fkey(full_name, university)`,
      )
      .eq("status", "pending")
      .order("created_at"),
    supabase
      .from("success_stories")
      .select(
        `id, slug, title, body, milestones, status, created_at,
         profiles!success_stories_author_id_fkey(full_name, university)`,
      )
      .in("status", ["published", "rejected"])
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const typedPending = (pending ?? []) as unknown as StoryRow[];
  const typedRecent = (recent ?? []) as unknown as StoryRow[];

  return (
    <Container className="py-16">
      <nav className="font-body text-sm text-on-surface-variant mb-6">
        <Link href="/admin" className="hover:text-primary transition-colors">
          Admin
        </Link>
        {" / "}
        <span className="text-on-surface">Stories</span>
      </nav>

      <header className="mb-12">
        <h1 className="font-display text-4xl font-bold text-primary mb-2">
          Story moderation
        </h1>
        <p className="font-body text-on-surface-variant text-lg">
          Review submitted stories and approve or reject them for publication.
        </p>
      </header>

      {/* Pending queue */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold text-on-surface">
            Awaiting review
          </h2>
          {typedPending.length > 0 && (
            <span className="font-body text-xs font-semibold text-on-secondary bg-secondary rounded-full px-2.5 py-1">
              {typedPending.length} pending
            </span>
          )}
        </div>

        {typedPending.length === 0 ? (
          <div className="rounded-2xl bg-surface-container-low px-8 py-12 text-center">
            <p className="font-body text-on-surface-variant">
              No stories awaiting review. All caught up.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {typedPending.map((story) => (
              <StoryReviewCard key={story.id} story={story} showActions />
            ))}
          </div>
        )}
      </section>

      {/* Recently moderated */}
      {typedRecent.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-bold text-on-surface mb-6">
            Recently moderated
          </h2>
          <div className="space-y-4">
            {typedRecent.map((story) => (
              <StoryReviewCard key={story.id} story={story} showActions={false} />
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}

function StoryReviewCard({
  story,
  showActions,
}: {
  story: StoryRow;
  showActions: boolean;
}) {
  const author = story.profiles;
  const excerpt = story.body.slice(0, 240).trimEnd();

  return (
    <div className="rounded-2xl bg-surface-container-lowest p-7 shadow-ambient">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <StatusBadge status={story.status} />
            <span className="font-body text-xs text-on-surface-variant">
              Submitted {formatRelativeTime(story.created_at)}
            </span>
          </div>

          <h3 className="font-display text-lg font-bold text-on-surface mb-2 leading-snug">
            {story.title}
          </h3>

          <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-4">
            {excerpt}
            {story.body.length > 240 ? "…" : ""}
          </p>

          {story.milestones.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {story.milestones.map((m) => (
                <Tag key={m} variant="success" className="text-[10px]">
                  {m}
                </Tag>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 font-body text-xs text-on-surface-variant">
            <span className="font-semibold text-on-surface">
              {author?.full_name ?? "Unknown"}
            </span>
            {author?.university && (
              <>
                <span>·</span>
                <span>{author.university}</span>
              </>
            )}
          </div>
        </div>

        {showActions && (
          <div className="shrink-0 flex md:flex-col gap-3 self-start">
            <ModerationButtons storyId={story.id} />
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "published") {
    return (
      <span className="font-body text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-secondary-container text-secondary">
        Published
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="font-body text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-error/10 text-error">
        Rejected
      </span>
    );
  }
  return (
    <span className="font-body text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-surface-container-highest text-on-surface-variant">
      Pending
    </span>
  );
}
