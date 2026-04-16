"use server";

import { createClient } from "@/lib/supabase/server";
import { mentorOnboardingSchema } from "@/lib/validation/mentor-onboarding";

export async function submitMentorOnboarding(
  data: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = mentorOnboardingSchema.safeParse(data);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Some fields are missing or invalid.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "You must be signed in to complete onboarding." };
  }

  // Confirm this user is actually a mentor
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "mentor") {
    return { ok: false, error: "Only mentors can complete mentor onboarding." };
  }

  const { full_name, headline, current_position, bio, expertise, hometown, social_links } = parsed.data;

  const { error: mentorError } = await supabase
    .from("mentors")
    .update({ headline, current_position, bio, expertise, hometown, social_links })
    .eq("profile_id", user.id);

  if (mentorError) {
    return { ok: false, error: "Failed to save your profile. Please try again." };
  }

  // Mark onboarding complete and set full_name
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name, onboarded_at: new Date().toISOString() })
    .eq("id", user.id);

  if (profileError) {
    return { ok: false, error: "Failed to complete onboarding. Please try again." };
  }

  return { ok: true };
}

export async function updateMentorProfile(
  data: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = mentorOnboardingSchema.safeParse(data);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Some fields are missing or invalid.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "You must be signed in." };
  }

  const { full_name, headline, current_position, bio, expertise, hometown, social_links } = parsed.data;

  const [mentorResult, profileResult] = await Promise.all([
    supabase
      .from("mentors")
      .update({ headline, current_position, bio, expertise, hometown, social_links })
      .eq("profile_id", user.id),
    supabase
      .from("profiles")
      .update({ full_name })
      .eq("id", user.id),
  ]);

  if (mentorResult.error || profileResult.error) {
    return { ok: false, error: "Failed to save your profile. Please try again." };
  }

  return { ok: true };
}
