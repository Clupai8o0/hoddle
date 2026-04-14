import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/container";
import { NewThreadForm } from "./new-thread-form";

export const metadata = { title: "New Discussion — Hoddle Forums" };

export default async function NewThreadPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: categories } = await supabase
    .from("forum_categories")
    .select("slug, name")
    .order("sort_order");

  return (
    <Container className="py-16 max-w-2xl">
      <Link
        href="/forums"
        className="inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary transition-colors font-body mb-8"
      >
        <ChevronLeft strokeWidth={1.5} className="w-4 h-4" />
        Back to Forums
      </Link>

      <header className="mb-10">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-on-surface mb-3">
          Start a discussion
        </h1>
        <p className="font-body text-on-surface-variant">
          Share your question or experience with the Hoddle community.
        </p>
      </header>

      <NewThreadForm categories={categories ?? []} />
    </Container>
  );
}
