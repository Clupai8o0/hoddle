/**
 * computeRecommendationsForProfile
 *
 * Runs the matching algorithm for a single student, writes ranked results
 * to `mentor_recommendations`. Uses the admin client so it can write to the
 * table (RLS blocks client-side writes).
 *
 * Safe to call fire-and-forget (errors are caught and logged).
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { scoreMentor } from "@/lib/matching/score";

/** Minimum score for a mentor to count as a "real" match vs a fallback fill */
const MATCH_THRESHOLD = 10;

/** Always aim to surface this many recommendations */
const TARGET_COUNT = 5;

export async function computeRecommendationsForProfile(
  profileId: string,
): Promise<void> {
  const supabase = createAdminClient();

  // ── Fetch student data ────────────────────────────────────────────────────
  const [{ data: profile }, { data: onboarding }] = await Promise.all([
    supabase
      .from("profiles")
      .select("country_of_origin")
      .eq("id", profileId)
      .single(),
    supabase
      .from("onboarding_responses")
      .select("goals, challenges, fields_of_interest")
      .eq("profile_id", profileId)
      .single(),
  ]);

  if (!onboarding) {
    // Student hasn't completed onboarding — nothing to score against
    return;
  }

  const student = {
    country_of_origin: profile?.country_of_origin ?? null,
    goals: onboarding.goals ?? [],
    challenges: onboarding.challenges ?? [],
    fields_of_interest: onboarding.fields_of_interest ?? [],
  };

  // ── Fetch all verified mentors ────────────────────────────────────────────
  const { data: mentors, error } = await supabase
    .from("mentors")
    .select(
      `profile_id, expertise,
       profiles!mentors_profile_id_fkey(country_of_origin, full_name)`,
    )
    .not("verified_at", "is", null);

  if (error) {
    console.error("[matching] Failed to fetch mentors:", error.message);
    return;
  }

  if (!mentors || mentors.length === 0) return;

  // ── Score and rank ────────────────────────────────────────────────────────
  type MentorRow = (typeof mentors)[number];

  const scored = mentors
    .map((m: MentorRow) => ({
      ...scoreMentor(student, {
        profile_id: m.profile_id,
        expertise: m.expertise ?? [],
        profiles: Array.isArray(m.profiles) ? (m.profiles[0] ?? null) : (m.profiles as { country_of_origin: string | null; full_name: string | null } | null),
      }),
      original: m,
    }))
    .sort((a, b) => b.score - a.score);

  // Strong matches first; pad with top-ranked verified mentors if < 3 qualify
  const aboveThreshold = scored.filter((s) => s.score >= MATCH_THRESHOLD);
  const topResults =
    aboveThreshold.length >= 3
      ? aboveThreshold.slice(0, TARGET_COUNT)
      : scored.slice(0, TARGET_COUNT);

  // ── Persist ───────────────────────────────────────────────────────────────
  const now = new Date().toISOString();

  // Delete stale recommendations before inserting fresh ones
  await supabase
    .from("mentor_recommendations")
    .delete()
    .eq("profile_id", profileId);

  const rows = topResults.map((r, idx) => ({
    profile_id: profileId,
    mentor_id: r.mentor_id,
    rank: idx + 1,
    score: r.score,
    reasoning: r.reasoning,
    computed_at: now,
  }));

  if (rows.length > 0) {
    const { error: insertError } = await supabase
      .from("mentor_recommendations")
      .insert(rows);

    if (insertError) {
      console.error("[matching] Failed to persist recommendations:", insertError.message);
    }
  }
}

/**
 * Recompute recommendations for every student profile that has completed
 * onboarding. Used by the nightly cron.
 */
export async function computeRecommendationsForAllStudents(): Promise<{
  processed: number;
  errors: number;
}> {
  const supabase = createAdminClient();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "student")
    .not("onboarded_at", "is", null);

  if (error || !profiles) {
    console.error("[matching] Failed to fetch profiles:", error?.message);
    return { processed: 0, errors: 1 };
  }

  let processed = 0;
  let errors = 0;

  for (const profile of profiles) {
    try {
      await computeRecommendationsForProfile(profile.id);
      processed++;
    } catch (err) {
      console.error(
        `[matching] Error computing for profile ${profile.id}:`,
        err,
      );
      errors++;
    }
  }

  return { processed, errors };
}
