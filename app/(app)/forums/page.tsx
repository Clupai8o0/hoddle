import { Container } from "@/components/ui/container";

export const metadata = { title: "Forums — Hoddle" };

export default function ForumsPage() {
  return (
    <Container className="py-16">
      <h1 className="font-display text-3xl font-bold text-primary mb-4">
        Forums
      </h1>
      <p className="font-body text-on-surface-variant">
        Community discussions — coming in Phase 2.
      </p>
    </Container>
  );
}
