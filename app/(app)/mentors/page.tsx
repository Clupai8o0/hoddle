import { Container } from "@/components/ui/container";

export const metadata = { title: "Mentors — Hoddle" };

export default function MentorsPage() {
  return (
    <Container className="py-16">
      <h1 className="font-display text-3xl font-bold text-primary mb-4">
        Mentors
      </h1>
      <p className="font-body text-on-surface-variant">
        Browse verified mentors — coming in Phase 2.
      </p>
    </Container>
  );
}
