import Image from "next/image";
import { StarRow } from "@/components/ui/star-row";
import { cn } from "@/lib/utils/cn";

export interface Review {
  id: string;
  author_name: string;
  author_context: string | null;
  avatar_url: string | null;
  rating: number;
  content: string;
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function ReviewCard({
  review,
  variant = "short",
}: {
  review: Review;
  variant?: "short" | "tall";
}) {
  return (
    <article
      className={cn(
        "bg-surface-container-lowest rounded-[var(--radius-md)] p-8 shadow-ambient flex flex-col gap-6",
        variant === "tall" && "md:py-10",
      )}
    >
      <StarRow rating={review.rating} />
      <blockquote className="font-body text-base sm:text-lg text-on-surface leading-relaxed italic">
        &ldquo;{review.content}&rdquo;
      </blockquote>
      <footer className="flex items-center gap-3 mt-auto">
        {review.avatar_url ? (
          <Image
            src={review.avatar_url}
            alt={review.author_name}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <span
            className="w-10 h-10 rounded-full bg-primary-container font-display font-bold text-sm text-primary flex items-center justify-center select-none"
            aria-hidden="true"
          >
            {initials(review.author_name)}
          </span>
        )}
        <div>
          <p className="font-body font-semibold text-sm text-on-surface">
            {review.author_name}
          </p>
          {review.author_context && (
            <p className="font-body text-xs text-on-surface-variant">
              {review.author_context}
            </p>
          )}
        </div>
      </footer>
    </article>
  );
}
