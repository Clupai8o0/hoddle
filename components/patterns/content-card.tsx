import Link from "next/link";
import Image from "next/image";

export interface ContentCardData {
  slug: string;
  type: string;
  title: string;
  excerpt: string | null;
  hero_image_url: string | null;
  view_count: number;
  published_at: string | null;
  mentors: {
    slug: string;
    profiles: {
      full_name: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
  content_item_tags: {
    tag_slug: string;
  }[];
}

function readTime(type: string): string {
  if (type === "video") return "Video";
  if (type === "resource") return "Resource";
  return "Article";
}

export function ContentCard({ item }: { item: ContentCardData }) {
  const mentorName = item.mentors?.profiles?.full_name ?? "Mentor";
  const mentorSlug = item.mentors?.slug ?? "";

  return (
    <div className="group relative flex flex-col bg-surface-container-lowest rounded-xl overflow-hidden transition-all duration-200 hover:shadow-ambient hover:-translate-y-px focus-within:ring-2 focus-within:ring-primary/30 focus-within:ring-offset-2 focus-within:ring-offset-surface">
      {/* Cover link — spans entire card, sits below the author link */}
      <Link
        href={`/content/${item.slug}`}
        className="absolute inset-0 z-0 focus-visible:outline-none"
        aria-label={item.title}
        tabIndex={0}
      />

      {/* Hero image */}
      <div className="relative aspect-[4/3] bg-primary-container overflow-hidden pointer-events-none">
        {item.hero_image_url ? (
          <Image
            src={item.hero_image_url}
            alt={item.title}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <Image
            src="/images/content-card-placeholder.webp"
            alt="Content article illustration"
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        )}
        <span className="absolute top-3 left-3 bg-surface/90 backdrop-blur-sm font-body text-[10px] font-semibold uppercase tracking-wider text-on-surface px-2.5 py-1 rounded-full">
          {readTime(item.type)}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2 p-5 flex-1">
        <p className="font-display font-semibold text-on-surface group-hover:text-primary transition-colors line-clamp-2 leading-snug">
          {item.title}
        </p>
        {item.excerpt && (
          <p className="font-body text-sm text-on-surface-variant line-clamp-2 leading-snug">
            {item.excerpt}
          </p>
        )}

        {/* Footer: author + views */}
        <div className="flex items-center justify-between mt-auto pt-3">
          {/* Author link — sits above the cover link via z-10 */}
          <Link
            href={`/mentors/${mentorSlug}`}
            className="relative z-10 flex items-center gap-2 group/author"
            tabIndex={0}
          >
            {item.mentors?.profiles?.avatar_url ? (
              <Image
                src={item.mentors.profiles.avatar_url}
                alt={mentorName}
                width={24}
                height={24}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <span className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center font-display text-[10px] font-bold text-primary/60">
                {mentorName[0]?.toUpperCase()}
              </span>
            )}
            <span className="font-body text-xs text-on-surface-variant group-hover/author:text-primary transition-colors">
              {mentorName}
            </span>
          </Link>
          {item.view_count > 0 && (
            <span className="font-body text-xs text-on-surface-variant">
              {item.view_count.toLocaleString()} views
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
