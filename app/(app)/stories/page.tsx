import { Container } from "@/components/ui/container";

export const metadata = { title: "Success Stories — Hoddle" };

export default function StoriesPage() {
  return (
    <Container className="py-16">
      <h1 className="font-display text-3xl font-bold text-primary mb-4">
        Success Stories
      </h1>
      <p className="font-body text-on-surface-variant">
        Student journeys and milestones — coming in Phase 2.
      </p>
    </Container>
  );
}
