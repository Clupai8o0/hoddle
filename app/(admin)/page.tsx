import { Container } from "@/components/ui/container";

export const metadata = { title: "Admin — Hoddle" };

export default function AdminHomePage() {
  return (
    <Container className="py-16">
      <h1 className="font-display text-3xl font-bold text-primary mb-4">
        Admin
      </h1>
      <p className="font-body text-on-surface-variant">
        Mentor invitations, verification, and story moderation — coming in
        Phase 2.
      </p>
    </Container>
  );
}
