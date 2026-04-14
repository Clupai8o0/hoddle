"use server";

import { createClient } from "@/lib/supabase/server";
import {
  submitSuccessStorySchema,
  moderateStorySchema,
} from "@/lib/validation/success-story";
import { notify } from "@/lib/actions/notifications";
import { revalidatePath } from "next/cache";

async function getCurrentUserId(
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ── Submit story ──────────────────────────────────────────────────────────────

export async function submitSuccessStory(
  input: unknown,
): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  const parsed = submitSuccessStorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const supabase = await createClient();
  const userId = await getCurrentUserId(supabase);
  if (!userId) return { ok: false, error: "Not authenticated." };

  const slug =
    parsed.data.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60) +
    "-" +
    Date.now().toString(36);

  const { data: story, error } = await supabase
    .from("success_stories")
    .insert({
      author_id: userId,
      title: parsed.data.title,
      slug,
      body: parsed.data.body,
      milestones: parsed.data.milestones,
      hero_image_url: parsed.data.hero_image_url || null,
      status: "pending",
      featured: false,
    })
    .select("slug")
    .single();

  if (error || !story) {
    return { ok: false, error: "Failed to submit story." };
  }

  revalidatePath("/stories");
  revalidatePath("/admin/stories");

  return { ok: true, slug: story.slug };
}

// ── Admin: approve or reject ──────────────────────────────────────────────────

export async function moderateStory(
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = moderateStorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const supabase = await createClient();
  const userId = await getCurrentUserId(supabase);
  if (!userId) return { ok: false, error: "Not authenticated." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profile?.role !== "admin") {
    return { ok: false, error: "Not authorised." };
  }

  const updates =
    parsed.data.action === "approve"
      ? { status: "published" as const, published_at: new Date().toISOString() }
      : { status: "rejected" as const };

  const { data: story, error } = await supabase
    .from("success_stories")
    .update(updates)
    .eq("id", parsed.data.id)
    .select("author_id, title, slug")
    .single();

  if (error || !story) return { ok: false, error: "Failed to update story." };

  // Notify author on approval
  if (parsed.data.action === "approve") {
    void notify(story.author_id, "success_story_approved", {
      story_title: story.title,
      story_slug: story.slug,
    });
  }

  revalidatePath("/stories");
  revalidatePath("/admin/stories");

  return { ok: true };
}
