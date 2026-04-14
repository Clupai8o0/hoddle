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
    { data: latestContent },
    { data: rawRegistrations },
    { data: recentThreads },
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
    // Latest published content
    supabase
      .from("content_items")
      .select(
        `slug, type, title, excerpt,
         mentors!content_items_mentor_id_fkey(
           profiles!mentors_profile_id_fkey(full_name)
         )`,
      )
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(3),
    // Upcoming registered sessions — fetch registrations + join sessions, filter in JS
    supabase
      .from("session_registrations")
      .select(
        `live_sessions!session_registrations_session_id_fkey(
           id, title, scheduled_at, duration_minutes, status
         )`,
      )
      .eq("profile_id", user!.id)
      .limit(20),
    // Recent forum threads
    supabase
      .from("forum_threads")
      .select("id, slug, title, category_slug, last_activity_at")
      .is("deleted_at", null)
      .order("last_activity_at", { ascending: false })
      .limit(4),
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

  // Filter upcoming registered sessions in JS
  const now = new Date().toISOString();
  type SessionRow = {
    id: string;
    title: string;
    scheduled_at: string;
    duration_minutes: number;
    status: string;
  };
  const upcomingSessions: SessionRow[] = (rawRegistrations ?? [])
    .map((r) => {
      const s = Array.isArray(r.live_sessions)
        ? r.live_sessions[0]
        : r.live_sessions;
      return s as SessionRow | null;
    })
    .filter(
      (s): s is SessionRow =>
        s !== null &&
        s.status === "scheduled" &&
        s.scheduled_at >= now,
    )
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
    .slice(0, 3);

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
              Your mentors, sessions, and community are ready. Let&apos;s get
              started.
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
              Connect with a mentor, post in the forums, and share your story to
              complete your journey.
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

      {/* ── Latest content ───────────────────────────────────────────── */}
      {(latestContent ?? []).length > 0 && (
        <section className={`${C} mt-16`}>
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <span className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant block mb-2">
                From your mentors
              </span>
              <h2 className="font-display font-bold text-2xl text-primary">
                Latest content
              </h2>
            </div>
            <Link
              href="/content"
              className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors duration-150 underline underline-offset-2"
            >
              Browse all
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {(latestContent ?? []).map((item) => {
              const mentorName =
                ((Array.isArray(item.mentors) ? item.mentors[0] : item.mentors) as {
                  profiles: { full_name: string | null } | null;
                } | null)?.profiles?.full_name ?? "A mentor";
              return (
                <Link
                  key={item.slug}
                  href={`/content/${item.slug}`}
                  className="group flex flex-col gap-2 p-5 rounded-2xl bg-surface-container-lowest hover:shadow-ambient hover:-translate-y-px transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <span className="font-body text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
                    {item.type}
                  </span>
                  <p className="font-display font-semibold text-on-surface group-hover:text-primary transition-colors line-clamp-2">
                    {item.title}
                  </p>
                  {item.excerpt && (
                    <p className="font-body text-sm text-on-surface-variant line-clamp-2">
                      {item.excerpt}
                    </p>
                  )}
                  <p className="font-body text-xs text-on-surface-variant mt-auto pt-1">
                    by {mentorName}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Upcoming registered sessions ─────────────────────────────── */}
      {upcomingSessions.length > 0 && (
        <section className={`${C} mt-16`}>
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <span className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant block mb-2">
                Your calendar
              </span>
              <h2 className="font-display font-bold text-2xl text-primary">
                Upcoming sessions
              </h2>
            </div>
            <Link
              href="/sessions"
              className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors duration-150 underline underline-offset-2"
            >
              All sessions
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingSessions.map((s) => {
              const d = new Date(s.scheduled_at);
              const dayNum = d.toLocaleDateString("en-AU", { day: "numeric", timeZone: "Australia/Melbourne" });
              const month = d.toLocaleDateString("en-AU", { month: "short", timeZone: "Australia/Melbourne" });
              const time = d.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", timeZone: "Australia/Melbourne" });
              return (
                <Link
                  key={s.id}
                  href={`/sessions/${s.id}`}
                  className="group flex items-center gap-5 p-4 rounded-2xl bg-surface-container-lowest hover:shadow-ambient transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <div className="flex-shrink-0 w-12 text-center">
                    <p className="font-display font-bold text-2xl text-primary leading-none">{dayNum}</p>
                    <p className="font-body text-xs text-on-surface-variant uppercase tracking-wide">{month}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                      {s.title}
                    </p>
                    <p className="font-body text-xs text-on-surface-variant mt-0.5">
                      {time} · {s.duration_minutes} min
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Recent forum activity ─────────────────────────────────────── */}
      {(recentThreads ?? []).length > 0 && (
        <section className={`${C} mt-16`}>
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <span className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant block mb-2">
                Community
              </span>
              <h2 className="font-display font-bold text-2xl text-primary">
                Active discussions
              </h2>
            </div>
            <Link
              href="/forums"
              className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors duration-150 underline underline-offset-2"
            >
              All forums
            </Link>
          </div>
          <div className="space-y-2">
            {(recentThreads ?? []).map((thread) => (
              <Link
                key={thread.id}
                href={`/forums/${thread.category_slug}/${thread.slug}`}
                className="group flex items-center justify-between gap-4 px-5 py-3.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container-low transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <p className="font-body text-sm text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                  {thread.title}
                </p>
                <span className="font-body text-[10px] text-on-surface-variant shrink-0 uppercase tracking-wide">
                  {thread.category_slug.replace(/-/g, " ")}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Featured story ────────────────────────────────────────────── */}
      {featuredStory && (
        <section className={`${C} mt-16`}>
          <div className="mb-6">
            <span className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant block mb-2">
              Inspiration
            </span>
            <h2 className="font-display font-bold text-2xl text-primary">
              From the community
            </h2>
          </div>
          <Link
            href={`/stories/${featuredStory.slug}`}
            className="group flex flex-col sm:flex-row gap-6 p-6 rounded-2xl bg-surface-container-lowest hover:shadow-ambient hover:-translate-y-px transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            {featuredStory.hero_image_url && (
              <div className="relative w-full sm:w-48 h-32 sm:h-auto rounded-xl overflow-hidden flex-shrink-0">
                <Image
                  src={featuredStory.hero_image_url}
                  alt={featuredStory.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>
            )}
            <div className="flex flex-col justify-center gap-2">
              <Tag variant="success">Featured story</Tag>
              <h3 className="font-display font-semibold text-lg text-primary group-hover:underline line-clamp-2">
                {featuredStory.title}
              </h3>
              <p className="font-body text-xs text-on-surface-variant">
                {(
                  featuredStory.profiles as {
                    full_name: string | null;
                  } | null
                )?.full_name ?? "Community member"}
              </p>
            </div>
          </Link>
        </section>
      )}
    </main>
  );
}
