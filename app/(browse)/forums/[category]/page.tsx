import Link from "next/link";
import { notFound } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils/format-time";

interface PageProps {
  params: Promise<{ category: string }>;
}

type ThreadRow = {
  id: string;
  slug: string;
  title: string;
  category_slug: string;
  pinned: boolean;
  locked: boolean;
  last_activity_at: string;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
  forum_posts: { count: number }[];
};

export async function generateMetadata({ params }: PageProps) {
  const { category } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("forum_categories")
    .select("name")
    .eq("slug", category)
    .single();
  if (!data) return { title: "Forums — Hoddle" };
  return { title: `${data.name} — Hoddle Forums` };
}

export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params;
  const supabase = await createClient();

  const [{ data: currentCat }, { data: categories }, { data: threads }] =
    await Promise.all([
      supabase
        .from("forum_categories")
        .select("slug, name, description")
        .eq("slug", category)
        .single(),
      supabase
        .from("forum_categories")
        .select("slug, name")
        .order("sort_order"),
      supabase
        .from("forum_threads")
        .select(
          `id, slug, title, category_slug, pinned, locked, last_activity_at,
           profiles!forum_threads_author_id_fkey(full_name, avatar_url),
           forum_posts(count)`,
        )
        .eq("category_slug", category)
        .is("deleted_at", null)
        .order("pinned", { ascending: false })
        .order("last_activity_at", { ascending: false })
        .limit(50),
    ]);

  if (!currentCat) notFound();

  const typedThreads = (threads ?? []) as unknown as ThreadRow[];

  return (
    <Container className="py-16">
      {/* Page header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <Link
            href="/forums"
            className="text-xs font-body uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors mb-3 inline-block"
          >
            ← All Forums
          </Link>
          <h1 className="font-display text-5xl font-extrabold tracking-tight text-on-surface mb-3">
            {currentCat.name}
          </h1>
          {currentCat.description && (
            <p className="font-body text-xl text-on-surface-variant max-w-lg">
              {currentCat.description}
            </p>
          )}
        </div>
        <Button asChild size="lg">
          <Link href={`/forums/${category}/new`}>
            <PlusCircle strokeWidth={1.5} className="w-5 h-5" />
            Ask a question
          </Link>
        </Button>
      </header>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2 mb-10">
        <Link
          href="/forums"
          className="px-6 py-2.5 rounded-full bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high transition-colors font-body text-sm"
        >
          All
        </Link>
        {(categories ?? []).map((cat) => (
          <Link
            key={cat.slug}
            href={`/forums/${cat.slug}`}
            className={[
              "px-6 py-2.5 rounded-full font-body text-sm transition-colors",
              cat.slug === category
                ? "bg-primary text-on-primary"
                : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high",
            ].join(" ")}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {/* Thread list */}
      <div className="space-y-1">
        {typedThreads.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <p className="text-on-surface-variant font-body text-lg">
              No discussions in {currentCat.name} yet.
            </p>
            <Button asChild>
              <Link href={`/forums/${category}/new`}>Start the first one</Link>
            </Button>
          </div>
        ) : (
          typedThreads.map((thread) => (
            <CategoryThreadRow key={thread.id} thread={thread} />
          ))
        )}
      </div>
    </Container>
  );
}

function CategoryThreadRow({ thread }: { thread: ThreadRow }) {
  const replyCount = thread.forum_posts[0]?.count ?? 0;
  const initials = (thread.profiles?.full_name ?? "?")
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
        "transition-colors rounded-2xl p-6",
        "flex flex-col md:flex-row gap-6 items-start group",
        thread.pinned ? "border-l-4 border-primary" : "",
      ].join(" ")}
    >
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-3">
          {thread.pinned && (
            <span className="text-[10px] font-body font-black uppercase tracking-wider px-2 py-1 rounded-md bg-primary/10 text-primary">
              Pinned
            </span>
          )}
          {thread.locked && (
            <span className="text-[10px] font-body font-black uppercase tracking-wider px-2 py-1 rounded-md bg-surface-container-highest text-on-surface-variant">
              Locked
            </span>
          )}
        </div>
        <h2 className="font-display text-xl font-bold mb-4 text-on-surface group-hover:text-primary transition-colors">
          {thread.title}
        </h2>
        <div className="flex items-center gap-4 text-sm text-on-surface-variant font-body">
          <div className="flex items-center gap-2">
            {thread.profiles?.avatar_url ? (
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
              {thread.profiles?.full_name ?? "Unknown"}
            </span>
          </div>
          <span>• {formatRelativeTime(thread.last_activity_at)}</span>
        </div>
      </div>

      <div className="flex md:flex-col items-center gap-6 self-center md:self-stretch justify-center border-t md:border-t-0 md:border-l border-surface-variant pt-4 md:pt-0 md:pl-8 shrink-0">
        <div className="text-center">
          <div className="font-display font-bold text-lg text-on-surface">
            {replyCount}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-on-surface-variant font-body">
            Replies
          </div>
        </div>
      </div>
    </Link>
  );
}
