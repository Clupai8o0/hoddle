"use server";

import { createClient } from "@/lib/supabase/server";
import { contentItemSchema, publishSchema } from "@/lib/validation/content-item";
import { notifyFollowersOfContent } from "@/lib/actions/mentor-follows";
import { revalidatePath } from "next/cache";

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getMentorId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (data?.role !== "mentor") return null;
  return user.id;
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createContentItem(
  input: unknown,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const parsed = contentItemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const mentorId = await getMentorId(supabase);
  if (!mentorId) return { ok: false, error: "Not authorised." };

  // Generate a URL slug from the title + short timestamp
  const base = parsed.data.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
  const slug = `${base}-${Date.now().toString(36)}`;

  const { data, error } = await supabase
    .from("content_items")
    .insert({
      mentor_id: mentorId,
      type: parsed.data.type,
      title: parsed.data.title,
      slug,
      excerpt: parsed.data.excerpt ?? null,
      body: parsed.data.body ?? null,
      video_url: parsed.data.video_url || null,
      hero_image_url: parsed.data.hero_image_url || null,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/mentor/content");
  return { ok: true, id: data.id };
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateContentItem(
  id: string,
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = contentItemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const mentorId = await getMentorId(supabase);
  if (!mentorId) return { ok: false, error: "Not authorised." };

  const { error } = await supabase
    .from("content_items")
    .update({
      title: parsed.data.title,
      excerpt: parsed.data.excerpt ?? null,
      body: parsed.data.body ?? null,
      video_url: parsed.data.video_url || null,
      hero_image_url: parsed.data.hero_image_url || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("mentor_id", mentorId); // RLS + ownership check

  if (error) return { ok: false, error: error.message };
  revalidatePath("/mentor/content");
  return { ok: true };
}

// ── Publish / Unpublish ───────────────────────────────────────────────────────

export async function publishContentItem(
  input: unknown,
): Promise<{ ok: true; title: string; slug: string } | { ok: false; error: string }> {
  const parsed = publishSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const mentorId = await getMentorId(supabase);
  if (!mentorId) return { ok: false, error: "Not authorised." };

  const { data: item, error } = await supabase
    .from("content_items")
    .update({ published_at: new Date().toISOString() })
    .eq("id", parsed.data.id)
    .eq("mentor_id", mentorId)
    .select("title, slug")
    .single();

  if (error || !item) return { ok: false, error: error?.message ?? "Not found." };

  // Notify followers — fire-and-forget
  const { data: mentorProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", mentorId)
    .single();

  void notifyFollowersOfContent(
    mentorId,
    item.title,
    item.slug,
    mentorProfile?.full_name ?? "Your mentor",
  );

  revalidatePath("/mentor/content");
  revalidatePath("/content");
  return { ok: true, title: item.title, slug: item.slug };
}

export async function unpublishContentItem(
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = publishSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const mentorId = await getMentorId(supabase);
  if (!mentorId) return { ok: false, error: "Not authorised." };

  const { error } = await supabase
    .from("content_items")
    .update({ published_at: null })
    .eq("id", parsed.data.id)
    .eq("mentor_id", mentorId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/mentor/content");
  revalidatePath("/content");
  return { ok: true };
}

// ── View counter ──────────────────────────────────────────────────────────────
// TODO: debounce per session (currently increments on every page load)
// Uses a non-atomic select→update; fine for a view counter, replace with an
// RPC (`increment_view_count`) once the SQL function is added in a migration.

export async function incrementViewCount(contentId: string): Promise<void> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("content_items")
    .select("view_count")
    .eq("id", contentId)
    .maybeSingle();
  if (data) {
    await supabase
      .from("content_items")
      .update({ view_count: (data.view_count ?? 0) + 1 })
      .eq("id", contentId);
  }
}
