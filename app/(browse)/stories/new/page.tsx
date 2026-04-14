import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/container";
import { StoryForm } from "./story-form";

export const metadata = {
  title: "Share Your Story — Hoddle",
  description:
    "Tell your Melbourne journey. Your experience could be exactly what another student needs to hear.",
};

export default async function NewStoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <Container className="py-16">
      <div className="max-w-2xl">
        <nav
          className="font-body text-xs text-on-surface-variant uppercase tracking-wider mb-8 flex items-center gap-2"
          aria-label="Breadcrumb"
        >
          <a href="/stories" className="hover:text-primary transition-colors">
            Stories
          </a>
          <span aria-hidden="true">›</span>
          <span className="text-on-surface">Share yours</span>
        </nav>

        <header className="mb-12">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-on-surface mb-4 leading-[1.1]">
            Share your story
          </h1>
          <p className="font-body text-lg text-on-surface-variant leading-relaxed">
            Tell us about your journey as an international student in Melbourne.
            The honest parts, the hard parts, and the moments that changed
            everything.
          </p>
        </header>

        <StoryForm />
      </div>
    </Container>
  );
}
