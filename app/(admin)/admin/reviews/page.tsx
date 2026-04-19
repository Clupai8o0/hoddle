import Link from "next/link";
import Image from "next/image";
import { MessageSquareQuote, Plus } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { StarRow } from "@/components/ui/star-row";
import { createClient } from "@/lib/supabase/server";
import { DeleteReviewButton } from "./delete-review-button";

export const metadata = { title: "Reviews — Admin" };
export const dynamic = "force-dynamic";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function AdminReviewsPage() {
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, author_name, author_context, avatar_url, rating, content, published, display_order, created_at")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  const rows = reviews ?? [];

  return (
    <Container className="py-10 sm:py-16">
      <nav aria-label="Breadcrumb" className="font-body text-sm text-on-surface-variant mb-3">
        <Link href="/admin" className="hover:text-primary transition-colors">
          Admin
        </Link>
        {" / "}
        <span className="text-on-surface">Reviews</span>
      </nav>

      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-12">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-primary mb-2">
            Reviews
          </h1>
          <p className="font-body text-on-surface-variant text-base sm:text-lg">
            Platform testimonials shown on the homepage.
          </p>
        </div>
        <Button variant="primary" size="default" asChild>
          <Link href="/admin/reviews/new" className="gap-2">
            <Plus size={16} strokeWidth={1.5} aria-hidden="true" />
            New review
          </Link>
        </Button>
      </header>

      {rows.length === 0 ? (
        <div className="bg-surface-container rounded-xl p-10 sm:p-16 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center mb-5">
            <MessageSquareQuote size={22} strokeWidth={1.5} className="text-primary" aria-hidden="true" />
          </div>
          <h2 className="font-display font-bold text-xl text-on-surface mb-2">
            No reviews yet
          </h2>
          <p className="font-body text-on-surface-variant max-w-sm mb-6">
            Add your first student testimonial. It will appear on the homepage once published.
          </p>
          <Button variant="primary" size="default" asChild>
            <Link href="/admin/reviews/new">Add the first review</Link>
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {rows.map((r) => (
            <li
              key={r.id}
              className="bg-surface-container rounded-xl p-6 flex flex-col md:flex-row md:items-start gap-5"
            >
              <div className="w-14 h-14 rounded-full overflow-hidden bg-primary-container flex items-center justify-center shrink-0">
                {r.avatar_url ? (
                  <Image
                    src={r.avatar_url}
                    alt={r.author_name}
                    width={56}
                    height={56}
                    className="w-14 h-14 object-cover"
                  />
                ) : (
                  <span className="font-display font-bold text-sm text-primary select-none">
                    {initials(r.author_name)}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="font-display font-semibold text-on-surface text-base">
                    {r.author_name}
                  </p>
                  {r.published ? (
                    <span className="font-body text-xs font-semibold text-on-secondary-container bg-secondary-container px-2 py-0.5 rounded-full">
                      Published
                    </span>
                  ) : (
                    <span className="font-body text-xs font-semibold text-on-surface-variant bg-outline-variant/40 px-2 py-0.5 rounded-full">
                      Draft
                    </span>
                  )}
                  <span className="font-body text-xs text-on-surface-variant">
                    order: {r.display_order}
                  </span>
                </div>
                {r.author_context && (
                  <p className="font-body text-sm text-on-surface-variant mb-2">
                    {r.author_context}
                  </p>
                )}
                <StarRow rating={r.rating} className="mb-2" />
                <p className="font-body text-sm text-on-surface leading-relaxed line-clamp-2">
                  &ldquo;{r.content}&rdquo;
                </p>
              </div>

              <div className="flex md:flex-col md:items-end gap-3 md:gap-2 shrink-0">
                <Link
                  href={`/admin/reviews/${r.id}/edit`}
                  aria-label={`Edit review by ${r.author_name}`}
                  className="font-body text-sm font-semibold text-primary hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary rounded-sm"
                >
                  Edit →
                </Link>
                <DeleteReviewButton id={r.id} authorName={r.author_name} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
