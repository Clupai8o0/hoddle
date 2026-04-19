import { ReviewCard, type Review } from "./review-card";

const C = "max-w-7xl mx-auto px-4 sm:px-10 lg:px-16";

// Asymmetric rhythm breaks grid monotony — editorial, not template.
const RHYTHM: Array<"short" | "tall"> = ["short", "tall", "short", "tall", "short", "short"];

export function ReviewsWall({ reviews }: { reviews: Review[] }) {
  if (reviews.length < 3) return null;

  return (
    <section className="py-16 sm:py-28 bg-surface-container-low">
      <div className={C}>
        <div className="max-w-2xl mb-12 sm:mb-16">
          <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant mb-4">
            What students say
          </p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-on-surface tracking-tight leading-[1.1]">
            The proof is in the students&rsquo; words.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min">
          {reviews.map((review, i) => (
            <ReviewCard
              key={review.id}
              review={review}
              variant={RHYTHM[i % RHYTHM.length]}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
