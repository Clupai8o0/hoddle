import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/container";
import { NewThreadForm } from "@/app/(browse)/forums/new/new-thread-form";

interface PageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { category } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("forum_categories")
    .select("name")
    .eq("slug", category)
    .single();
  if (!data) return { title: "New Discussion — Hoddle Forums" };
  return { title: `New Discussion in ${data.name} — Hoddle` };
}

export default async function CategoryNewThreadPage({ params }: PageProps) {
  const { category } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: currentCat }, { data: categories }] = await Promise.all([
    supabase
      .from("forum_categories")
      .select("slug, name")
      .eq("slug", category)
      .single(),
    supabase
      .from("forum_categories")
      .select("slug, name")
      .order("sort_order"),
  ]);

  if (!currentCat) notFound();

  return (
    <Container className="py-16 max-w-2xl">
      <Link
        href={`/forums/${category}`}
        className="inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary transition-colors font-body mb-8"
      >
        <ChevronLeft strokeWidth={1.5} className="w-4 h-4" />
        Back to {currentCat.name}
      </Link>

      <header className="mb-10">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-on-surface mb-3">
          Start a discussion
        </h1>
        <p className="font-body text-on-surface-variant">
          Posting in{" "}
          <span className="font-semibold text-on-surface">
            {currentCat.name}
          </span>
        </p>
      </header>

      <NewThreadForm
        categories={categories ?? []}
        defaultCategory={category}
      />
    </Container>
  );
}
