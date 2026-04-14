import Link from "next/link";
import Image from "next/image";
import { PlusCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { formatRelativeTime } from "@/lib/utils/format-time";

export const metadata = {
  title: "Success Stories — Hoddle",
  description:
    "Real accounts from international students who found their footing in Melbourne.",
};

type StoryRow = {
  id: string;
  slug: string;
  title: string;
  body: string;
  hero_image_url: string | null;
  milestones: string[];
  featured: boolean;
  published_at: string;
  profiles: { full_name: string | null; avatar_url: string | null; university: string | null } | null;
};

export default async function StoriesPage() {
  const supabase = await createClient();

  const { data: stories } = await supabase
    .from("success_stories")
    .select(
      `id, slug, title, body, hero_image_url, milestones, featured, published_at,
       profiles!success_stories_author_id_fkey(full_name, avatar_url, university)`,
    )
    .eq("status", "published")
    .not("published_at", "is", null)
    .order("featured", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(24);

  const typedStories = (stories ?? []) as unknown as StoryRow[];
  const featured = typedStories.filter((s) => s.featured).slice(0, 2);
  const rest = typedStories.filter((s) => !s.featured || featured.length < 2 ? !featured.includes(s) : true);

  const hasStories = typedStories.length > 0;

  return (
    <Container className="py-16">
      {/* Page header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div className="max-w-xl">
          <p className="font-body text-xs font-bold uppercase tracking-[0.14em] text-secondary mb-4">
            Community
          </p>
          <h1 className="font-display text-5xl font-extrabold tracking-tight text-on-surface mb-4 leading-[1.05]">
            Stories from our community
          </h1>
          <p className="font-body text-xl text-on-surface-variant leading-relaxed">
            Real accounts from international students who found their footing in
            Melbourne — and the moments that made the difference.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/stories/new">
            <PlusCircle strokeWidth={1.5} className="w-5 h-5" aria-hidden="true" />
            Share your story
          </Link>
        </Button>
      </header>

      {!hasStories ? (
        <EmptyState />
      ) : (
        <>
          {/* Featured stories — larger editorial cards */}
          {featured.length > 0 && (
            <section className="mb-16">
              <h2 className="text-xs font-body uppercase tracking-widest text-on-surface-variant mb-8 flex items-center gap-2">
                <span className="w-6 h-px bg-outline-variant" />
                Featured
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featured.map((story) => (
                  <FeaturedStoryCard key={story.id} story={story} />
                ))}
              </div>
            </section>
          )}

          {/* Remaining stories grid */}
          {rest.length > 0 && (
            <section>
              {featured.length > 0 && (
                <h2 className="text-xs font-body uppercase tracking-widest text-on-surface-variant mb-8 flex items-center gap-2">
                  <span className="w-6 h-px bg-outline-variant" />
                  More stories
                </h2>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map((story) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Submit CTA */}
      <section className="mt-24 rounded-2xl bg-primary px-10 py-14 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h2 className="font-display text-3xl font-bold text-on-primary mb-3">
            Ready to share your own success story?
          </h2>
          <p className="font-body text-on-primary/70 max-w-md leading-relaxed">
            Your experience could be exactly what another first-year student
            needs to hear. Stories are reviewed before publishing.
          </p>
        </div>
        <Button asChild variant="secondary" size="lg" className="shrink-0">
          <Link href="/stories/new">Get started</Link>
        </Button>
      </section>
    </Container>
  );
}

// ── Featured card ─────────────────────────────────────────────────────────────

function FeaturedStoryCard({ story }: { story: StoryRow }) {
  const author = story.profiles;
  const initials = (author?.full_name ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const excerpt = story.body.slice(0, 160).trimEnd();

  return (
    <Link
      href={`/stories/${story.slug}`}
      className="group block relative rounded-2xl overflow-hidden bg-surface-container-lowest shadow-ambient hover:shadow-ambient-lg transition-all duration-300 hover:-translate-y-0.5"
    >
      {/* Hero image */}
      <div className="relative h-64 w-full">
        {story.hero_image_url ? (
          <Image
            src={story.hero_image_url}
            alt={story.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          /* IMAGE NEEDED
             Target path: public/images/story-hero-placeholder.webp
             Prompt: A young international university student sitting at a sunny Melbourne café table, smiling, with a laptop and flat white coffee. Warm editorial light, soft bokeh background of city streetscape. editorial photography, soft natural light, warm tones, shallow depth of field, shot on 35mm film, slightly desaturated, cream and warm brown palette with cool blue accents, Kinfolk magazine aesthetic, no text overlays, no logos
             Alt: Story hero image
             Export: WebP quality 80, max 200 KB, 16:9 crop */
          <div className="w-full h-full bg-gradient-to-br from-primary-container to-primary/20" />
        )}
        {/* Blue-tint overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-primary/10 to-transparent" />

        {/* Milestone chips over image */}
        {story.milestones.length > 0 && (
          <div className="absolute bottom-4 left-4 flex flex-wrap gap-1.5">
            {story.milestones.slice(0, 2).map((m) => (
              <span
                key={m}
                className="font-body text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-on-primary/10 text-on-primary backdrop-blur-sm"
              >
                {m}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-7">
        <h3 className="font-display text-xl font-bold text-on-surface leading-snug mb-3 group-hover:text-primary transition-colors line-clamp-2">
          {story.title}
        </h3>
        <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-5 line-clamp-3">
          {excerpt}
          {story.body.length > 160 ? "…" : ""}
        </p>

        {/* Author */}
        <AuthorRow author={author} initials={initials} publishedAt={story.published_at} />
      </div>
    </Link>
  );
}

// ── Regular story card ────────────────────────────────────────────────────────

function StoryCard({ story }: { story: StoryRow }) {
  const author = story.profiles;
  const initials = (author?.full_name ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const excerpt = story.body.slice(0, 120).trimEnd();

  return (
    <Link
      href={`/stories/${story.slug}`}
      className="group flex flex-col rounded-2xl bg-surface-container-lowest overflow-hidden shadow-ambient hover:shadow-ambient-lg transition-all duration-300 hover:-translate-y-0.5"
    >
      {/* Hero image */}
      <div className="relative h-44 w-full shrink-0">
        {story.hero_image_url ? (
          <Image
            src={story.hero_image_url}
            alt={story.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          /* IMAGE NEEDED
             Target path: public/images/story-card-placeholder.webp
             Prompt: Overhead flat-lay of an open journal with handwritten notes, a fountain pen, and a flat white coffee on a timber café table. Warm natural light, cream and warm brown tones, editorial thirds composition. editorial photography, soft natural light, warm tones, shallow depth of field, shot on 35mm film, slightly desaturated, cream and warm brown palette with cool blue accents, Kinfolk magazine aesthetic, no text overlays, no logos
             Alt: Story card image
             Export: WebP quality 80, max 80 KB, 4:3 crop */
          <div className="w-full h-full bg-gradient-to-br from-surface-container to-primary-container/40" />
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-6">
        {story.milestones.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {story.milestones.slice(0, 2).map((m) => (
              <Tag key={m} variant="success" className="text-[10px]">
                {m}
              </Tag>
            ))}
          </div>
        )}

        <h3 className="font-display text-base font-bold text-on-surface leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2 flex-1">
          {story.title}
        </h3>
        <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-4 line-clamp-2">
          {excerpt}
          {story.body.length > 120 ? "…" : ""}
        </p>

        <AuthorRow author={author} initials={initials} publishedAt={story.published_at} />
      </div>
    </Link>
  );
}

// ── Author row ────────────────────────────────────────────────────────────────

function AuthorRow({
  author,
  initials,
  publishedAt,
}: {
  author: StoryRow["profiles"];
  initials: string;
  publishedAt: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {author?.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={author.avatar_url}
          alt={author.full_name ?? ""}
          className="w-8 h-8 rounded-full object-cover"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-[10px] font-bold text-primary/70 shrink-0">
          {initials}
        </div>
      )}
      <div>
        <p className="font-body text-sm font-semibold text-on-surface leading-none">
          {author?.full_name ?? "Community member"}
        </p>
        {author?.university && (
          <p className="font-body text-[11px] text-on-surface-variant mt-0.5">
            {author.university}
          </p>
        )}
      </div>
      <span className="ml-auto font-body text-[11px] text-on-surface-variant shrink-0">
        {formatRelativeTime(publishedAt)}
      </span>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="py-20 flex flex-col items-center text-center gap-8">
      <div className="relative w-64 h-40 rounded-2xl overflow-hidden">
        <Image
          src="/images/empty-state-library.webp"
          alt="Students at the State Library — no stories yet"
          fill
          className="object-cover"
        />
      </div>
      <div>
        <h2 className="font-display text-2xl font-bold text-on-surface mb-3">
          No stories yet
        </h2>
        <p className="font-body text-on-surface-variant max-w-sm leading-relaxed">
          Be the first to share your Melbourne journey. Your story could inspire
          the next student who lands here.
        </p>
      </div>
      <Button asChild size="lg">
        <Link href="/stories/new">
          <PlusCircle strokeWidth={1.5} className="w-5 h-5" aria-hidden="true" />
          Share your story
        </Link>
      </Button>
    </div>
  );
}
