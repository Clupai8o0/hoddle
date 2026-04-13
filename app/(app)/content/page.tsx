import { Container } from "@/components/ui/container";

export const metadata = { title: "Content Library — Hoddle" };

export default function ContentPage() {
  return (
    <Container className="py-16">
      <h1 className="font-display text-3xl font-bold text-primary mb-4">
        Content Library
      </h1>
      <p className="font-body text-on-surface-variant">
        Guides, articles, and videos from mentors — coming in Phase 2.
      </p>
    </Container>
  );
}
