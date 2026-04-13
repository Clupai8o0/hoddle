"use server";

import { createClient } from "@/lib/supabase/server";
import { onboardingSchema } from "@/lib/validation/onboarding";

export async function submitOnboarding(
  data: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = onboardingSchema.safeParse(data);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Some responses are missing or invalid. Please review each step.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      ok: false,
      error: "You must be signed in to complete onboarding.",
    };
  }

  const {
    full_name,
    country_of_origin,
    university,
    goals,
    challenges,
    fields_of_interest,
  } = parsed.data;

  // Update the profile row
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name,
      country_of_origin,
      university,
      year_of_study: 1,
      onboarded_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (profileError) {
    return {
      ok: false,
      error: "Failed to save your profile. Please try again.",
    };
  }

  // Upsert onboarding responses (safe to re-run if the wizard is restarted)
  const { error: responsesError } = await supabase
    .from("onboarding_responses")
    .upsert({
      profile_id: user.id,
      goals,
      challenges,
      fields_of_interest,
    });

  if (responsesError) {
    return {
      ok: false,
      error: "Failed to save your responses. Please try again.",
    };
  }

  return { ok: true };
}
