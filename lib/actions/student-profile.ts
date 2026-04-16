"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const studentProfileSchema = z.object({
  full_name: z
    .string()
    .min(1, "Name is required.")
    .max(100, "Name must be 100 characters or fewer."),
  country_of_origin: z.string().min(1, "Country is required."),
  university: z.string().min(1, "University is required."),
  year_of_study: z.number().int().min(1).max(6),
  goals: z
    .array(z.string())
    .min(1, "Select at least one goal.")
    .max(3, "Select up to 3 goals."),
  challenges: z
    .array(z.string())
    .min(1, "Select at least one challenge.")
    .max(3, "Select up to 3 challenges."),
  fields_of_interest: z
    .array(z.string())
    .min(1, "Select at least one area.")
    .max(3, "Select up to 3 areas."),
});

export type StudentProfileData = z.infer<typeof studentProfileSchema>;

export async function updateStudentProfile(
  data: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = studentProfileSchema.safeParse(data);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "Not authenticated." };

  const {
    full_name,
    country_of_origin,
    university,
    year_of_study,
    goals,
    challenges,
    fields_of_interest,
  } = parsed.data;

  const [profileResult, onboardingResult] = await Promise.all([
    supabase
      .from("profiles")
      .update({ full_name, country_of_origin, university, year_of_study })
      .eq("id", user.id),
    supabase.from("onboarding_responses").upsert(
      { profile_id: user.id, goals, challenges, fields_of_interest },
      { onConflict: "profile_id" },
    ),
  ]);

  if (profileResult.error) return { ok: false, error: profileResult.error.message };
  if (onboardingResult.error) return { ok: false, error: onboardingResult.error.message };

  revalidatePath("/dashboard");
  revalidatePath("/profile/edit");
  return { ok: true };
}
