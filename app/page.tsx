import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { GlassNav, NavLink } from "@/components/layout/glass-nav";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { SurveyStrip } from "@/components/patterns/survey-strip";
import { ReviewsWall } from "@/components/patterns/reviews-wall";
import type { Review } from "@/components/patterns/review-card";

// ─────────────────────────────────────────
// Shared layout constant
// ─────────────────────────────────────────
const C = "max-w-7xl mx-auto px-4 sm:px-10 lg:px-16";

// ─────────────────────────────────────────
// Page
// ─────────────────────────────────────────
// Cannot use static revalidation — page renders user-specific nav
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch auth user and profile in parallel with mentor data
  const [{ data: { user } }, { data: mentors }, { data: reviews }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
    .from("mentors")
    .select(
      `slug, headline, expertise,
       profiles!mentors_profile_id_fkey (
         full_name, avatar_url, country_of_origin, university
       )`,
    )
      .not("verified_at", "is", null)
      .order("verified_at", { ascending: false })
      .limit(3),
    supabase
      .from("reviews")
      .select("id, author_name, author_context, avatar_url, rating, content")
      .eq("published", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  // If logged in, fetch their profile for the nav
  let profile: { full_name: string | null; avatar_url: string | null } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  type HomepageMentor = {
    slug: string;
    headline: string | null;
    expertise: string[];
    profiles: {
      full_name: string | null;
      avatar_url: string | null;
      country_of_origin: string | null;
      university: string | null;
    } | null;
  };

  const typedMentors = (mentors ?? []) as unknown as HomepageMentor[];
  const typedReviews = (reviews ?? []) as unknown as Review[];
  return (
    <div className="bg-surface text-on-surface">
      {/* ── Navigation ───────────────────────────────────── */}
      <GlassNav
        brand={
          <Link
            href="/"
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary rounded-sm"
            aria-label="Hoddle home"
          >
            <Image
              src="/logo-light.png"
              alt="Hoddle"
              width={56}
              height={56}
              className="object-contain"
              priority
            />
          </Link>
        }
        links={
          <>
            <NavLink href="/about">About</NavLink>
            <NavLink href="/mentors">Mentors</NavLink>
            <NavLink href="/forums">Forums</NavLink>
            <NavLink href="/stories">Stories</NavLink>
            <NavLink href="/sessions">Sessions</NavLink>
            <NavLink href="/apply">Apply as mentor</NavLink>
          </>
        }
        actions={
          user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Link
                href="/profile"
                className="flex items-center gap-2.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary"
                aria-label="Your profile"
              >
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.full_name ?? "Your profile"}
                    width={36}
                    height={36}
                    className="rounded-full object-cover ring-2 ring-outline-variant"
                  />
                ) : (
                  <span className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center font-display font-bold text-sm text-primary ring-2 ring-outline-variant select-none">
                    {(profile?.full_name ?? user.email ?? "?")
                      .split(" ")
                      .slice(0, 2)
                      .map((p) => p[0]?.toUpperCase() ?? "")
                      .join("") || "?"}
                  </span>
                )}
              </Link>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button variant="primary" size="sm" asChild>
                <Link href="/signup">Get started</Link>
              </Button>
            </>
          )
        }
      />

      <main>
        {/* ── Hero ──────────────────────────────────────────
            Backdrop: cream-to-sky signature gradient
            Asymmetric grid: 7/12 editorial text, 5/12 photo panel
        ─────────────────────────────────────────────────── */}
        <section
          className="relative overflow-hidden py-24 lg:py-36"
          style={{
            background:
              "linear-gradient(160deg, var(--color-surface) 0%, var(--color-primary-container) 100%)",
          }}
        >
          <div className={`${C} grid lg:grid-cols-12 gap-8 lg:gap-12 items-center`}>
            {/* Text column */}
            <div className="lg:col-span-7 relative z-10">
              <span className="font-body text-xs font-medium uppercase tracking-[0.18em] text-primary mb-5 sm:mb-6 block">
                Mentorship for first-year international students in Melbourne
              </span>

              <h1 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-[4.25rem] text-on-surface leading-[1.05] tracking-tight mb-5 sm:mb-6">
                Navigate Melbourne
                <br />
                with a mentor who&apos;s{" "}
                <em className="text-primary not-italic">
                  been in your shoes.
                </em>
              </h1>

              <p className="font-body text-base sm:text-lg lg:text-xl text-on-surface-variant leading-relaxed max-w-xl mb-8 sm:mb-10">
                Free, peer-to-peer mentorship. Connect with high-achievers who
                understand the grading system, the job market, and the feeling
                of being 6,000 miles from home.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="hero" size="lg" asChild>
                  <Link href="/signup" className="gap-3">
                    Find my mentor
                    <ArrowRight
                      size={18}
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  </Link>
                </Button>
                <Button variant="secondary" size="lg" asChild>
                  <Link href="#how-it-works">How it works</Link>
                </Button>
              </div>

              {/* Social proof strip */}
              <div className="mt-12 flex items-center gap-6 flex-wrap">
                <div className="flex flex-col">
                  <span className="font-display font-bold text-2xl text-primary">
                    500+
                  </span>
                  <span className="font-body text-xs text-on-surface-variant uppercase tracking-widest">
                    Students guided
                  </span>
                </div>
                <div className="w-px h-8 bg-outline-variant" aria-hidden="true" />
                <div className="flex flex-col">
                  <span className="font-display font-bold text-2xl text-primary">
                    50+
                  </span>
                  <span className="font-body text-xs text-on-surface-variant uppercase tracking-widest">
                    Verified mentors
                  </span>
                </div>
                <div className="w-px h-8 bg-outline-variant" aria-hidden="true" />
                <div className="flex flex-col">
                  <span className="font-display font-bold text-2xl text-primary">
                    8
                  </span>
                  <span className="font-body text-xs text-on-surface-variant uppercase tracking-widest">
                    Melbourne universities
                  </span>
                </div>
              </div>
            </div>

            {/* Photo panel (editorial placeholder) */}
            <div className="lg:col-span-5 relative">
              <div
                className="relative rounded-[var(--radius-md)] overflow-hidden aspect-[4/5] rotate-1 shadow-[0_24px_64px_rgba(0,24,66,0.18)]"
              >
                <Image
                  src="/images/hero-laneway-cafe.webp"
                  alt="A student working at a Melbourne laneway café"
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              {/* Floating credential card */}
              <div
                className="absolute -bottom-6 -left-6 bg-surface-container-lowest rounded-[var(--radius-md)] p-5 shadow-[var(--shadow-ambient)] max-w-[220px] -rotate-2 hidden md:block"
                aria-hidden="true"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                    <div className="w-3 h-3 rounded-full bg-secondary" />
                  </div>
                  <p className="font-body text-sm font-semibold text-on-surface">
                    Top 5% Mentors Only
                  </p>
                </div>
                <p className="font-body text-xs text-on-surface-variant leading-relaxed">
                  Vetted students from Melbourne&apos;s leading universities.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Narrative — Priya at 2am ──────────────────────
            Asymmetric magazine layout — the emotional heart of the page
        ─────────────────────────────────────────────────── */}
        <section className="py-28 bg-surface">
          <div className={`${C} grid lg:grid-cols-12 gap-10 sm:gap-16 items-start`}>
            {/* Pull quote — sits offset on the left */}
            <div className="lg:col-span-5 lg:sticky lg:top-24">
              <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-secondary mb-5 sm:mb-6">
                Why Hoddle exists
              </p>
              <blockquote className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-primary leading-[1.1] tracking-tight mb-6 sm:mb-8">
                &ldquo;For the first time since arriving in Melbourne, she felt
                like she had a roadmap.&rdquo;
              </blockquote>

              {/* Decorative editorial rule */}
              <div className="h-1 w-16 bg-primary rounded-full mb-8" aria-hidden="true" />

              {/* Tonal insight card */}
              <div className="bg-surface-container-low rounded-[var(--radius-md)] p-8">
                <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-4">
                  International students outperform their peers when they have
                  access to the right guidance. The problem isn&apos;t
                  ability — it&apos;s awareness.
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-1 h-12 bg-secondary rounded-full" aria-hidden="true" />
                  <p className="font-body text-xs font-medium text-secondary uppercase tracking-widest">
                    Hoddle&apos;s founding insight
                  </p>
                </div>
              </div>
            </div>

            {/* Story narrative */}
            <div className="lg:col-span-7 space-y-8">
              <p className="font-body text-lg lg:text-xl text-on-surface leading-relaxed">
                It&apos;s 2 AM and Priya is staring at her laptop, overwhelmed.
                She just received her first assignment feedback and it&apos;s
                not what she expected. Back home in Mumbai, she was top of her
                class. Here in Melbourne,{" "}
                <strong className="font-semibold text-on-surface">
                  everything feels different
                </strong>{" "}
                — the grading system, the academic expectations, even the way
                professors communicate.
              </p>

              <p className="font-body text-lg text-on-surface-variant leading-relaxed">
                She doesn&apos;t know who to ask. Her parents are 6,000 miles
                away and don&apos;t understand the Australian system. She
                doesn&apos;t want to bother her new friends who seem to have it
                all figured out.
              </p>

              <div className="bg-surface-container rounded-[var(--radius-md)] p-8 border-l-4 border-primary">
                <p className="font-body text-lg text-on-surface leading-relaxed italic">
                  She opens Hoddle Melbourne and sees Raj&apos;s profile. He&apos;s
                  from Delhi, graduated with honours last year, and now works at
                  one of Melbourne&apos;s top tech firms. His story sounds
                  familiar:{" "}
                  <em className="not-italic font-semibold">
                    &ldquo;I bombed my first essay. Got a Pass when I was used to
                    Distinctions. Here&apos;s what I learned…&rdquo;
                  </em>
                </p>
              </div>

              <p className="font-body text-lg text-on-surface-variant leading-relaxed">
                Two hours later, Priya has watched three mentors share their
                strategies. She&apos;s downloaded a time management template,
                bookmarked an upcoming Q&amp;A about interview prep, and posted
                her first question in the &ldquo;First Semester Struggles&rdquo;
                forum.
              </p>

              <div className="bg-secondary-container rounded-[var(--radius-md)] p-8">
                <p className="font-body text-base text-on-secondary-container leading-relaxed font-medium">
                  Six months later, Priya aces her next assignment. She lands a
                  retail job using interview tips from the platform. When she
                  receives her first High Distinction, she opens Hoddle and
                  clicks{" "}
                  <em>
                    &ldquo;Share your success story.&rdquo;
                  </em>
                </p>
              </div>

              <div className="pt-4">
                <Button variant="hero" size="lg" asChild>
                  <Link href="/signup" className="gap-3">
                    Start your story
                    <ArrowRight
                      size={18}
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <SurveyStrip />

        {/* ── Mentor preview strip ─────────────────────────
            3 placeholder cards — real data from Supabase in Phase 2
        ─────────────────────────────────────────────────── */}
        <section className="py-16 sm:py-28 bg-surface-container-low">
          <div className={C}>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-16">
              <div>
                <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant mb-3">
                  Verified mentors
                </p>
                <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-on-surface tracking-tight">
                  Meet your future mentors.
                </h2>
              </div>
              <p className="font-body text-sm text-on-surface-variant max-w-xs text-right hidden sm:block">
                High-achievers who&apos;ve navigated the same trams, laneways,
                and lecture halls.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {typedMentors.map((mentor) => {
                const name = mentor.profiles?.full_name ?? "Mentor";
                const initials = name
                  .split(" ")
                  .slice(0, 2)
                  .map((p) => p[0]?.toUpperCase() ?? "")
                  .join("");
                const field = mentor.expertise[0]
                  ?.replace(/-/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase()) ?? null;

                return (
                  <Link
                    key={mentor.slug}
                    href={`/mentors/${mentor.slug}`}
                    className="group bg-surface-container-lowest rounded-[var(--radius-md)] overflow-hidden transition-all duration-300 hover:shadow-[var(--shadow-ambient)] hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary"
                  >
                    {/* Portrait */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-primary-container">
                      {mentor.profiles?.avatar_url ? (
                        <Image
                          src={mentor.profiles.avatar_url}
                          alt={name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center font-display font-bold text-6xl text-primary/20 select-none">
                          {initials}
                        </span>
                      )}
                      {/* Origin tag */}
                      {mentor.profiles?.country_of_origin && (
                        <div className="absolute top-4 left-4 bg-surface-container-lowest/90 backdrop-blur-sm px-3 py-1 rounded-full">
                          <span className="font-body text-xs font-semibold text-primary">
                            {mentor.profiles.country_of_origin}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <h3 className="font-display font-bold text-xl text-on-surface group-hover:text-primary transition-colors">
                            {name}
                          </h3>
                          {mentor.profiles?.university && (
                            <p className="font-body text-sm text-primary font-medium mt-0.5">
                              {mentor.profiles.university}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 mt-1 px-2.5 py-1 bg-secondary-container rounded-full">
                          <span className="font-body text-xs font-semibold text-secondary">
                            Verified
                          </span>
                        </div>
                      </div>

                      {field && (
                        <p className="font-body text-xs text-on-surface-variant uppercase tracking-[0.1em] mb-3">
                          {field}
                        </p>
                      )}

                      {mentor.headline && (
                        <p className="font-body text-sm italic text-on-surface leading-relaxed line-clamp-2">
                          &ldquo;{mentor.headline}&rdquo;
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/mentors"
                className="font-body text-sm font-semibold text-primary hover:underline underline-offset-2"
              >
                Browse all mentors →
              </Link>
            </div>
          </div>
        </section>

        {/* ── Value propositions / How it works ────────────
            3 tonal cards — no borders, photography-led backdrop
        ─────────────────────────────────────────────────── */}
        <section id="how-it-works" className="py-16 sm:py-28 bg-surface">
          <div className={C}>
            <div className="text-center mb-12 sm:mb-20 max-w-2xl mx-auto">
              <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant mb-4">
                How Hoddle works
              </p>
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-on-surface tracking-tight mb-5 sm:mb-6">
                Your journey to excellence.
              </h2>
              <p className="font-body text-base sm:text-lg text-on-surface-variant leading-relaxed">
                Three simple steps to unlock everything Melbourne has to offer.
              </p>
            </div>

            {/* Bento grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Card 1 — surface-container */}
              <div className="md:col-span-4 bg-surface-container rounded-[var(--radius-md)] p-6 sm:p-8 lg:p-10 flex flex-col justify-between min-h-[320px] hover:bg-surface-container-high transition-colors duration-200">
                <div>
                  <div className="w-11 h-11 bg-primary text-on-primary rounded-full flex items-center justify-center font-display font-bold text-lg mb-8 shadow-[0_4px_12px_rgba(0,24,66,0.25)]">
                    1
                  </div>
                  <h3 className="font-display font-bold text-2xl text-on-surface mb-4 leading-tight">
                    Tell us your goals.
                  </h3>
                  <p className="font-body text-on-surface-variant leading-relaxed">
                    Complete a quick onboarding to share your challenges — from
                    academic stress to career navigation. Takes 3 minutes.
                  </p>
                </div>
                <Link
                  href="/signup"
                  className="mt-8 flex items-center gap-2 font-body text-sm font-semibold text-primary hover:gap-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary rounded-sm"
                >
                  Get started
                  <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
                </Link>
              </div>

              {/* Card 2 — secondary-container (wide) */}
              <div className="md:col-span-8 bg-secondary-container rounded-[var(--radius-md)] p-6 sm:p-8 lg:p-12 relative overflow-hidden min-h-[320px] flex flex-col justify-between">
                <div className="relative z-10 max-w-md">
                  <div className="w-11 h-11 bg-secondary text-on-secondary rounded-full flex items-center justify-center font-display font-bold text-lg mb-8 shadow-[0_4px_12px_rgba(45,106,79,0.30)]">
                    2
                  </div>
                  <h3 className="font-display font-bold text-2xl sm:text-3xl text-on-secondary-container mb-4 leading-tight">
                    Get matched with the right mentor.
                  </h3>
                  <p className="font-body text-on-secondary-container/80 text-base sm:text-lg leading-relaxed">
                    Our matching pairs you with mentors who share your field of
                    study, cultural background, and the exact challenges
                    you&apos;re facing.
                  </p>
                </div>
                {/* Decorative blob */}
                <div
                  className="absolute bottom-0 right-0 w-48 h-48 bg-secondary/10 rounded-full translate-x-16 translate-y-16"
                  aria-hidden="true"
                />
              </div>

              {/* Card 3 — primary-container (full width) */}
              <div className="md:col-span-12 bg-surface-container-highest rounded-[var(--radius-md)] p-6 sm:p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                <div>
                  <div className="w-11 h-11 bg-on-surface text-surface rounded-full flex items-center justify-center font-display font-bold text-lg mb-6 sm:mb-8 shadow-[0_4px_12px_rgba(42,38,32,0.20)]">
                    3
                  </div>
                  <h3 className="font-display font-bold text-2xl sm:text-3xl text-on-surface mb-4 leading-tight">
                    Learn, grow, and give back.
                  </h3>
                  <p className="font-body text-on-surface-variant text-base sm:text-lg leading-relaxed">
                    Access exclusive content, live Q&amp;As, and a community of
                    high-achievers. When you&apos;ve found your feet, share
                    your own story.
                  </p>
                </div>

                {/* Sub-feature tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    {
                      title: "Live Q&A Sessions",
                      desc: "Register for mentor sessions and submit questions in advance.",
                    },
                    {
                      title: "Content Library",
                      desc: "Articles, videos, and downloadable resources from verified mentors.",
                    },
                    {
                      title: "Community Forums",
                      desc: "Five categories covering academics, careers, and life in Melbourne.",
                    },
                    {
                      title: "Success Stories",
                      desc: "Real wins from real students — submit your own when you're ready.",
                    },
                  ].map(({ title, desc }) => (
                    <div
                      key={title}
                      className="bg-surface-container-lowest rounded-md p-5"
                    >
                      <h4 className="font-body font-semibold text-sm text-on-surface mb-1">
                        {title}
                      </h4>
                      <p className="font-body text-xs text-on-surface-variant leading-relaxed">
                        {desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <ReviewsWall reviews={typedReviews} />

        {/* ── Members unlock ────────────────────────────────
            Pre-CTA benefits section — shows what's behind a free account
        ─────────────────────────────────────────────────── */}
        <section className="py-16 sm:py-28 bg-primary">
          <div className={C}>
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Left: heading */}
              <div className="lg:col-span-4">
                <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-primary/50 mb-5">
                  Free account
                </p>
                <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-on-primary tracking-tight leading-[1.1] mb-5 sm:mb-6">
                  Create an account.
                  <br />
                  Unlock everything.
                </h2>
                <p className="font-body text-base sm:text-lg text-on-primary/70 leading-relaxed mb-8 sm:mb-10">
                  Browsing is free. An account gives you access to the tools
                  that actually change your trajectory.
                </p>
                <Button variant="secondary" size="lg" asChild>
                  <Link href="/signup" className="gap-3">
                    Join free
                    <ArrowRight size={18} strokeWidth={1.5} aria-hidden="true" />
                  </Link>
                </Button>
              </div>

              {/* Right: benefit cards grid */}
              <div className="lg:col-span-8 grid sm:grid-cols-2 gap-4">
                {[
                  {
                    label: "Content library",
                    desc: "Guides, deep-dives, and video Q&As written by mentors who've sat exactly where you are. Members-only access.",
                    accent: "bg-secondary",
                  },
                  {
                    label: "Personalised matching",
                    desc: "Your top mentor recommendations, ranked by who's overcome your exact challenges — country, field, and goals.",
                    accent: "bg-tertiary",
                  },
                  {
                    label: "Live session registration",
                    desc: "Join upcoming Q&As, submit questions in advance (anonymously if you prefer), and watch recordings after.",
                    accent: "bg-secondary",
                  },
                  {
                    label: "Community forums",
                    desc: "Post threads, reply to peers, and get direct responses from verified mentors across five topic areas.",
                    accent: "bg-tertiary",
                  },
                  {
                    label: "Smart notifications",
                    desc: "In-app bell and email alerts for session reminders, forum replies, new mentor content, and story approvals.",
                    accent: "bg-secondary",
                  },
                  {
                    label: "Your success story",
                    desc: "When you've found your footing, share it. Submit your story for review and inspire the next Priya.",
                    accent: "bg-tertiary",
                  },
                ].map(({ label, desc, accent }) => (
                  <div
                    key={label}
                    className="rounded-2xl bg-on-primary/5 border border-on-primary/10 p-6 flex flex-col gap-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full ${accent} shrink-0`} aria-hidden="true" />
                      <h3 className="font-display font-bold text-on-primary text-base">
                        {label}
                      </h3>
                    </div>
                    <p className="font-body text-sm text-on-primary/60 leading-relaxed">
                      {desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────
            Signature hero gradient — the emotional full stop
        ─────────────────────────────────────────────────── */}
        <section
          className="py-16 sm:py-28"
          style={{
            background:
              "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-elevated) 100%)",
          }}
        >
          <div className={`${C} text-center max-w-3xl mx-auto`}>
            <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-primary/60 mb-5 sm:mb-6">
              Ready to begin?
            </p>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-6xl text-on-primary leading-[1.05] tracking-tight mb-5 sm:mb-6">
              Your Melbourne story is waiting.
            </h2>
            <p className="font-body text-base sm:text-lg text-on-primary/80 leading-relaxed mb-8 sm:mb-12 max-w-xl mx-auto">
              Join 500+ international students who found their footing — and
              their community — through Hoddle Melbourne.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="secondary"
                size="lg"
                className="bg-on-primary text-primary hover:bg-surface-container-lowest gap-3"
                asChild
              >
                <Link href="/signup">
                  Create your free account
                  <ArrowRight
                    size={18}
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </Link>
              </Button>
            </div>

            <p className="mt-6 font-body text-sm text-on-primary/50">
              No credit card. No commitment. Just mentorship.
            </p>
          </div>
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="bg-surface-container-high">
        <div className={`${C} py-16 grid grid-cols-1 md:grid-cols-4 gap-10`}>
          {/* Brand column */}
          <div className="md:col-span-1">
            <Image
              src="/logo-light.png"
              alt="Hoddle"
              width={64}
              height={64}
              className="object-contain mb-3"
            />

            <p className="font-body text-sm text-on-surface-variant leading-relaxed max-w-[220px]">
              Connecting Melbourne&apos;s international student community with
              the guidance that changes everything.
            </p>
          </div>

          {/* Community */}
          <div>
            <h3 className="font-body text-xs font-bold uppercase tracking-[0.18em] text-on-surface mb-5">
              Community
            </h3>
            <ul className="space-y-3">
              {["About", "Success Stories", "Forums", "Mentors"].map(
                (label) => (
                  <li key={label}>
                    <Link
                      href="#"
                      className="font-body text-sm text-on-surface-variant hover:text-on-surface transition-colors focus-visible:outline-none focus-visible:underline"
                    >
                      {label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>

          {/* Opportunities */}
          <div>
            <h3 className="font-body text-xs font-bold uppercase tracking-[0.18em] text-on-surface mb-5">
              Opportunities
            </h3>
            <ul className="space-y-3">
              {[
                { label: "Become a Mentor", href: "/apply" },
                { label: "Careers", href: "#" },
                { label: "Partner with Us", href: "#" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="font-body text-sm text-on-surface-variant hover:text-on-surface transition-colors focus-visible:outline-none focus-visible:underline"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-body text-xs font-bold uppercase tracking-[0.18em] text-on-surface mb-5">
              Legal
            </h3>
            <ul className="space-y-3">
              {["Privacy Policy", "Terms of Service", "Contact Us"].map(
                (label) => (
                  <li key={label}>
                    <Link
                      href="#"
                      className="font-body text-sm text-on-surface-variant hover:text-on-surface transition-colors focus-visible:outline-none focus-visible:underline"
                    >
                      {label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className={`${C} py-6`}>
          <div className="h-px bg-outline-variant mb-6" aria-hidden="true" />
          <p className="font-body text-xs text-on-surface-variant">
            © {new Date().getFullYear()} Hoddle Melbourne. Designed for
            international students, by people who remember what it felt like.
          </p>
        </div>
      </footer>
    </div>
  );
}
