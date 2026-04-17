import { Plus, Eye, Pencil } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";

export const metadata = { title: "My Content — Hoddle" };
export const dynamic = "force-dynamic";

export default async function MentorContentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: items } = await supabase
    .from("content_items")
    .select("id, title, type, slug, view_count, published_at, created_at, excerpt")
    .eq("mentor_id", user!.id)
    .order("created_at", { ascending: false });

  const contentItems = items ?? [];
  const drafts = contentItems.filter((i) => !i.published_at);
  const published = contentItems.filter((i) => i.published_at);

  return (
    <div className="space-y-8 sm:space-y-10">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant mb-1">
            Your library
          </p>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary">My Content</h1>
        </div>
        <Button variant="primary" size="default" asChild>
          <Link href="/mentor/content/new">
            <Plus size={15} strokeWidth={1.5} aria-hidden="true" />
            <span>New article</span>
          </Link>
        </Button>
      </header>

      {contentItems.length === 0 ? (
        <div className="bg-surface-container-low rounded-xl p-10 text-center">
          <p className="font-body text-on-surface-variant">
            No content yet. Once you publish articles, videos, or resources they'll appear here.
          </p>
        </div>
      ) : (
        <>
          {drafts.length > 0 && (
            <section>
              <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant mb-4">
                Drafts ({drafts.length})
              </p>
              <ContentList items={drafts} />
            </section>
          )}

          {published.length > 0 && (
            <section>
              <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant mb-4">
                Published ({published.length})
              </p>
              <ContentList items={published} />
            </section>
          )}
        </>
      )}
    </div>
  );
}

type ContentItem = {
  id: string;
  title: string;
  type: string;
  slug: string;
  view_count: number;
  published_at: string | null;
  created_at: string;
  excerpt: string | null;
};

function ContentList({ items }: { items: ContentItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between bg-surface-container rounded-xl px-4 sm:px-5 py-4 sm:py-5 gap-3"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Tag variant={item.published_at ? "success" : "muted"} className="text-[10px] px-2 py-0.5">
                {item.published_at ? "Published" : "Draft"}
              </Tag>
              <span className="font-body text-[10px] uppercase tracking-[0.1em] text-on-surface-variant">
                {item.type}
              </span>
            </div>
            <p className="font-body font-medium text-sm text-on-surface truncate">
              {item.title}
            </p>
            {item.excerpt && (
              <p className="font-body text-xs text-on-surface-variant mt-1 line-clamp-1">
                {item.excerpt}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            <span className="hidden sm:flex items-center gap-1 font-body text-xs text-on-surface-variant">
              <Eye size={12} strokeWidth={1.5} aria-hidden="true" />
              {(item.view_count ?? 0).toLocaleString()}
            </span>
            <Link
              href={`/mentor/content/${item.id}/edit`}
              className="flex items-center gap-1.5 font-body text-xs text-on-surface-variant hover:text-primary transition-colors"
              aria-label={`Edit ${item.title}`}
            >
              <Pencil size={12} strokeWidth={1.5} aria-hidden="true" />
              <span className="hidden sm:inline">Edit</span>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
