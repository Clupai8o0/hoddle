import { Container } from "@/components/ui/container";

export const metadata = { title: "Live Sessions — Hoddle" };

export default function SessionsPage() {
  return (
    <Container className="py-16">
      <h1 className="font-display text-3xl font-bold text-primary mb-4">
        Live Sessions
      </h1>
      <p className="font-body text-on-surface-variant">
        Upcoming Q&amp;A sessions with mentors — coming in Phase 2.
      </p>
    </Container>
  );
}
