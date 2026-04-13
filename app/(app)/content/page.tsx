import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/container";
import { ContentCard, type ContentCardData } from "@/components/patterns/content-card";
import Link from "next/link";

export const metadata = { title: "Content Library — Hoddle" };

const TYPE_FILTERS = [
  { value: "article", label: "Articles" },
  { value: "video", label: "Videos" },
  { value: "resource", label: "Resources" },
] as const;

interface PageProps {
  searchParams: Promise<{ type?: string; tag?: string }>;
}

export default async function ContentPage({ searchParams }: PageProps) {
  const { type: typeFilter, tag: tagFilter } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("content_items")
    .select(
      `slug, type, title, excerpt, hero_image_url, view_count, published_at,
       mentors!content_items_mentor_id_fkey (
         slug,
         profiles!mentors_profile_id_fkey (
           full_name, avatar_url
         )
       ),
       content_item_tags ( tag_slug )`
    )
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(48);

  if (typeFilter) {
    // Narrow string to the DB enum type — invalid values return no results
    query = query.eq("type", typeFilter as "article" | "video" | "resource");
  }

  const { data: items } = await query;

  // Tag filter applied after fetch to avoid join-filter complexity
  const filtered =
    tagFilter
      ? (items ?? []).filter((item) =>
          item.content_item_tags.some((t) => t.tag_slug === tagFilter)
        )
      : (items ?? []);

  const typedItems = filtered as unknown as ContentCardData[];

  return (
    <Container className="py-16">
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-display text-4xl font-bold text-primary mb-3">
          Content library
        </h1>
        <p className="font-body text-on-surface-variant max-w-xl">
          Guides, articles, and videos from mentors who&apos;ve navigated exactly
          what you&apos;re going through.
        </p>
      </div>

      {/* Type filter tabs */}
      <div className="flex flex-wrap gap-2 mb-10">
        <Link
          href="/content"
          className={`font-body text-sm px-4 py-1.5 rounded-full transition-colors ${
            !typeFilter
              ? "bg-primary text-on-primary"
              : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          All
        </Link>
        {TYPE_FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/content?type=${f.value}${tagFilter ? `&tag=${tagFilter}` : ""}`}
            className={`font-body text-sm px-4 py-1.5 rounded-full transition-colors ${
              typeFilter === f.value
                ? "bg-primary text-on-primary"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Grid */}
      {typedItems.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-display text-xl font-semibold text-on-surface mb-2">
            Nothing here yet
          </p>
          <p className="font-body text-on-surface-variant">
            {typeFilter || tagFilter
              ? "Try a different filter."
              : "Mentors are working on content — check back soon."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {typedItems.map((item) => (
            <ContentCard key={item.slug} item={item} />
          ))}
        </div>
      )}
    </Container>
  );
}
