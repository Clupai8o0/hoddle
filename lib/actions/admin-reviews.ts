"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  adminReviewCreateSchema,
  adminReviewEditSchema,
} from "@/lib/validation/reviews";

const uuidSchema = z.string().uuid("Invalid review ID.");
const ALLOWED_MIME = ["image/webp", "image/jpeg", "image/png"] as const;
const MAX_BYTES = 2 * 1024 * 1024;

// ---------------------------------------------------------------------------
// Helper: verify caller is admin (mirrors lib/actions/admin-mentors.ts)
// ---------------------------------------------------------------------------

async function requireAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { ok: false, error: "Insufficient permissions." };
  }
  return { ok: true, userId: user.id };
}

function revalidateReviewSurfaces(id?: string) {
  revalidatePath("/");
  revalidatePath("/admin/reviews");
  if (id) revalidatePath(`/admin/reviews/${id}/edit`);
}

// ---------------------------------------------------------------------------
// createReview
// ---------------------------------------------------------------------------

export async function createReview(
  input: unknown,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const parsed = adminReviewCreateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .insert({
      author_name: parsed.data.author_name,
      author_context: parsed.data.author_context || null,
      rating: parsed.data.rating,
      content: parsed.data.content,
      published: parsed.data.published,
      display_order: parsed.data.display_order,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to create review." };
  }

  revalidateReviewSurfaces(data.id);
  return { ok: true, id: data.id };
}

// ---------------------------------------------------------------------------
// updateReview
// ---------------------------------------------------------------------------

export async function updateReview(
  id: string,
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const idParsed = uuidSchema.safeParse(id);
  if (!idParsed.success) {
    return { ok: false, error: idParsed.error.issues[0]?.message ?? "Invalid ID." };
  }

  const parsed = adminReviewEditSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("reviews")
    .update({
      author_name: parsed.data.author_name,
      author_context: parsed.data.author_context || null,
      rating: parsed.data.rating,
      content: parsed.data.content,
      published: parsed.data.published,
      display_order: parsed.data.display_order,
    })
    .eq("id", idParsed.data)
    .select("id")
    .single();

  if (error) return { ok: false, error: error.code === "PGRST116" ? "Review not found." : error.message };

  revalidateReviewSurfaces(idParsed.data);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// deleteReview
// ---------------------------------------------------------------------------

export async function deleteReview(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const idParsed = uuidSchema.safeParse(id);
  if (!idParsed.success) {
    return { ok: false, error: idParsed.error.issues[0]?.message ?? "Invalid ID." };
  }

  const admin = createAdminClient();

  // Best-effort avatar cleanup — ignore individual errors so delete still proceeds.
  const { data: files, error: listError } = await admin.storage
    .from("reviews")
    .list(idParsed.data);
  if (listError) return { ok: false, error: `Could not list avatar files: ${listError.message}` };
  if (files && files.length > 0) {
    const paths = files.map((f) => `${idParsed.data}/${f.name}`);
    const { error: removeError } = await admin.storage.from("reviews").remove(paths);
    if (removeError) return { ok: false, error: `Failed to remove avatar files: ${removeError.message}` };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", idParsed.data);

  if (error) return { ok: false, error: error.message };

  revalidateReviewSurfaces();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// uploadReviewAvatar — FormData { file: File }
// Requires the review row to already exist (so we have a stable id for the path).
// ---------------------------------------------------------------------------

export async function uploadReviewAvatar(
  reviewId: string,
  formData: FormData,
): Promise<{ ok: true; avatarUrl: string } | { ok: false; error: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const idParsed = uuidSchema.safeParse(reviewId);
  if (!idParsed.success) {
    return { ok: false, error: idParsed.error.issues[0]?.message ?? "Invalid ID." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No file provided." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "File must be 2 MB or smaller." };
  }
  if (!ALLOWED_MIME.includes(file.type as (typeof ALLOWED_MIME)[number])) {
    return { ok: false, error: "File must be JPEG, PNG, or WebP." };
  }

  const admin = createAdminClient();
  const ext = file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : "jpg";
  const path = `${idParsed.data}/avatar.${ext}`;

  // Clear any prior avatar objects for this review (different extensions).
  const { data: prior } = await admin.storage
    .from("reviews")
    .list(idParsed.data);
  if (prior && prior.length > 0) {
    const stale = prior
      .filter((f) => f.name !== `avatar.${ext}`)
      .map((f) => `${idParsed.data}/${f.name}`);
    if (stale.length) await admin.storage.from("reviews").remove(stale);
  }

  const { error: uploadError } = await admin.storage
    .from("reviews")
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: true,
    });
  if (uploadError) return { ok: false, error: uploadError.message };

  const { data: publicUrlData } = admin.storage
    .from("reviews")
    .getPublicUrl(path);
  const avatarUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

  const supabase = await createClient();
  const { error: dbError } = await supabase
    .from("reviews")
    .update({ avatar_url: avatarUrl })
    .eq("id", idParsed.data);
  if (dbError) return { ok: false, error: dbError.message };

  revalidateReviewSurfaces(idParsed.data);
  return { ok: true, avatarUrl };
}

// ---------------------------------------------------------------------------
// removeReviewAvatar
// ---------------------------------------------------------------------------

export async function removeReviewAvatar(
  reviewId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const idParsed = uuidSchema.safeParse(reviewId);
  if (!idParsed.success) {
    return { ok: false, error: idParsed.error.issues[0]?.message ?? "Invalid ID." };
  }

  const admin = createAdminClient();
  const { data: prior, error: listError } = await admin.storage
    .from("reviews")
    .list(idParsed.data);
  if (listError) return { ok: false, error: `Could not list avatar files: ${listError.message}` };
  if (prior && prior.length > 0) {
    const paths = prior.map((f) => `${idParsed.data}/${f.name}`);
    await admin.storage.from("reviews").remove(paths);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("reviews")
    .update({ avatar_url: null })
    .eq("id", idParsed.data)
    .select("id")
    .single();
  if (error) return { ok: false, error: error.code === "PGRST116" ? "Review not found." : error.message };

  revalidateReviewSurfaces(idParsed.data);
  return { ok: true };
}
