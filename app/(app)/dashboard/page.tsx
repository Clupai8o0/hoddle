import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Tag } from "@/components/ui/tag";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ProgressPill } from "@/components/ui/progress-pill";
import { MentorCard } from "@/components/patterns/mentor-card";
import { computeRecommendationsForProfile } from "@/lib/matching/compute";
import type { MentorCardData } from "@/components/patterns/mentor-card";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────
// Layout constant
// ─────────────────────────────────────────
const C = "max-w-7xl mx-auto px-5 sm:px-10 lg:px-16";

// ─────────────────────────────────────────
// Time-aware greeting
// ─────────────────────────────────────────
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning,";
  if (hour < 17) return "Good afternoon,";
  if (hour < 21) return "Good evening,";
  return "Welcome back,";
}

// ─────────────────────────────────────────
// Page
// ─────────────────────────────────────────
export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Mentors have their own dashboard — redirect them before rendering student UI
  const { data: roleCheck } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  if (roleCheck?.role === "mentor") {
    redirect("/mentor");
  }

  const [
    { data: profile },
    { data: onboarding },
    { data: featuredStory },
    { data: rawRecs },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, country_of_origin, university, year_of_study")
      .eq("id", user!.id)
      .single(),
    supabase
      .from("onboarding_responses")
      .select("goals, challenges, fields_of_interest")
      .eq("profile_id", user!.id)
      .single(),
    supabase
      .from("success_stories")
      .select(
        `id, slug, title, body, hero_image_url, milestones,
         profiles!success_stories_author_id_fkey(full_name, university)`,
      )
      .eq("status", "published")
      .eq("featured", true)
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("mentor_recommendations")
      .select(
        `rank, reasoning,
         mentors!mentor_recommendations_mentor_id_fkey(
           slug, headline, expertise, verified_at,
           profiles!mentors_profile_id_fkey(full_name, avatar_url, university, country_of_origin)
         )`,
      )
      .eq("profile_id", user!.id)
      .order("rank", { ascending: true })
      .limit(5),
  ]);

  // If no pre-computed recommendations exist, compute now (first login)
  let recommendations = rawRecs ?? [];
  if (recommendations.length === 0) {
    await computeRecommendationsForProfile(user!.id).catch(() => null);
    const { data: freshRecs } = await supabase
      .from("mentor_recommendations")
      .select(
        `rank, reasoning,
         mentors!mentor_recommendations_mentor_id_fkey(
           slug, headline, expertise, verified_at,
           profiles!mentors_profile_id_fkey(full_name, avatar_url, university, country_of_origin)
         )`,
      )
      .eq("profile_id", user!.id)
      .order("rank", { ascending: true })
      .limit(5);
    recommendations = freshRecs ?? [];
  }

  // Shape into MentorCardData
  type RecRow = (typeof recommendations)[number];
  const mentorRecs: Array<{ mentor: MentorCardData; reasoning: string }> =
    recommendations
      .map((rec: RecRow) => {
        const m = Array.isArray(rec.mentors)
          ? rec.mentors[0]
          : (rec.mentors as {
              slug: string;
              headline: string | null;
              expertise: string[];
              verified_at: string | null;
              profiles: {
                full_name: string | null;
                avatar_url: string | null;
                university: string | null;
                country_of_origin: string | null;
              } | null;
            } | null);
        if (!m) return null;
        return {
          mentor: {
            slug: m.slug,
            headline: m.headline,
            expertise: m.expertise ?? [],
            verified_at: m.verified_at,
            profiles: Array.isArray(m.profiles)
              ? (m.profiles[0] ?? null)
              : (m.profiles as MentorCardData["profiles"]),
          } satisfies MentorCardData,
          reasoning: rec.reasoning as string,
        };
      })
      .filter((r): r is { mentor: MentorCardData; reasoning: string } => r !== null);

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const greeting = getGreeting();

  const hasGoals = (onboarding?.goals?.length ?? 0) > 0;
  const hasChallenges = (onboarding?.challenges?.length ?? 0) > 0;
  const hasFields = (onboarding?.fields_of_interest?.length ?? 0) > 0;
  const hasAnyOnboarding = hasGoals || hasChallenges || hasFields;

  return (
    <main className="min-h-screen bg-surface pb-24">

      {/* ── Welcome banner ────────────────────────────────────────────
          Cream-to-sky gradient backdrop — the Hoddle signature wash.
          Asymmetric grid: 8/12 editorial greeting, 4/12 meta column.
      ───────────────────────────────────────────────────────────────── */}
      <section
        className="py-16 lg:py-24"
        style={{
          background:
            "linear-gradient(160deg, var(--color-surface) 0%, var(--color-primary-container) 100%)",
        }}
      >
        <div className={`${C} grid lg:grid-cols-12 gap-8 items-end`}>
          {/* Greeting */}
          <div className="lg:col-span-8">
            <span className="font-body text-xs font-medium uppercase tracking-[0.18em] text-primary mb-4 block">
              Your dashboard
            </span>
            <p className="font-display font-semibold text-2xl lg:text-3xl text-on-surface-variant leading-tight mb-1">
              {greeting}
            </p>
            <h1 className="font-display font-extrabold text-5xl lg:text-[4.25rem] text-primary leading-[1.05] tracking-tight">
              {firstName}.
            </h1>
            <p className="font-body text-lg text-on-surface-variant mt-5 max-w-lg leading-relaxed">
              Your mentors, community, and resources are being prepared. Here's
              what we know about you so far.
            </p>
          </div>

          {/* Meta column */}
          <div className="lg:col-span-4 flex flex-col gap-2 lg:items-end">
            {profile?.university && (
              <p className="font-body text-sm text-on-surface-variant text-right">
                {profile.university}
              </p>
            )}
            {profile?.country_of_origin && (
              <p className="font-body text-sm text-on-surface-variant text-right">
                From {profile.country_of_origin}
              </p>
            )}
            {profile?.year_of_study && (
              <Tag className="lg:ml-0">Year {profile.year_of_study}</Tag>
            )}
          </div>
        </div>
      </section>

      {/* ── Main grid ─────────────────────────────────────────────────
          Left 8 cols: onboarding summary cards (goals, challenges, fields)
          Right 4 cols: journey progress sidebar
      ───────────────────────────────────────────────────────────────── */}
      <section className={`${C} mt-12 grid lg:grid-cols-12 gap-8`}>

        {/* ── Left: Onboarding summary ────────────────── */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {hasGoals && (
            <Card>
              <CardHeader>
                <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant">
                  What you&apos;re working towards
                </p>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-2">
                  {onboarding!.goals.map((goal) => (
                    <Tag key={goal} variant="default">
                      {goal}
                    </Tag>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {hasChallenges && (
            <Card>
              <CardHeader>
                <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant">
                  What you&apos;re navigating
                </p>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-2">
                  {onboarding!.challenges.map((challenge) => (
                    <Tag key={challenge} variant="muted">
                      {challenge}
                    </Tag>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {hasFields && (
            <Card>
              <CardHeader>
                <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant">
                  Your areas of interest
                </p>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-2">
                  {onboarding!.fields_of_interest.map((field) => (
                    <Tag key={field} variant="success">
                      {field}
                    </Tag>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!hasAnyOnboarding && (
            <Card>
              <CardContent>
                <p className="font-body text-sm text-on-surface-variant">
                  Your onboarding answers will appear here. If something looks
                  missing, contact support.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right: Journey sidebar ──────────────────── */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant">
                Your journey
              </p>
            </CardHeader>
            <CardContent className="pt-5 flex flex-col gap-5">
              <ProgressPill value={100} label="Profile set up" />
              <ProgressPill value={hasAnyOnboarding ? 100 : 0} label="Goals defined" />
              <ProgressPill value={0} label="First mentor connection" />
              <ProgressPill value={0} label="Community post" />
              <ProgressPill value={0} label="Share your story" />
            </CardContent>
          </Card>

          {/* Overall progress — tonal inset card */}
          <div className="bg-surface-container rounded-md p-6">
            <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant mb-4">
              Overall progress
            </p>
            <ProgressPill
              value={hasAnyOnboarding ? 40 : 20}
              label={hasAnyOnboarding ? "2 of 5 milestones" : "1 of 5 milestones"}
            />
            <p className="font-body text-xs text-on-surface-variant mt-4 leading-relaxed">
              Mentor connections, community forums, and success stories unlock
              when we open Phase 2.
            </p>
          </div>
        </div>
      </section>

      {/* ── Recommended mentors ─────────────────────────────────────
          Live recommendations from the matching algorithm (§10).
          Falls back to "Explore all mentors" CTA if none computed yet.
      ───────────────────────────────────────────────────────────────── */}
      <section className={`${C} mt-20`}>
        <div className="flex items-baseline justify-between mb-8">
          <div>
            <span className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant block mb-2">
              Your network
            </span>
            <h2 className="font-display font-bold text-2xl text-primary">
              {mentorRecs.length > 0
                ? "Recommended for you"
                : "Find your mentor"}
            </h2>
          </div>
          <Link
            href="/mentors"
            className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors duration-150 underline underline-offset-2"
          >
            Browse all
          </Link>
        </div>

        {mentorRecs.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6">
            {mentorRecs.slice(0, 3).map(({ mentor, reasoning }) => (
              <div key={mentor.slug} className="flex flex-col gap-2">
                <MentorCard mentor={mentor} />
                <p className="font-body text-xs text-on-surface-variant px-1 italic leading-snug">
                  {reasoning}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface-container-low rounded-2xl p-8 text-center">
            <p className="font-body text-on-surface-variant mb-4">
              No verified mentors have joined yet — check back soon, or browse
              the full mentor list.
            </p>
            <Link
              href="/mentors"
              className="inline-block font-body text-sm font-semibold text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              Browse mentors
            </Link>
          </div>
        )}
      </section>

      {/* ── Phase 2 empty states ─────────────────────────────────────
          Photography placeholder divs — replace with <Image> after
          generating images per todo.md §5b.
      ───────────────────────────────────────────────────────────────── */}
      <section className={`${C} mt-16`}>
        <div className="mb-8">
          <span className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant block mb-2">
            What&apos;s ahead
          </span>
          <h2 className="font-display font-bold text-2xl text-primary">
            More coming soon
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Content library */}
          <div className="bg-surface-container-low rounded-md overflow-hidden">
            <div className="relative h-36">
              <Image
                src="/images/empty-state-journal.webp"
                alt="An open journal on a desk — the content library arrives in Phase 2"
                fill
                className="object-cover"
              />
            </div>
            <div className="p-5">
              <Tag variant="muted" className="mb-3">
                Phase 2
              </Tag>
              <h3 className="font-display font-semibold text-base text-primary mb-1">
                Content Library
              </h3>
              <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                Essays, advice, and stories from mentors who&apos;ve been where
                you are.
              </p>
            </div>
          </div>

          {/* Forums */}
          <div className="bg-surface-container-low rounded-md overflow-hidden">
            <div className="relative h-36">
              <Image
                src="/images/empty-state-botanic.webp"
                alt="A quiet bench in the Botanic Gardens — the forums arrive in Phase 2"
                fill
                className="object-cover"
              />
            </div>
            <div className="p-5">
              <Tag variant="muted" className="mb-3">
                Phase 2
              </Tag>
              <h3 className="font-display font-semibold text-base text-primary mb-1">
                Community Forums
              </h3>
              <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                A space to ask questions, share discoveries, and find your
                people.
              </p>
            </div>
          </div>

          {/* Success stories */}
          <Link
            href="/stories"
            className="group bg-surface-container-low rounded-md overflow-hidden hover:shadow-ambient transition-all hover:-translate-y-px block"
          >
            <div className="relative h-36">
              {featuredStory?.hero_image_url ? (
                <Image
                  src={featuredStory.hero_image_url}
                  alt={featuredStory.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              ) : (
                <Image
                  src="/images/empty-state-library.webp"
                  alt="Students at the State Library — success stories"
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <div className="p-5">
              {featuredStory ? (
                <>
                  <Tag variant="success" className="mb-3">
                    Featured story
                  </Tag>
                  <h3 className="font-display font-semibold text-base text-primary mb-1 group-hover:underline line-clamp-2">
                    {featuredStory.title}
                  </h3>
                  <p className="font-body text-xs text-on-surface-variant">
                    {(
                      featuredStory.profiles as {
                        full_name: string | null;
                        university: string | null;
                      } | null
                    )?.full_name ?? "Community member"}
                  </p>
                </>
              ) : (
                <>
                  <Tag variant="muted" className="mb-3">
                    Community
                  </Tag>
                  <h3 className="font-display font-semibold text-base text-primary mb-1">
                    Success Stories
                  </h3>
                  <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                    Real accounts of how Hoddle mentors helped students find
                    their footing.
                  </p>
                </>
              )}
            </div>
          </Link>
        </div>
      </section>
    </main>
  );
}
