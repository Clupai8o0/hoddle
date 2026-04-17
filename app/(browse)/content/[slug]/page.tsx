import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/container";
import { Tag } from "@/components/ui/tag";
import { MarkdownRenderer } from "@/components/patterns/markdown-renderer";
import { ViewTracker } from "./view-tracker";
import { ContentCard, type ContentCardData } from "@/components/patterns/content-card";
import { getVideoEmbedUrl } from "@/lib/utils/video-embed";
import { CheckCircle, Download, FileText, ExternalLink } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
    .from("content_items")
    .select("title, excerpt, hero_image_url")
    .eq("slug", slug)
    .not("published_at", "is", null)
    .maybeSingle();
  if (!data) return { title: "Content — Hoddle" };

  const title = `${data.title} — Hoddle`;
  const description = data.excerpt ?? "Advice and stories from a Hoddle mentor.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      ...(data.hero_image_url
        ? { images: [{ url: data.hero_image_url, width: 1200, height: 630 }] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(data.hero_image_url ? { images: [data.hero_image_url] } : {}),
    },
  };
}

export default async function ContentArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("content_items")
    .select(
      `id, type, title, excerpt, body, hero_image_url, video_url,
       view_count, published_at, mentor_id,
       mentors!content_items_mentor_id_fkey (
         slug, headline, bio,
         verified_at,
         profiles!mentors_profile_id_fkey (
           full_name, avatar_url, university
         )
       ),
       content_resources ( id, label, file_path, file_size_bytes ),
       content_item_tags ( tag_slug )`
    )
    .eq("slug", slug)
    .not("published_at", "is", null)
    .maybeSingle();

  if (!item) notFound();

  const mentor = item.mentors as {
    slug: string;
    headline: string | null;
    bio: string | null;
    verified_at: string | null;
    profiles: {
      full_name: string | null;
      avatar_url: string | null;
      university: string | null;
    } | null;
  } | null;

  const mentorName = mentor?.profiles?.full_name ?? "Mentor";
  const mentorInitials = mentorName
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  const resources = item.content_resources as {
    id: string;
    label: string;
    file_path: string;
    file_size_bytes: number;
  }[];

  // Generate signed URLs for downloadable resources
  const resourcesWithUrls = await Promise.all(
    resources.map(async (r) => {
      const { data } = await supabase.storage
        .from("content-resources")
        .createSignedUrl(r.file_path, 60 * 60); // 1h expiry
      return { ...r, signedUrl: data?.signedUrl ?? null };
    })
  );

  // Fetch related content (same tags, exclude current)
  const tagSlugs = item.content_item_tags.map((t) => t.tag_slug);
  const { data: related } = tagSlugs.length
    ? await supabase
        .from("content_items")
        .select(
          `slug, type, title, excerpt, hero_image_url, view_count, published_at,
           mentors!content_items_mentor_id_fkey (
             slug,
             profiles!mentors_profile_id_fkey ( full_name, avatar_url )
           ),
           content_item_tags ( tag_slug )`
        )
        .not("published_at", "is", null)
        .neq("slug", slug)
        .limit(3)
    : { data: [] };

  const embedUrl =
    item.type === "video" && item.video_url
      ? getVideoEmbedUrl(item.video_url)
      : null;

  return (
    <Container className="py-8 sm:py-12 lg:py-16">
      <ViewTracker contentId={item.id} />

      {/* Article structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: item.title,
            description: item.excerpt ?? undefined,
            image: item.hero_image_url ?? undefined,
            datePublished: item.published_at,
            author: { "@type": "Person", name: mentorName },
            publisher: { "@type": "Organization", name: "Hoddle Melbourne" },
          }).replace(/</g, "\\u003c").replace(/>/g, "\\u003e"),
        }}
      />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-body text-xs text-on-surface-variant mb-8 uppercase tracking-wider">
        <Link href="/content" className="hover:text-primary transition-colors">
          Library
        </Link>
        <span aria-hidden="true">›</span>
        <span className="text-on-surface/60 truncate max-w-[240px]">{item.title}</span>
      </nav>

      {/* Title block */}
      <div className="max-w-3xl mb-10">
        {item.content_item_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {item.content_item_tags.slice(0, 3).map((t) => (
              <Tag key={t.tag_slug} variant="success" className="text-[10px]">
                {t.tag_slug.replace(/_/g, " ")}
              </Tag>
            ))}
          </div>
        )}
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-on-surface leading-[1.1] tracking-tight mb-8">
          {item.title}
        </h1>

        {/* Byline */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-5 border-y border-outline-variant/20">
          <Link href={`/mentors/${mentor?.slug ?? ""}`} className="flex items-center gap-3 group">
            {mentor?.profiles?.avatar_url ? (
              <Image
                src={mentor.profiles.avatar_url}
                alt={mentorName}
                width={44}
                height={44}
                className="w-11 h-11 rounded-full object-cover"
              />
            ) : (
              <span className="w-11 h-11 rounded-full bg-primary-container flex items-center justify-center font-display font-bold text-sm text-primary/60">
                {mentorInitials}
              </span>
            )}
            <div>
              <p className="font-body font-semibold text-sm text-on-surface group-hover:text-primary transition-colors">
                {mentorName}
              </p>
              {item.published_at && (
                <p className="font-body text-xs text-on-surface-variant">
                  {formatPublished(item.published_at)}
                  {item.view_count > 0 && ` · ${item.view_count.toLocaleString()} views`}
                </p>
              )}
            </div>
          </Link>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        {/* ── Article body ── */}
        <article className="lg:col-span-8">
          {/* Hero image or video */}
          {embedUrl ? (
            <div className="aspect-video w-full rounded-2xl overflow-hidden mb-10">
              <iframe
                src={embedUrl}
                title={item.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          ) : item.hero_image_url ? (
            <div className="aspect-video w-full rounded-2xl overflow-hidden mb-10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.hero_image_url}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden mb-10">
              <Image
                src="/images/content-hero-placeholder.webp"
                alt="Article hero image"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 67vw"
                priority
              />
            </div>
          )}

          {/* Excerpt / standfirst */}
          {item.excerpt && (
            <p className="font-body text-xl font-medium text-on-surface leading-relaxed italic mb-8">
              {item.excerpt}
            </p>
          )}

          {/* Article body — Markdown */}
          {item.body && (
            <div className="prose-hoddle">
              <MarkdownRenderer content={item.body} />
            </div>
          )}
        </article>

        {/* ── Sidebar ── */}
        <aside className="lg:col-span-4">
          <div className="sticky top-24 flex flex-col gap-6">
            {/* Mentor card */}
            {mentor && (
              <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-ambient">
                <div className="relative mb-4">
                  {mentor.profiles?.avatar_url ? (
                    <Image
                      src={mentor.profiles.avatar_url}
                      alt={mentorName}
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-xl object-cover"
                    />
                  ) : (
                    <span className="w-20 h-20 rounded-xl bg-primary-container flex items-center justify-center font-display font-bold text-2xl text-primary/40">
                      {mentorInitials}
                    </span>
                  )}
                  {mentor.verified_at && (
                    <span className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <CheckCircle size={14} strokeWidth={2} className="text-on-secondary" aria-label="Verified mentor" />
                    </span>
                  )}
                </div>

                <p className="font-display font-bold text-lg text-on-surface mb-0.5">
                  {mentorName}
                </p>
                {mentor.headline && (
                  <p className="font-body text-sm text-secondary font-medium mb-3">
                    {mentor.headline}
                  </p>
                )}
                {mentor.profiles?.university && (
                  <p className="font-body text-xs text-on-surface-variant mb-4">
                    {mentor.profiles.university}
                  </p>
                )}

                <Link
                  href={`/mentors/${mentor.slug}`}
                  className="inline-flex items-center gap-1.5 font-body text-sm font-semibold text-primary hover:gap-2.5 transition-all"
                >
                  View full profile
                  <ExternalLink size={13} strokeWidth={1.5} aria-hidden="true" />
                </Link>

                {/* Downloadable resources */}
                {resourcesWithUrls.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-outline-variant/20">
                    <p className="font-body text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-3">
                      Resources
                    </p>
                    <div className="flex flex-col gap-2">
                      {resourcesWithUrls.map((r) => (
                        r.signedUrl ? (
                          <a
                            key={r.id}
                            href={r.signedUrl}
                            download
                            className="flex items-center justify-between px-4 py-3 rounded-xl bg-surface-container-high hover:bg-primary-container hover:text-on-primary-container transition-colors group"
                          >
                            <span className="flex items-center gap-2.5">
                              <FileText size={14} strokeWidth={1.5} className="text-on-surface-variant group-hover:text-primary transition-colors" aria-hidden="true" />
                              <span className="font-body text-sm font-medium text-on-surface group-hover:text-on-primary-container transition-colors">
                                {r.label}
                              </span>
                            </span>
                            <span className="flex items-center gap-1.5 text-on-surface-variant group-hover:text-primary transition-colors">
                              <span className="font-body text-[10px]">{formatBytes(r.file_size_bytes)}</span>
                              <Download size={13} strokeWidth={1.5} aria-hidden="true" />
                            </span>
                          </a>
                        ) : (
                          <div key={r.id} className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-surface-container-high opacity-50 cursor-not-allowed">
                            <FileText size={14} strokeWidth={1.5} className="text-on-surface-variant" aria-hidden="true" />
                            <span className="font-body text-sm font-medium text-on-surface">{r.label}</span>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Back to library */}
            <Link
              href="/content"
              className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors text-center"
            >
              ← Back to library
            </Link>
          </div>
        </aside>
      </div>

      {/* Continue Learning */}
      {related && related.length > 0 && (
        <section className="mt-24 pt-12 border-t border-outline-variant/20">
          <h2 className="font-display text-2xl font-bold text-on-surface mb-8">
            Continue learning
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(related as unknown as ContentCardData[]).map((r) => (
              <ContentCard key={r.slug} item={r} />
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}
