import { redirect } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Tag } from "@/components/ui/tag";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ProgressPill } from "@/components/ui/progress-pill";
import { Avatar } from "@/components/ui/avatar";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────
// Layout constant
// ─────────────────────────────────────────
const C = "max-w-7xl mx-auto px-5 sm:px-10 lg:px-16";

// ─────────────────────────────────────────
// Placeholder mentors — replace with live Supabase query in Phase 2
// ─────────────────────────────────────────
const PLACEHOLDER_MENTORS = [
  {
    id: "raj",
    name: "Raj Patel",
    university: "Monash University",
    field: "Engineering",
    tagline: "I bombed my first essay. Here's exactly how I turned it around.",
  },
  {
    id: "sarah",
    name: "Sarah Chen",
    university: "University of Melbourne",
    field: "Business",
    tagline: "Time management is the secret weapon nobody tells you about.",
  },
  {
    id: "minh",
    name: "Minh Nguyen",
    university: "RMIT University",
    field: "Information Technology",
    tagline: "Don't wait until graduation to start building your career.",
  },
];

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

  const [{ data: profile }, { data: onboarding }] = await Promise.all([
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
  ]);

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
          Phase 2 placeholder. Photography slots are gradient divs
          until mentor-portrait images are generated.
          See todo.md §5b for the full generation checklist.
      ───────────────────────────────────────────────────────────────── */}
      <section className={`${C} mt-20`}>
        <div className="flex items-baseline justify-between mb-8">
          <div>
            <span className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant block mb-2">
              Your network
            </span>
            <h2 className="font-display font-bold text-2xl text-primary">
              Mentors being matched for you
            </h2>
          </div>
          <Tag variant="muted">Coming in Phase 2</Tag>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {PLACEHOLDER_MENTORS.map((mentor) => (
            <div
              key={mentor.id}
              className="bg-surface-container-lowest rounded-md overflow-hidden"
              aria-label={`Mentor placeholder: ${mentor.name}`}
            >
              <div className="relative h-44">
                <Image
                  src={`/images/mentor-portrait-${mentor.id}.webp`}
                  alt=""
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={mentor.name} size="sm" />
                  <div>
                    <p className="font-body font-semibold text-sm text-on-surface">
                      {mentor.name}
                    </p>
                    <p className="font-body text-xs text-on-surface-variant">
                      {mentor.field} · {mentor.university}
                    </p>
                  </div>
                </div>
                <p className="font-body text-sm text-on-surface-variant leading-relaxed italic">
                  &ldquo;{mentor.tagline}&rdquo;
                </p>
              </div>
            </div>
          ))}
        </div>
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
          <div className="bg-surface-container-low rounded-md overflow-hidden">
            <div className="relative h-36">
              <Image
                src="/images/empty-state-library.webp"
                alt="Students at the State Library — success stories arrive in Phase 2"
                fill
                className="object-cover"
              />
            </div>
            <div className="p-5">
              <Tag variant="muted" className="mb-3">
                Phase 2
              </Tag>
              <h3 className="font-display font-semibold text-base text-primary mb-1">
                Success Stories
              </h3>
              <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                Real accounts of how Hoddle mentors helped students find their
                footing.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
