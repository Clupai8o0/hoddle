import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ContentForm } from "@/app/(app)/mentor/content/content-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Edit Content — Hoddle" };

export default async function EditContentPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: item } = await supabase
    .from("content_items")
    .select("id, type, title, excerpt, body, video_url, hero_image_url, published_at, mentor_id")
    .eq("id", id)
    .maybeSingle();

  if (!item || item.mentor_id !== user.id) notFound();

  const existing = {
    id: item.id,
    type: item.type,
    title: item.title,
    excerpt: item.excerpt,
    body: item.body as string | null,
    video_url: item.video_url,
    hero_image_url: item.hero_image_url,
    published_at: item.published_at,
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <header>
        <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant mb-1">
          Content
        </p>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary break-words">
          Edit: {item.title}
        </h1>
        <p className="font-body text-sm text-on-surface-variant mt-2">
          {item.published_at
            ? "This article is live. Changes save immediately."
            : "This is a draft. Publish when you're ready."}
        </p>
      </header>

      <ContentForm existing={existing} />
    </div>
  );
}
