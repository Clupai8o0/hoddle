"use server";

import { createClient } from "@/lib/supabase/server";
import {
  newThreadSchema,
  newPostSchema,
  editPostSchema,
  reactionSchema,
} from "@/lib/validation/forum";
import { revalidatePath } from "next/cache";

async function getCurrentUserId(
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ── Create thread ─────────────────────────────────────────────────────────────

export async function createThread(
  input: unknown,
): Promise<
  | { ok: true; slug: string; category: string }
  | { ok: false; error: string }
> {
  const parsed = newThreadSchema.safeParse(input);
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
      .replace(/\s+/g, "-")
      .slice(0, 60) +
    "-" +
    Date.now().toString(36);

  const { data: thread, error } = await supabase
    .from("forum_threads")
    .insert({
      title: parsed.data.title,
      body: parsed.data.body,
      category_slug: parsed.data.category_slug,
      author_id: userId,
      slug,
    })
    .select("id, slug, category_slug")
    .single();

  if (error || !thread) {
    return { ok: false, error: "Failed to create thread." };
  }

  revalidatePath("/forums");
  revalidatePath(`/forums/${thread.category_slug}`);

  return { ok: true, slug: thread.slug, category: thread.category_slug };
}

// ── Create post (reply) ───────────────────────────────────────────────────────

export async function createPost(
  input: unknown,
  threadPath: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = newPostSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const supabase = await createClient();
  const userId = await getCurrentUserId(supabase);
  if (!userId) return { ok: false, error: "Not authenticated." };

  const { data: thread } = await supabase
    .from("forum_threads")
    .select("locked")
    .eq("id", parsed.data.thread_id)
    .is("deleted_at", null)
    .single();

  if (!thread) return { ok: false, error: "Thread not found." };
  if (thread.locked) return { ok: false, error: "This thread is locked." };

  const { error } = await supabase.from("forum_posts").insert({
    thread_id: parsed.data.thread_id,
    author_id: userId,
    body: parsed.data.body,
    parent_post_id: parsed.data.parent_post_id ?? null,
  });

  if (error) return { ok: false, error: "Failed to post reply." };

  revalidatePath(threadPath);

  return { ok: true };
}

// ── Toggle reaction ───────────────────────────────────────────────────────────

export async function toggleReaction(
  input: unknown,
  threadPath: string,
): Promise<{ ok: true; removed: boolean } | { ok: false; error: string }> {
  const parsed = reactionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input." };

  const supabase = await createClient();
  const userId = await getCurrentUserId(supabase);
  if (!userId) return { ok: false, error: "Not authenticated." };

  const { data: existing } = await supabase
    .from("forum_reactions")
    .select("post_id")
    .eq("post_id", parsed.data.post_id)
    .eq("profile_id", userId)
    .eq("reaction", parsed.data.reaction)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("forum_reactions")
      .delete()
      .eq("post_id", parsed.data.post_id)
      .eq("profile_id", userId)
      .eq("reaction", parsed.data.reaction);
  } else {
    await supabase.from("forum_reactions").insert({
      post_id: parsed.data.post_id,
      profile_id: userId,
      reaction: parsed.data.reaction,
    });
  }

  revalidatePath(threadPath);

  return { ok: true, removed: !!existing };
}

// ── Edit post ─────────────────────────────────────────────────────────────────

export async function editPost(
  input: unknown,
  threadPath: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = editPostSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const supabase = await createClient();
  const userId = await getCurrentUserId(supabase);
  if (!userId) return { ok: false, error: "Not authenticated." };

  const { data: post } = await supabase
    .from("forum_posts")
    .select("author_id, created_at")
    .eq("id", parsed.data.id)
    .is("deleted_at", null)
    .single();

  if (!post) return { ok: false, error: "Post not found." };
  if (post.author_id !== userId) return { ok: false, error: "Not your post." };

  const age = Date.now() - new Date(post.created_at).getTime();
  if (age > 30 * 60 * 1000) {
    return {
      ok: false,
      error: "Posts can only be edited within 30 minutes of posting.",
    };
  }

  const { error } = await supabase
    .from("forum_posts")
    .update({ body: parsed.data.body, edited_at: new Date().toISOString() })
    .eq("id", parsed.data.id);

  if (error) return { ok: false, error: "Failed to update post." };

  revalidatePath(threadPath);

  return { ok: true };
}

// ── Delete post (soft) ────────────────────────────────────────────────────────

export async function deletePost(
  postId: string,
  threadPath: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const userId = await getCurrentUserId(supabase);
  if (!userId) return { ok: false, error: "Not authenticated." };

  const { data: post } = await supabase
    .from("forum_posts")
    .select("author_id")
    .eq("id", postId)
    .is("deleted_at", null)
    .single();

  if (!post) return { ok: false, error: "Post not found." };
  if (post.author_id !== userId) return { ok: false, error: "Not your post." };

  const { error } = await supabase
    .from("forum_posts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", postId);

  if (error) return { ok: false, error: "Failed to delete post." };

  revalidatePath(threadPath);

  return { ok: true };
}
