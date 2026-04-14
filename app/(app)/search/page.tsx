import Link from "next/link";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/container";
import { Tag } from "@/components/ui/tag";

export const metadata = { title: "Search — Hoddle" };

const PAGE_SIZE = 8;

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const supabase = await createClient();

  type MentorResult = {
    slug: string;
    headline: string | null;
    expertise: string[];
    profiles: { full_name: string | null; university: string | null } | null;
  };
  type ContentResult = {
    slug: string;
    title: string;
    type: string;
    excerpt: string | null;
  };
  type ThreadResult = {
    slug: string;
    title: string;
    category_slug: string;
    profiles: { full_name: string | null } | null;
  };

  let mentors: MentorResult[] = [];
  let content: ContentResult[] = [];
  let threads: ThreadResult[] = [];
  let totalMentors = 0;
  let totalContent = 0;
  let totalThreads = 0;

  if (query.length >= 2) {
    const term = `%${query}%`;

    const [
      { data: mentorData, count: mCount },
      { data: contentData, count: cCount },
      { data: threadData, count: tCount },
    ] = await Promise.all([
      supabase
        .from("mentors")
        .select(
          `slug, headline, expertise,
           profiles!mentors_profile_id_fkey(full_name, university)`,
          { count: "exact" },
        )
        .not("verified_at", "is", null)
        .or(
          `headline.ilike.${term},bio.ilike.${term},` +
            `profiles.full_name.ilike.${term}`,
        )
        .limit(PAGE_SIZE),

      supabase
        .from("content_items")
        .select("slug, title, type, excerpt", { count: "exact" })
        .not("published_at", "is", null)
        .or(`title.ilike.${term},excerpt.ilike.${term}`)
        .order("published_at", { ascending: false })
        .limit(PAGE_SIZE),

      supabase
        .from("forum_threads")
        .select(
          `slug, title, category_slug,
           profiles!forum_threads_author_id_fkey(full_name)`,
          { count: "exact" },
        )
        .is("deleted_at", null)
        .or(`title.ilike.${term},body.ilike.${term}`)
        .order("last_activity_at", { ascending: false })
        .limit(PAGE_SIZE),
    ]);

    mentors = (mentorData ?? []) as unknown as MentorResult[];
    content = (contentData ?? []) as ContentResult[];
    threads = (threadData ?? []) as unknown as ThreadResult[];
    totalMentors = mCount ?? 0;
    totalContent = cCount ?? 0;
    totalThreads = tCount ?? 0;
  }

  const totalResults = totalMentors + totalContent + totalThreads;
  const hasQuery = query.length >= 2;
  const hasResults = totalResults > 0;

  return (
    <Container className="py-16 max-w-3xl">
      {/* Search form */}
      <form method="GET" action="/search" className="mb-12">
        <label htmlFor="search-input" className="sr-only">
          Search Hoddle
        </label>
        <div className="relative">
          <Search
            size={18}
            strokeWidth={1.5}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="search-input"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Search mentors, articles, forums…"
            autoFocus={!query}
            autoComplete="off"
            className="w-full bg-surface-container-low rounded-2xl pl-11 pr-4 py-4 font-body text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 border-0 text-base"
          />
        </div>
      </form>

      {/* Empty / hint state */}
      {!hasQuery && (
        <p className="font-body text-on-surface-variant text-center py-8">
          Type at least 2 characters to search mentors, articles, and forum
          threads.
        </p>
      )}

      {hasQuery && !hasResults && (
        <p className="font-body text-on-surface-variant text-center py-8">
          No results for &ldquo;{query}&rdquo;. Try a different keyword.
        </p>
      )}

      {/* ── Mentors ────────────────────────────────────────────────────── */}
      {mentors.length > 0 && (
        <section className="mb-12">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-display text-xl font-bold text-primary">
              Mentors
            </h2>
            {totalMentors > PAGE_SIZE && (
              <Link
                href={`/mentors`}
                className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors"
              >
                View all
              </Link>
            )}
          </div>
          <div className="space-y-3">
            {mentors.map((m) => {
              const name =
                (m.profiles as { full_name: string | null } | null)
                  ?.full_name ?? "Mentor";
              const university =
                (
                  m.profiles as {
                    full_name: string | null;
                    university: string | null;
                  } | null
                )?.university;
              return (
                <Link
                  key={m.slug}
                  href={`/mentors/${m.slug}`}
                  className="flex items-start gap-4 p-4 rounded-xl bg-surface-container-lowest hover:shadow-ambient hover:-translate-y-px transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-on-surface">
                      {name}
                    </p>
                    {university && (
                      <p className="font-body text-xs text-on-surface-variant mt-0.5">
                        {university}
                      </p>
                    )}
                    {m.headline && (
                      <p className="font-body text-sm text-on-surface-variant mt-1 line-clamp-1">
                        {m.headline}
                      </p>
                    )}
                  </div>
                  {m.expertise.slice(0, 2).map((e) => (
                    <Tag key={e} variant="default" className="hidden sm:inline-flex text-[10px]">
                      {e}
                    </Tag>
                  ))}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Content ────────────────────────────────────────────────────── */}
      {content.length > 0 && (
        <section className="mb-12">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-display text-xl font-bold text-primary">
              Articles &amp; content
            </h2>
            {totalContent > PAGE_SIZE && (
              <Link
                href="/content"
                className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors"
              >
                View all
              </Link>
            )}
          </div>
          <div className="space-y-3">
            {content.map((item) => (
              <Link
                key={item.slug}
                href={`/content/${item.slug}`}
                className="flex items-start gap-4 p-4 rounded-xl bg-surface-container-lowest hover:shadow-ambient hover:-translate-y-px transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-on-surface line-clamp-1">
                    {item.title}
                  </p>
                  {item.excerpt && (
                    <p className="font-body text-sm text-on-surface-variant mt-1 line-clamp-2">
                      {item.excerpt}
                    </p>
                  )}
                </div>
                <Tag variant="muted" className="shrink-0 text-[10px]">
                  {item.type}
                </Tag>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Forum threads ──────────────────────────────────────────────── */}
      {threads.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-display text-xl font-bold text-primary">
              Forum threads
            </h2>
            {totalThreads > PAGE_SIZE && (
              <Link
                href="/forums"
                className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors"
              >
                View all
              </Link>
            )}
          </div>
          <div className="space-y-3">
            {threads.map((t) => {
              const authorName =
                (t.profiles as { full_name: string | null } | null)
                  ?.full_name ?? "Community member";
              return (
                <Link
                  key={t.slug}
                  href={`/forums/${t.category_slug}/${t.slug}`}
                  className="flex items-start gap-4 p-4 rounded-xl bg-surface-container-lowest hover:shadow-ambient hover:-translate-y-px transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-on-surface line-clamp-1">
                      {t.title}
                    </p>
                    <p className="font-body text-xs text-on-surface-variant mt-0.5">
                      by {authorName} · {t.category_slug.replace(/-/g, " ")}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </Container>
  );
}
