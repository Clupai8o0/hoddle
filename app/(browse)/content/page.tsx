import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/container";
import { ContentCard, type ContentCardData } from "@/components/patterns/content-card";
import { Pagination } from "@/components/ui/pagination";
import Link from "next/link";

export const metadata = { title: "Content Library — Hoddle" };

const TYPE_FILTERS = [
  { value: "article", label: "Articles" },
  { value: "video", label: "Videos" },
  { value: "resource", label: "Resources" },
] as const;

const PAGE_SIZE = 18;

interface PageProps {
  searchParams: Promise<{ type?: string; tag?: string; page?: string }>;
}

export default async function ContentPage({ searchParams }: PageProps) {
  const { type: typeFilter, tag: tagFilter, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

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
       content_item_tags ( tag_slug )`,
      { count: "exact" },
    )
    .not("published_at", "is", null)
    .order("published_at", { ascending: false });

  if (typeFilter) {
    query = query.eq("type", typeFilter as "article" | "video" | "resource");
  }

  // Tag filter applied client-side via JS because it's a nested join — we over-fetch
  // and slice after; counts are approximate when tag filter is active but close enough.
  const { data: allItems, count } = await query;

  const filtered =
    tagFilter
      ? (allItems ?? []).filter((item) =>
          item.content_item_tags.some((t) => t.tag_slug === tagFilter),
        )
      : (allItems ?? []);

  const total = tagFilter ? filtered.length : (count ?? 0);
  const typedItems = filtered.slice(offset, offset + PAGE_SIZE) as unknown as ContentCardData[];

  // Build base path for pagination (preserves type + tag filters)
  const filterParts: string[] = [];
  if (typeFilter) filterParts.push(`type=${typeFilter}`);
  if (tagFilter) filterParts.push(`tag=${tagFilter}`);
  const basePath = `/content${filterParts.length ? `?${filterParts.join("&")}` : ""}`;

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
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {typedItems.map((item) => (
              <ContentCard key={item.slug} item={item} />
            ))}
          </div>
          <Pagination
            page={page}
            total={total}
            pageSize={PAGE_SIZE}
            basePath={basePath}
          />
        </>
      )}
    </Container>
  );
}
