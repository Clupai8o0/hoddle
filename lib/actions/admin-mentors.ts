"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  adminMentorCreateSchema,
  adminMentorEditSchema,
} from "@/lib/validation/admin-mentor";

const uuidSchema = z.string().uuid("Invalid profile ID.");

// ---------------------------------------------------------------------------
// Helper: verify caller is admin
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
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return { ok: false, error: "Insufficient permissions." };
  }
  return { ok: true, userId: user.id };
}

// ---------------------------------------------------------------------------
// createMentorFromAdmin
// ---------------------------------------------------------------------------

export async function createMentorFromAdmin(
  input: unknown,
): Promise<{ ok: true; profileId: string } | { ok: false; error: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const parsed = adminMentorCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const {
    email,
    full_name,
    headline,
    current_position,
    bio,
    expertise,
    hometown,
    country_of_origin,
    university,
    verify_immediately,
  } = parsed.data;

  const admin = createAdminClient();

  // 1. Create the auth user (this fires handle_new_user trigger → profiles row)
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true, // skip email verification — admin is vouching
  });

  if (authError) {
    // Supabase returns "A user with this email address has already been registered"
    if (authError.message?.includes("already been registered")) {
      return { ok: false, error: "A user with this email already exists." };
    }
    return { ok: false, error: authError.message };
  }

  const userId = authData.user.id;

  // 2. Update the profiles row (created by trigger) with role + details
  const { error: profileError } = await admin
    .from("profiles")
    .update({
      role: "mentor" as const,
      full_name: full_name || null,
      country_of_origin: country_of_origin || null,
      university: university || null,
      onboarded_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (profileError) {
    return { ok: false, error: `Profile update failed: ${profileError.message}` };
  }

  // 3. Generate slug from email
  const emailUsername = email
    .split("@")[0]!
    .replace(/[^a-z0-9]/gi, "-")
    .toLowerCase();
  const slug = `${emailUsername}-${Date.now().toString(36)}`;

  // 4. Create the mentors row
  const { error: mentorError } = await admin.from("mentors").insert({
    profile_id: userId,
    slug,
    headline: headline || null,
    bio: bio || null,
    expertise: expertise ?? [],
    hometown: hometown || null,
    current_position: current_position || null,
    verified_at: verify_immediately ? new Date().toISOString() : null,
  });

  if (mentorError) {
    return { ok: false, error: `Mentor row creation failed: ${mentorError.message}` };
  }

  return { ok: true, profileId: userId };
}

// ---------------------------------------------------------------------------
// updateMentorFromAdmin
// ---------------------------------------------------------------------------

export async function updateMentorFromAdmin(
  profileId: string,
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const idResult = uuidSchema.safeParse(profileId);
  if (!idResult.success) return { ok: false, error: "Invalid profile ID." };

  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const parsed = adminMentorEditSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const {
    full_name,
    headline,
    current_position,
    bio,
    expertise,
    hometown,
    country_of_origin,
    university,
    verify_immediately,
  } = parsed.data;

  const admin = createAdminClient();

  // Update profiles + mentors in parallel
  const [profileResult, mentorResult] = await Promise.all([
    admin
      .from("profiles")
      .update({
        full_name: full_name || null,
        country_of_origin: country_of_origin || null,
        university: university || null,
      })
      .eq("id", profileId),
    admin
      .from("mentors")
      .update({
        headline: headline || null,
        bio: bio || null,
        expertise: expertise ?? [],
        hometown: hometown || null,
        current_position: current_position || null,
      })
      .eq("profile_id", profileId),
  ]);

  if (profileResult.error) {
    return { ok: false, error: `Profile update failed: ${profileResult.error.message}` };
  }
  if (mentorResult.error) {
    return { ok: false, error: `Mentor update failed: ${mentorResult.error.message}` };
  }

  // Handle verify toggle — only set if switching from unverified → verified
  if (verify_immediately) {
    const { data: mentor } = await admin
      .from("mentors")
      .select("verified_at")
      .eq("profile_id", profileId)
      .single();

    if (mentor && !mentor.verified_at) {
      await admin
        .from("mentors")
        .update({ verified_at: new Date().toISOString() })
        .eq("profile_id", profileId);
    }
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// uploadMentorAvatarFromAdmin — uses admin client to bypass avatars RLS
// ---------------------------------------------------------------------------

export async function uploadMentorAvatarFromAdmin(
  profileId: string,
  formData: FormData,
): Promise<{ ok: true; avatarUrl: string } | { ok: false; error: string }> {
  const idResult = uuidSchema.safeParse(profileId);
  if (!idResult.success) return { ok: false, error: "Invalid profile ID." };

  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "No file provided." };
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return { ok: false, error: "Only JPEG, PNG, and WebP images are allowed." };
  }

  // Validate file size (2 MB limit matches bucket config)
  if (file.size > 2 * 1024 * 1024) {
    return { ok: false, error: "Image must be under 2 MB." };
  }

  const admin = createAdminClient();

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${profileId}/avatar.${ext}`;

  // Convert File to ArrayBuffer for server-side upload
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await admin.storage
    .from("avatars")
    .upload(path, buffer, { upsert: true, contentType: file.type });

  if (uploadError) {
    return { ok: false, error: `Upload failed: ${uploadError.message}` };
  }

  const {
    data: { publicUrl },
  } = admin.storage.from("avatars").getPublicUrl(path);

  // Cache-bust
  const avatarUrl = `${publicUrl}?t=${Date.now()}`;

  // Update profile with new avatar URL
  const { error: profileError } = await admin
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", profileId);

  if (profileError) {
    return { ok: false, error: `Saved image but failed to update profile: ${profileError.message}` };
  }

  return { ok: true, avatarUrl };
}
