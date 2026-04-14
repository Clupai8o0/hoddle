import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/container";
import { Tag } from "@/components/ui/tag";
import { formatRelativeTime } from "@/lib/utils/format-time";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function formatPublished(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("success_stories")
    .select("title, body")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!data) return { title: "Success Stories — Hoddle" };
  return {
    title: `${data.title} — Hoddle`,
    description: data.body.slice(0, 160).trimEnd(),
  };
}

export default async function StoryPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: story } = await supabase
    .from("success_stories")
    .select(
      `id, slug, title, body, hero_image_url, milestones, featured, published_at,
       profiles!success_stories_author_id_fkey(
         full_name, avatar_url, university, country_of_origin
       )`,
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!story) notFound();

  const author = story.profiles as {
    full_name: string | null;
    avatar_url: string | null;
    university: string | null;
    country_of_origin: string | null;
  } | null;

  const authorName = author?.full_name ?? "Community member";
  const authorInitials = authorName
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  // Related stories (published, excluding current)
  const { data: related } = await supabase
    .from("success_stories")
    .select(
      `id, slug, title, body, hero_image_url, milestones, published_at,
       profiles!success_stories_author_id_fkey(full_name, avatar_url, university)`,
    )
    .eq("status", "published")
    .neq("slug", slug)
    .order("published_at", { ascending: false })
    .limit(3);

  return (
    <Container className="py-12 lg:py-16">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 font-body text-xs text-on-surface-variant mb-8 uppercase tracking-wider"
      >
        <Link href="/stories" className="hover:text-primary transition-colors">
          Stories
        </Link>
        <span aria-hidden="true">›</span>
        <span className="text-on-surface/60 truncate max-w-[240px]">
          {story.title}
        </span>
      </nav>

      {/* Title block */}
      <div className="max-w-3xl mb-10">
        {story.milestones.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {story.milestones.map((m) => (
              <Tag key={m} variant="success" className="text-[10px]">
                {m}
              </Tag>
            ))}
          </div>
        )}

        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-on-surface leading-[1.1] tracking-tight mb-8">
          {story.title}
        </h1>

        {/* Byline */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-5 border-y border-outline-variant/20">
          <div className="flex items-center gap-3">
            {author?.avatar_url ? (
              <Image
                src={author.avatar_url}
                alt={authorName}
                width={44}
                height={44}
                className="w-11 h-11 rounded-full object-cover"
              />
            ) : (
              <span className="w-11 h-11 rounded-full bg-primary-container flex items-center justify-center font-display font-bold text-sm text-primary/60">
                {authorInitials}
              </span>
            )}
            <div>
              <p className="font-body font-semibold text-sm text-on-surface">
                {authorName}
              </p>
              <p className="font-body text-xs text-on-surface-variant">
                {[author?.university, author?.country_of_origin]
                  .filter(Boolean)
                  .join(" · ")}
                {story.published_at && (
                  <>
                    {" "}
                    · Published {formatPublished(story.published_at)}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        {/* ── Story body ── */}
        <article className="lg:col-span-8">
          {/* Hero image */}
          {story.hero_image_url ? (
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden mb-10">
              <Image
                src={story.hero_image_url}
                alt={story.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 67vw"
                priority
              />
            </div>
          ) : (
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden mb-10">
              <Image
                src="/images/story-hero-placeholder.webp"
                alt="Story hero image"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 67vw"
                priority
              />
            </div>
          )}

          {/* Story text */}
          <div className="font-body text-base leading-loose text-on-surface space-y-5">
            {story.body.split("\n\n").map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </article>

        {/* ── Sidebar ── */}
        <aside className="lg:col-span-4">
          <div className="sticky top-24 flex flex-col gap-6">
            {/* Author card */}
            <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-ambient">
              <div className="mb-4">
                {author?.avatar_url ? (
                  <Image
                    src={author.avatar_url}
                    alt={authorName}
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-xl object-cover"
                  />
                ) : (
                  <span className="w-20 h-20 rounded-xl bg-primary-container flex items-center justify-center font-display font-bold text-2xl text-primary/40">
                    {authorInitials}
                  </span>
                )}
              </div>

              <p className="font-display font-bold text-lg text-on-surface mb-0.5">
                {authorName}
              </p>
              {author?.university && (
                <p className="font-body text-sm text-on-surface-variant mb-1">
                  {author.university}
                </p>
              )}
              {author?.country_of_origin && (
                <p className="font-body text-xs text-on-surface-variant mb-4">
                  From {author.country_of_origin}
                </p>
              )}

              {story.published_at && (
                <p className="font-body text-xs text-on-surface-variant">
                  Published {formatRelativeTime(story.published_at)}
                </p>
              )}
            </div>

            {/* Milestones */}
            {story.milestones.length > 0 && (
              <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-ambient">
                <p className="font-body text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-4">
                  Milestones in this story
                </p>
                <div className="flex flex-col gap-2">
                  {story.milestones.map((m) => (
                    <div
                      key={m}
                      className="flex items-center gap-2.5 py-2 px-3 rounded-lg bg-secondary-container"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0" />
                      <span className="font-body text-sm text-secondary font-medium">
                        {m}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Back link */}
            <Link
              href="/stories"
              className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors text-center"
            >
              ← Back to stories
            </Link>
          </div>
        </aside>
      </div>

      {/* More stories */}
      {related && related.length > 0 && (
        <section className="mt-24 pt-12 border-t border-outline-variant/20">
          <h2 className="font-display text-2xl font-bold text-on-surface mb-8">
            More stories
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(
              related as unknown as {
                id: string;
                slug: string;
                title: string;
                body: string;
                hero_image_url: string | null;
                milestones: string[];
                published_at: string;
                profiles: {
                  full_name: string | null;
                  avatar_url: string | null;
                  university: string | null;
                } | null;
              }[]
            ).map((s) => {
              const a = s.profiles;
              const ini = (a?.full_name ?? "?")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              return (
                <Link
                  key={s.id}
                  href={`/stories/${s.slug}`}
                  className="group flex flex-col rounded-2xl bg-surface-container-lowest overflow-hidden shadow-ambient hover:shadow-ambient-lg transition-all hover:-translate-y-0.5"
                >
                  <div className="relative h-36 w-full shrink-0">
                    {s.hero_image_url ? (
                      <Image
                        src={s.hero_image_url}
                        alt={s.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-surface-container to-primary-container/40" />
                    )}
                  </div>
                  <div className="p-5 flex-1">
                    <h3 className="font-display text-sm font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2 mb-2">
                      {s.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-3">
                      {a?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={a.avatar_url}
                          alt={a.full_name ?? ""}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center text-[10px] font-bold text-primary/70 shrink-0">
                          {ini}
                        </div>
                      )}
                      <span className="font-body text-xs text-on-surface-variant line-clamp-1">
                        {a?.full_name ?? "Community member"}
                      </span>
                    </div>
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
