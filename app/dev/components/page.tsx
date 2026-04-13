/**
 * Dev-only smoke page — eyeball every primitive.
 * Visit at /dev/components during local development.
 * Not linked from anywhere in the product UI.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import { ProgressPill } from "@/components/ui/progress-pill";
import { Avatar } from "@/components/ui/avatar";
import { Container } from "@/components/ui/container";
import { SectionDivider } from "@/components/ui/section-divider";
import { GlassNav, NavLink } from "@/components/layout/glass-nav";

export default function ComponentSmokeTestPage() {
  return (
    <div className="bg-surface min-h-screen">
      {/* Nav — sticky, will show glass effect when scrolling */}
      <GlassNav
        brand={
          <span className="font-display font-bold text-primary text-lg tracking-tight">
            Hoddle
          </span>
        }
        links={
          <>
            <NavLink href="#" active>Mentors</NavLink>
            <NavLink href="#">Forums</NavLink>
            <NavLink href="#">Stories</NavLink>
          </>
        }
        actions={
          <Button variant="primary" size="sm">Sign up</Button>
        }
      />

      <Container layout="editorial">
        <SectionDivider size="lg" />

        {/* Page title */}
        <h1 className="font-display text-4xl font-bold text-primary mb-2">
          Component Library
        </h1>
        <p className="font-body text-on-surface-variant text-lg mb-12">
          Smoke test — every primitive rendered against the Hoddle design system.
        </p>

        {/* ── Buttons ─────────────────────────────────────── */}
        <section aria-labelledby="buttons-heading" className="mb-16">
          <h2
            id="buttons-heading"
            className="font-body text-xs font-medium uppercase tracking-[0.12em] text-on-surface-variant mb-6"
          >
            Buttons
          </h2>
          <div className="flex flex-wrap gap-4 items-center">
            <Button variant="primary">Primary action</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="hero">Hero CTA</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="primary" disabled>Disabled</Button>
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="lg">Large</Button>
          </div>
        </section>

        {/* ── Inputs ──────────────────────────────────────── */}
        <section aria-labelledby="inputs-heading" className="mb-16">
          <h2
            id="inputs-heading"
            className="font-body text-xs font-medium uppercase tracking-[0.12em] text-on-surface-variant mb-6"
          >
            Inputs
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
            <Input
              label="Full name"
              placeholder="Priya Sharma"
            />
            <Input
              label="Email address"
              type="email"
              placeholder="priya@example.com"
              hint="We'll send your magic link here"
            />
            <Input
              label="University"
              placeholder="University of Melbourne"
              error="Please enter your university"
            />
            <Textarea
              label="Your goals"
              placeholder="Tell us what you're hoping to achieve…"
            />
          </div>
        </section>

        {/* ── Cards ───────────────────────────────────────── */}
        <section aria-labelledby="cards-heading" className="mb-16">
          <h2
            id="cards-heading"
            className="font-body text-xs font-medium uppercase tracking-[0.12em] text-on-surface-variant mb-6"
          >
            Cards
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl">
            <Card>
              <CardHeader>
                <p className="font-display text-base font-semibold text-primary">
                  Static card
                </p>
              </CardHeader>
              <CardContent>
                <p className="font-body text-sm text-on-surface-variant">
                  No hover state — used for inert content blocks.
                </p>
              </CardContent>
            </Card>
            <Card interactive>
              <CardHeader>
                <p className="font-display text-base font-semibold text-primary">
                  Interactive card
                </p>
              </CardHeader>
              <CardContent>
                <p className="font-body text-sm text-on-surface-variant">
                  Hover me — ambient shadow lifts on interaction.
                </p>
              </CardContent>
              <CardFooter>
                <Tag variant="success">Verified mentor</Tag>
              </CardFooter>
            </Card>
            <Card interactive className="bg-surface-container-low">
              <CardContent>
                <p className="font-body text-sm text-on-surface-variant">
                  Tonal variant — `surface-container-low` for inset sections.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ── Tags ────────────────────────────────────────── */}
        <section aria-labelledby="tags-heading" className="mb-16">
          <h2
            id="tags-heading"
            className="font-body text-xs font-medium uppercase tracking-[0.12em] text-on-surface-variant mb-6"
          >
            Tags & Chips
          </h2>
          <div className="flex flex-wrap gap-3">
            <Tag variant="default">Computer Science</Tag>
            <Tag variant="default">Engineering</Tag>
            <Tag variant="success">Verified mentor</Tag>
            <Tag variant="success">Goal achieved</Tag>
            <Tag variant="muted">Draft</Tag>
            <Tag variant="muted">Phase 2</Tag>
          </div>
        </section>

        {/* ── Progress Pills ───────────────────────────────── */}
        <section aria-labelledby="progress-heading" className="mb-16">
          <h2
            id="progress-heading"
            className="font-body text-xs font-medium uppercase tracking-[0.12em] text-on-surface-variant mb-6"
          >
            Progress Pills
          </h2>
          <div className="flex flex-col gap-4 max-w-md">
            <ProgressPill value={25} label="Onboarding complete" />
            <ProgressPill value={60} label="Profile strength" />
            <ProgressPill value={100} label="Goals set" />
            <ProgressPill value={0} label="Forum activity" />
          </div>
        </section>

        {/* ── Avatars ─────────────────────────────────────── */}
        <section aria-labelledby="avatars-heading" className="mb-16">
          <h2
            id="avatars-heading"
            className="font-body text-xs font-medium uppercase tracking-[0.12em] text-on-surface-variant mb-6"
          >
            Avatars
          </h2>
          <div className="flex items-end gap-4">
            <Avatar name="Priya Sharma" size="sm" />
            <Avatar name="James Liu" size="md" />
            <Avatar name="Amara Osei" size="lg" />
            <Avatar name="Wei Chen" size="md" src="https://via.placeholder.com/40" />
          </div>
        </section>

        {/* ── Section Divider ──────────────────────────────── */}
        <section aria-labelledby="divider-heading" className="mb-16">
          <h2
            id="divider-heading"
            className="font-body text-xs font-medium uppercase tracking-[0.12em] text-on-surface-variant mb-6"
          >
            Section Divider (semantic whitespace)
          </h2>
          <div className="bg-surface-container-low rounded-md p-4 text-sm font-body text-on-surface-variant">
            ↑ 48px gap above this block (SectionDivider md)
          </div>
          <SectionDivider size="md" />
          <div className="bg-surface-container-low rounded-md p-4 text-sm font-body text-on-surface-variant">
            ↑ 64px gap above this block (SectionDivider lg)
          </div>
          <SectionDivider size="lg" />
        </section>

        {/* ── Token sanity check ───────────────────────────── */}
        <section aria-labelledby="tokens-heading" className="mb-16">
          <h2
            id="tokens-heading"
            className="font-body text-xs font-medium uppercase tracking-[0.12em] text-on-surface-variant mb-6"
          >
            Color tokens
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { token: "bg-primary", label: "primary" },
              { token: "bg-primary-container", label: "primary-container" },
              { token: "bg-secondary", label: "secondary" },
              { token: "bg-secondary-container", label: "secondary-container" },
              { token: "bg-tertiary", label: "tertiary" },
              { token: "bg-tertiary-container", label: "tertiary-container" },
              { token: "bg-surface", label: "surface" },
              { token: "bg-surface-container-lowest", label: "surface-container-lowest" },
              { token: "bg-surface-container-low", label: "surface-container-low" },
              { token: "bg-surface-container", label: "surface-container" },
              { token: "bg-surface-container-high", label: "surface-container-high" },
              { token: "bg-surface-container-highest", label: "surface-container-highest" },
            ].map(({ token, label }) => (
              <div key={label} className="flex flex-col gap-1.5">
                <div className={`${token} h-12 rounded-md border border-outline-variant`} />
                <span className="font-body text-xs text-on-surface-variant">{label}</span>
              </div>
            ))}
          </div>
        </section>

        <SectionDivider size="lg" />
      </Container>
    </div>
  );
}
