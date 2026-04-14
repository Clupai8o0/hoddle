import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { GlassNav, NavLink } from "@/components/layout/glass-nav";
import { Button } from "@/components/ui/button";
import { ApplyForm } from "./apply-form";

export const metadata: Metadata = {
  title: "Apply as a Mentor — Hoddle Melbourne",
  description:
    "Share your Melbourne journey with first-year international students who are walking the same path. Apply to become a Hoddle mentor.",
  openGraph: {
    title: "Apply as a Mentor — Hoddle Melbourne",
    description:
      "Share your Melbourne journey with first-year international students who are walking the same path.",
    url: "https://hoddle.com.au/apply",
  },
};

const C = "max-w-7xl mx-auto px-5 sm:px-10 lg:px-16";

const WHAT_MENTORS_DO = [
  {
    heading: "Publish guides & articles",
    body: "Share advice once — let hundreds of students benefit. Your content lives on the platform and keeps giving long after you write it.",
  },
  {
    heading: "Host live Q&A sessions",
    body: "Run short, focused sessions where students can ask anything. You set the topic, the time, and the format.",
  },
  {
    heading: "Answer forum questions",
    body: "Jump into community threads when you have something valuable to add. No pressure to be everywhere — just where you can help.",
  },
  {
    heading: "Tell your story",
    body: "Your success story — published on Hoddle — becomes a permanent source of inspiration for every student who finds it.",
  },
];

export default function ApplyPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* ── Nav ──────────────────────────────────────────────────────────────── */}
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
            <NavLink href="/apply" active>Apply as mentor</NavLink>
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

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="pt-40 pb-24 bg-primary">
        <div className={C}>
          <div className="max-w-2xl">
            <p className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-secondary mb-5">
              Become a mentor
            </p>
            <h1 className="font-display font-extrabold text-5xl lg:text-6xl text-on-primary leading-[1.05] tracking-tight mb-6">
              Give back the way you wish someone gave back to you.
            </h1>
            <p className="font-body text-lg text-on-primary/70 leading-relaxed max-w-xl">
              You navigated Melbourne as a first-year international student. You
              figured it out. Now there are hundreds of students starting that
              same journey — and they need someone like you.
            </p>
          </div>
        </div>
      </section>

      {/* ── What mentors do ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-surface-container-low">
        <div className={C}>
          <div className="max-w-xl mb-14">
            <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant mb-4">
              The commitment
            </p>
            <h2 className="font-display font-extrabold text-4xl text-on-surface tracking-tight leading-[1.1]">
              What mentors actually do.
            </h2>
            <p className="font-body text-on-surface-variant text-lg leading-relaxed mt-3">
              Hoddle is one-to-many mentorship — no private tutoring, no
              scheduling pressure. You publish advice that scales.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {WHAT_MENTORS_DO.map(({ heading, body }) => (
              <div
                key={heading}
                className="bg-surface-container-lowest rounded-2xl p-7"
              >
                <h3 className="font-display font-bold text-on-surface text-lg mb-2 leading-snug">
                  {heading}
                </h3>
                <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Application form ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-surface">
        <div className={C}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-16 lg:gap-24">

            {/* Left — context */}
            <div className="lg:pt-2">
              <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant mb-4">
                Apply now
              </p>
              <h2 className="font-display font-extrabold text-4xl text-on-surface tracking-tight leading-[1.1] mb-5">
                Tell us about yourself.
              </h2>
              <p className="font-body text-on-surface-variant text-base leading-relaxed mb-8">
                Applications are reviewed by our team, usually within a few
                days. If you&apos;re a good fit, we&apos;ll send you an invite
                link to create your mentor profile.
              </p>
              <div className="space-y-4">
                {[
                  "You completed at least one year as an international student in Melbourne.",
                  "You have advice worth sharing — academic, social, financial, or cultural.",
                  "You can commit a few hours a month to publishing and answering questions.",
                ].map((criterion) => (
                  <div key={criterion} className="flex gap-3 items-start">
                    <span
                      className="mt-0.5 w-5 h-5 rounded-full bg-secondary-container flex items-center justify-center shrink-0"
                      aria-hidden="true"
                    >
                      <svg
                        width="10"
                        height="8"
                        viewBox="0 0 10 8"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M1 4L3.5 6.5L9 1"
                          stroke="#2d6a4f"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                      {criterion}
                    </p>
                  </div>
                ))}
              </div>
              <p className="font-body text-sm text-on-surface-variant mt-10">
                Questions?{" "}
                <Link
                  href="/about"
                  className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                >
                  Learn more about Hoddle
                </Link>
              </p>
            </div>

            {/* Right — form */}
            <div>
              <ApplyForm />
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="py-12 bg-surface-container border-t border-outline-variant/50">
        <div className={C}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <p className="font-display font-bold text-lg text-on-surface">
              Hoddle Melbourne
            </p>
            <p className="font-body text-sm text-on-surface-variant">
              © {new Date().getFullYear()} Hoddle Melbourne. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
