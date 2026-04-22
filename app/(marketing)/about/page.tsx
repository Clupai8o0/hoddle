import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { GlassNav, NavLink } from "@/components/layout/glass-nav";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { SurveyStatWall } from "@/components/patterns/survey-stat-wall";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Hoddle Melbourne",
  description:
    "Hoddle Melbourne connects first-year international students with high-achieving mentors who've walked the same path. One-to-many mentorship, built for the Melbourne experience.",
  openGraph: {
    title: "About — Hoddle Melbourne",
    description:
      "Hoddle Melbourne connects first-year international students with high-achieving mentors who've walked the same path.",
    url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://hoddle-jet.vercel.app"}/about`,
  },
};

const C = "max-w-7xl mx-auto px-4 sm:px-10 lg:px-16";

// ─── Data ────────────────────────────────────────────────────────────────────


const HOW_IT_WORKS = [
  {
    step: "01",
    heading: "Match with a mentor who's walked your path.",
    body: "Tell us your field, your challenges, and where you're from. We surface mentors who share your background — someone who knows what it's like to navigate the same system you're figuring out.",
    bg: "bg-surface-container",
    headingColor: "text-on-surface",
  },
  {
    step: "02",
    heading: "Consume their advice on your own schedule.",
    body: "Read their guides, watch their Q&As, join their live sessions, ask questions in the forum. No scheduling pressure. No awkward cold emails. The knowledge is there when you need it.",
    bg: "bg-secondary-container",
    headingColor: "text-on-secondary-container",
  },
  {
    step: "03",
    heading: "Share your own story when you're ready.",
    body: "The students who struggled most often become the best mentors. When you find your footing — your first High Distinction, your first internship offer — we make it easy to give back.",
    bg: "bg-primary-container",
    headingColor: "text-on-primary-container",
  },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export const revalidate = 3600;

export default async function AboutPage() {
  const supabase = await createClient();
  const { data: mentors } = await supabase
    .from("mentors")
    .select(
      `slug, headline, hometown, current_position,
       profiles!mentors_profile_id_fkey (
         full_name, avatar_url, country_of_origin
       )`,
    )
    .not("verified_at", "is", null)
    .order("verified_at", { ascending: false })
    .limit(3);

  type AboutMentor = {
    slug: string;
    headline: string | null;
    hometown: string | null;
    current_position: string | null;
    profiles: {
      full_name: string | null;
      avatar_url: string | null;
      country_of_origin: string | null;
    } | null;
  };

  const typedMentors = (mentors ?? []) as unknown as AboutMentor[];
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
            <NavLink href="/about" active>
              About
            </NavLink>
            <NavLink href="/mentors">Mentors</NavLink>
            <NavLink href="/forums">Forums</NavLink>
            <NavLink href="/stories">Stories</NavLink>
            <NavLink href="/sessions">Sessions</NavLink>
            <NavLink href="/apply">Apply as mentor</NavLink>
          </>
        }
        actions={
          <>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button variant="primary" size="sm" asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </>
        }
      />

      <main>
        {/* ── Hero / Mission ────────────────────────────────
            Full-bleed cream-to-sky gradient, wide editorial headline,
            tight mission statement below.
        ─────────────────────────────────────────────────── */}
        <section
          className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24 lg:pt-44 lg:pb-32"
          style={{
            background:
              "linear-gradient(160deg, var(--color-surface) 0%, var(--color-primary-container) 100%)",
          }}
        >
          <div className={`${C} grid lg:grid-cols-12 gap-8 lg:gap-10 items-end`}>
            <div className="lg:col-span-8">
              <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-primary mb-5 sm:mb-6">
                Our mission
              </p>
              <h1 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-[4rem] xl:text-[4.5rem] text-on-surface leading-[1.04] tracking-tight mb-6 sm:mb-8">
                One-to-many mentorship
                <br />
                for the students{" "}
                <em className="text-primary not-italic">
                  everyone forgot.
                </em>
              </h1>
              <p className="font-body text-base sm:text-xl text-on-surface-variant leading-relaxed max-w-2xl">
                Hoddle Melbourne is a free mentorship platform built for
                first-year international students. Not tutoring. Not a job
                board. Peer wisdom from high-achievers who've overcome exactly
                what you're up against — and scaled to reach every student who
                needs it.
              </p>
            </div>

            {/* Aside stat column */}
            <div className="lg:col-span-4 lg:text-right flex lg:flex-col gap-6 sm:gap-10 lg:gap-8 flex-wrap">
              {[
                { n: "500+", label: "Students guided" },
                { n: "50+", label: "Verified mentors" },
                { n: "8", label: "Melbourne universities" },
              ].map(({ n, label }) => (
                <div key={label}>
                  <span className="font-display font-extrabold text-3xl sm:text-4xl text-primary block">
                    {n}
                  </span>
                  <span className="font-body text-xs uppercase tracking-widest text-on-surface-variant">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── The problem ───────────────────────────────────
            Asymmetric pull-quote layout lifted from the landing page narrative.
            bg-surface keeps it light; the blockquote anchors the emotional weight.
        ─────────────────────────────────────────────────── */}
        <section className="py-16 sm:py-28 bg-surface">
          <div className={`${C} grid lg:grid-cols-12 gap-10 sm:gap-16 items-start`}>
            {/* Pull quote — wide left column */}
            <div className="lg:col-span-5 lg:sticky lg:top-28">
              <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant mb-6 sm:mb-8">
                The problem
              </p>
              <blockquote className="font-display font-semibold text-2xl sm:text-3xl lg:text-4xl text-primary leading-[1.2] tracking-tight">
                &ldquo;It&rsquo;s 2am. The assignment is due at 9. There&rsquo;s
                no one to call.&rdquo;
              </blockquote>
              <p className="font-body text-sm text-on-surface-variant mt-6 uppercase tracking-widest">
                — Priya, first-year student, UniMelb
              </p>
            </div>

            {/* Narrative body — right column */}
            <div className="lg:col-span-7 space-y-6 font-body text-base sm:text-lg text-on-surface leading-[1.8]">
              <p>
                Priya arrived in Melbourne in February. She'd spent three years
                preparing for this — the visa, the tuition fees, the goodbye at
                the airport. What nobody told her was what came after.
              </p>
              <p>
                The grading system worked differently here. The group projects
                were assessed differently. The internship applications required a
                cover letter format she'd never seen. And her parents, 6,000
                miles away, were proud and supportive but couldn't answer the
                questions that kept her awake.
              </p>
              <p>
                She wasn't failing. She was just navigating in the dark — alone.
              </p>
              <p
                className="font-display font-semibold text-xl text-on-surface bg-surface-container-low rounded-2xl px-7 py-6"
              >
                Across Melbourne's eight universities, tens of thousands of
                students are having Priya's night. At the same time, thousands
                of high-achieving seniors — who survived exactly those nights —
                have advice that no platform is letting them share at scale.
              </p>
              <p>
                Hoddle closes that gap. Not by booking 1:1 calls. By letting one
                mentor's hard-won knowledge reach every student who needs it,
                exactly when they need it.
              </p>
            </div>
          </div>
        </section>

        <SurveyStatWall />

        {/* ── How it works ──────────────────────────────────
            Three tonal cards in bento-style row.
        ─────────────────────────────────────────────────── */}
        <section className="py-28 bg-surface-container-low">
          <div className={C}>
            <div className="max-w-2xl mb-16">
              <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant mb-4">
                How it works
              </p>
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-on-surface tracking-tight leading-[1.1]">
                Three steps. No pressure.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {HOW_IT_WORKS.map(({ step, heading, body, bg, headingColor }) => (
                <div
                  key={step}
                  className={`${bg} rounded-2xl p-8 lg:p-10 flex flex-col gap-6 min-h-[320px]`}
                >
                  <span className="font-display font-extrabold text-5xl text-on-surface/10 leading-none select-none">
                    {step}
                  </span>
                  <div className="flex-1 flex flex-col gap-4">
                    <h3
                      className={`font-display font-bold text-xl lg:text-2xl ${headingColor} leading-snug`}
                    >
                      {heading}
                    </h3>
                    <p className="font-body text-on-surface-variant leading-relaxed">
                      {body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Who we are ────────────────────────────────────
            Mentor cards — live from the database.
        ─────────────────────────────────────────────────── */}
        <section className="py-28 bg-surface">
          <div className={C}>
            <div className="grid lg:grid-cols-12 gap-12 items-start">
              {/* Section label column */}
              <div className="lg:col-span-4">
                <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant mb-4">
                  Who we are
                </p>
                <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-on-surface tracking-tight leading-[1.1] mb-6">
                  Built by people who remember.
                </h2>
                <p className="font-body text-lg text-on-surface-variant leading-relaxed">
                  Every mentor on Hoddle arrived in Melbourne as an international
                  student. They built careers here. Now they share everything
                  they learned.
                </p>
                <Link
                  href="/mentors"
                  className="inline-block mt-6 font-body text-sm font-semibold text-primary hover:underline underline-offset-2"
                >
                  Browse all mentors →
                </Link>
              </div>

              {/* Mentor cards */}
              <div className="lg:col-span-8 grid sm:grid-cols-3 gap-5">
                {typedMentors.map((mentor) => {
                  const name = mentor.profiles?.full_name ?? "Mentor";
                  const initials = name
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0]?.toUpperCase() ?? "")
                    .join("");
                  const origin = mentor.hometown
                    ? `${mentor.hometown} → Melbourne`
                    : mentor.profiles?.country_of_origin ?? null;

                  return (
                    <Link
                      key={mentor.slug}
                      href={`/mentors/${mentor.slug}`}
                      className="group bg-surface-container-lowest rounded-2xl p-6 flex flex-col gap-5 shadow-ambient hover:shadow-ambient-lg transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary"
                    >
                      {mentor.profiles?.avatar_url ? (
                        <div className="w-16 h-16 rounded-xl overflow-hidden relative shrink-0">
                          <Image
                            src={mentor.profiles.avatar_url}
                            alt={name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-primary-container flex items-center justify-center font-display font-bold text-xl text-primary/60 select-none shrink-0">
                          {initials}
                        </div>
                      )}
                      <div>
                        <p className="font-display font-bold text-on-surface text-base leading-snug group-hover:text-primary transition-colors">
                          {name}
                        </p>
                        {mentor.current_position && (
                          <p className="font-body text-sm font-semibold text-secondary mt-0.5">
                            {mentor.current_position}
                          </p>
                        )}
                        {origin && (
                          <p className="font-body text-xs text-on-surface-variant mt-1 uppercase tracking-wider">
                            {origin}
                          </p>
                        )}
                      </div>
                      {mentor.headline && (
                        <p className="font-body text-sm text-on-surface-variant leading-relaxed mt-auto line-clamp-3">
                          {mentor.headline}
                        </p>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── Research & Development Team ───────────────────
            The five people who built Hoddle Melbourne.
        ─────────────────────────────────────────────────── */}
        <section className="py-28 bg-surface-container-low">
          <div className={C}>
            <div className="max-w-2xl mb-16">
              <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant mb-4">
                The team
              </p>
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-on-surface tracking-tight leading-[1.1]">
                Research &amp; development.
              </h2>
              <p className="font-body text-lg text-on-surface-variant leading-relaxed mt-4 max-w-xl">
                Hoddle was conceived, researched, and built by five people who
                spent two semesters listening to international students before
                writing a single line of code.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                {
                  name: "Tanvir Kaur Sohi",
                  role: "Founder",
                  note: "VC 100% Scholar and Psychology student at Deakin. Founded Hoddle after spending her first year navigating Melbourne alone. headspace ambassador.",
                },
                {
                  name: "Samridh Limbu",
                  role: "CTO & Co-Founder",
                  note: "Built Hoddle's platform end-to-end. Co-Founder of TapCraft, DSEC President, and Computer Science student at Deakin University.",
                },
                {
                  name: "Aarav Verma",
                  role: "Co-Founder & AI Engineer",
                  note: "AI Engineer Intern at Brokernote and VC 100% Scholar. Leads Hoddle's matching intelligence and data infrastructure at Deakin.",
                },
                {
                  name: "Chirag P Agarwal",
                  role: "Community & Research",
                  note: "Founder of mymor One and Social Work Master's student at ACAP. Shaped Hoddle's community model and student research programme.",
                },
                {
                  name: "Alexander Tse",
                  role: "Strategy & Development",
                  note: "Master's student in Information Systems at the University of Melbourne. Former consultant bridging product strategy and technical delivery.",
                },
              ].map(({ name, role, note }) => (
                <div
                  key={name}
                  className="bg-surface-container-lowest rounded-2xl p-7 flex flex-col gap-4"
                >
                  {/* Avatar placeholder — initials */}
                  <div className="w-14 h-14 rounded-xl bg-primary-container flex items-center justify-center font-display font-bold text-xl text-primary/70 select-none shrink-0">
                    {name
                      .split(" ")
                      .slice(0, 2)
                      .map((n) => n[0]?.toUpperCase() ?? "")
                      .join("")}
                  </div>
                  <div>
                    <p className="font-display font-bold text-on-surface text-base leading-snug">
                      {name}
                    </p>
                    <p className="font-body text-sm font-semibold text-primary mt-0.5">
                      {role}
                    </p>
                  </div>
                  <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                    {note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── For mentors ───────────────────────────────────
            Dark primary section — editorial blue, cream text.
        ─────────────────────────────────────────────────── */}
        <section className="py-28 bg-primary">
          <div className={`${C} grid lg:grid-cols-12 gap-12 items-center`}>
            {/* Text */}
            <div className="lg:col-span-7">
              <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-primary/50 mb-6">
                For mentors
              </p>
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-on-primary tracking-tight leading-[1.1] mb-6">
                Your hard-won experience
                <br />
                deserves an audience.
              </h2>
              <p className="font-body text-xl text-on-primary/75 leading-relaxed max-w-xl mb-10">
                You've cracked the assessment rubrics. You've landed the
                internship. You know which societies actually open doors. That
                knowledge disappears when you graduate — unless you put it
                somewhere that scales.
              </p>
              <ul className="space-y-4 mb-10">
                {[
                  "Reach hundreds of students with one article or Q&A session — not one.",
                  "Build a personal brand that follows you into your career.",
                  "Verified mentor status recognised by Melbourne's top employers.",
                  "Your story lives on. Students you'll never meet will thank you for it.",
                ].map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-secondary mt-2.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="font-body text-on-primary/80 leading-relaxed">
                      {point}
                    </span>
                  </li>
                ))}
              </ul>
              <Button variant="secondary" size="lg" asChild>
                <Link href="/apply">Apply as a mentor</Link>
              </Button>
            </div>

            {/* Decorative stat card */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              <div className="rounded-2xl bg-on-primary/5 border border-on-primary/10 p-8">
                <p className="font-display font-extrabold text-5xl text-on-primary mb-2">
                  1 article.
                </p>
                <p className="font-body text-on-primary/60 text-lg leading-relaxed">
                  One well-written guide can answer the question 500 students
                  are afraid to ask — for years after you graduate.
                </p>
              </div>
              <div className="rounded-2xl bg-on-primary/5 border border-on-primary/10 p-8">
                <p className="font-display font-extrabold text-5xl text-secondary mb-2">
                  Verified.
                </p>
                <p className="font-body text-on-primary/60 text-lg leading-relaxed">
                  Hoddle-verified mentors are vetted by our team. It's a
                  credential that means something.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────────
            Matches the landing page CTA strip pattern.
        ─────────────────────────────────────────────────── */}
        <section className="py-28 bg-surface-container-low">
          <div className={`${C} text-center max-w-3xl mx-auto`}>
            <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant mb-6">
              Ready to start
            </p>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-on-surface tracking-tight leading-[1.1] mb-6">
              Find your mentor.
              <br />
              Or become one.
            </h2>
            <p className="font-body text-xl text-on-surface-variant leading-relaxed mb-12 max-w-xl mx-auto">
              Both paths start with a two-minute sign-up. No subscription. No
              payment. Just the knowledge you need, from someone who's been
              there.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg" asChild>
                <Link href="/signup" className="gap-3">
                  Join as a student
                  <ArrowRight size={18} strokeWidth={1.5} aria-hidden="true" />
                </Link>
              </Button>
              <Button variant="secondary" size="lg" asChild>
                <Link href="/apply">Apply as a mentor</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="bg-surface-container-high">
        <div className={`${C} py-16 grid grid-cols-1 md:grid-cols-4 gap-10`}>
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
          <div>
            <h3 className="font-body text-xs font-bold uppercase tracking-[0.18em] text-on-surface mb-5">
              Community
            </h3>
            <ul className="space-y-3">
              {[
                { label: "About", href: "/about" },
                { label: "Success Stories", href: "/stories" },
                { label: "Forums", href: "/forums" },
                { label: "Mentors", href: "/mentors" },
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
