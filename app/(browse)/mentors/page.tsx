import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/container";
import { MentorCard, type MentorCardData } from "@/components/patterns/mentor-card";
import { FIELDS_OF_INTEREST } from "@/lib/validation/onboarding";
import Link from "next/link";

export const metadata = { title: "Mentors — Hoddle" };

interface PageProps {
  searchParams: Promise<{ expertise?: string }>;
}

export default async function MentorsPage({ searchParams }: PageProps) {
  const { expertise: expertiseFilter } = await searchParams;

  const supabase = await createClient();

  let query = supabase
    .from("mentors")
    .select(
      `slug, headline, expertise, verified_at,
       profiles!mentors_profile_id_fkey (
         full_name, avatar_url, university, country_of_origin
       )`
    )
    .not("verified_at", "is", null)
    .order("verified_at", { ascending: false });

  if (expertiseFilter) {
    query = query.contains("expertise", [expertiseFilter]);
  }

  const { data: mentors } = await query;

  const typedMentors = (mentors ?? []) as unknown as MentorCardData[];

  return (
    <Container className="py-16">
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-display text-4xl font-bold text-primary mb-3">
          Meet your mentors
        </h1>
        <p className="font-body text-on-surface-variant max-w-xl">
          Every mentor here was once in your shoes — an international student
          navigating Melbourne for the first time. They&apos;re here to share
          what they learned.
        </p>
      </div>

      {/* Expertise filter chips */}
      <div className="flex flex-wrap gap-2 mb-10">
        <Link
          href="/mentors"
          className={`font-body text-sm px-4 py-1.5 rounded-full transition-colors ${
            !expertiseFilter
              ? "bg-primary text-on-primary"
              : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          All
        </Link>
        {FIELDS_OF_INTEREST.map((field) => (
          <Link
            key={field.value}
            href={`/mentors?expertise=${field.value}`}
            className={`font-body text-sm px-4 py-1.5 rounded-full transition-colors ${
              expertiseFilter === field.value
                ? "bg-primary text-on-primary"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {field.label}
          </Link>
        ))}
      </div>

      {/* Mentor grid */}
      {typedMentors.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-display text-xl font-semibold text-on-surface mb-2">
            No mentors found
          </p>
          <p className="font-body text-on-surface-variant">
            {expertiseFilter
              ? "Try a different field of interest."
              : "Mentors are on their way — check back soon."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {typedMentors.map((mentor) => (
            <MentorCard key={mentor.slug} mentor={mentor} />
          ))}
        </div>
      )}
    </Container>
  );
}
