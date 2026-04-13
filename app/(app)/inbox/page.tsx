import { Container } from "@/components/ui/container";

export const metadata = { title: "Inbox — Hoddle" };

export default function InboxPage() {
  return (
    <Container className="py-16">
      <h1 className="font-display text-3xl font-bold text-primary mb-4">
        Inbox
      </h1>
      <p className="font-body text-on-surface-variant">
        Notifications and messages — coming in Phase 2.
      </p>
    </Container>
  );
}
