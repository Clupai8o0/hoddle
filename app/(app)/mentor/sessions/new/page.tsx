import { Container } from "@/components/ui/container";
import { SessionForm } from "./session-form";

export const metadata = { title: "Schedule Session — Hoddle" };

export default function NewSessionPage() {
  return (
    <Container className="py-8 sm:py-10 max-w-2xl">
      <header className="mb-8 sm:mb-10">
        <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant mb-1">
          Live Q&amp;As
        </p>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary mb-3">
          Schedule a session
        </h1>
        <p className="font-body text-sm text-on-surface-variant leading-relaxed">
          Set up a live Q&amp;A for students to register and submit questions in
          advance. You can add the meeting link now or later.
        </p>
      </header>

      <SessionForm />
    </Container>
  );
}
