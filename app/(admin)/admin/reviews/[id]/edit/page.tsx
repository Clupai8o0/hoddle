import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { createClient } from "@/lib/supabase/server";
import { AdminReviewForm } from "../../admin-review-form";

export const metadata = { title: "Edit review — Admin" };
export const dynamic = "force-dynamic";

export default async function EditReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: review } = await supabase
    .from("reviews")
    .select("id, author_name, author_context, avatar_url, rating, content, published, display_order")
    .eq("id", id)
    .single();

  if (!review) notFound();

  return (
    <Container className="py-10 sm:py-16">
      <div className="max-w-2xl">
        <nav aria-label="Breadcrumb" className="font-body text-sm text-on-surface-variant mb-3">
          <Link href="/admin" className="hover:text-primary transition-colors">
            Admin
          </Link>
          {" / "}
          <Link href="/admin/reviews" className="hover:text-primary transition-colors">
            Reviews
          </Link>
          {" / "}
          <span className="text-on-surface">Edit</span>
        </nav>

        <h1 className="font-display text-3xl sm:text-4xl font-bold text-primary mb-2">
          Edit review
        </h1>
        <p className="font-body text-on-surface-variant text-base sm:text-lg mb-8 sm:mb-10">
          Update the testimonial for {review.author_name}.
        </p>

        <AdminReviewForm
          mode="edit"
          reviewId={review.id}
          defaultValues={{
            author_name: review.author_name,
            author_context: review.author_context ?? "",
            rating: review.rating,
            content: review.content,
            published: review.published,
            display_order: review.display_order,
          }}
          currentAvatarUrl={review.avatar_url}
        />
      </div>
    </Container>
  );
}
