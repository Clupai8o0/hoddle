import Link from "next/link";
import { Container } from "@/components/ui/container";
import { AdminReviewForm } from "../admin-review-form";

export const metadata = { title: "New review — Admin" };

export default function NewReviewPage() {
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
          <span className="text-on-surface">New</span>
        </nav>

        <h1 className="font-display text-3xl sm:text-4xl font-bold text-primary mb-2">
          New review
        </h1>
        <p className="font-body text-on-surface-variant text-base sm:text-lg mb-8 sm:mb-10">
          Add a student testimonial to display on the homepage.
        </p>

        <AdminReviewForm mode="create" />
      </div>
    </Container>
  );
}
