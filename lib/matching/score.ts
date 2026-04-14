/**
 * Pure scoring function — no I/O, fully testable.
 *
 * Scoring rules (from todo.md §10):
 *   country_of_origin match           → +30
 *   field_of_interest overlap         → +15 per match
 *   challenges overlap with expertise → +10 per match
 *   goals overlap with expertise      → +10 per match
 *
 * Verified mentor is a pre-filter, not a score component.
 */

import {
  GOALS,
  CHALLENGES,
  FIELDS_OF_INTEREST,
} from "@/lib/validation/onboarding";

export interface StudentInput {
  country_of_origin: string | null;
  goals: string[];
  challenges: string[];
  fields_of_interest: string[];
}

export interface MentorInput {
  profile_id: string;
  expertise: string[];
  profiles: {
    country_of_origin: string | null;
    full_name: string | null;
  } | null;
}

export interface ScoreResult {
  mentor_id: string;
  score: number;
  reasoning: string;
}

function goalLabel(value: string): string {
  return GOALS.find((g) => g.value === value)?.label ?? value;
}
function challengeLabel(value: string): string {
  return CHALLENGES.find((c) => c.value === value)?.label ?? value;
}
function fieldLabel(value: string): string {
  return FIELDS_OF_INTEREST.find((f) => f.value === value)?.label ?? value;
}

export function scoreMentor(
  student: StudentInput,
  mentor: MentorInput,
): ScoreResult {
  let score = 0;
  const reasonParts: string[] = [];

  // ── Country of origin match (+30) ──────────────────────────────────────────
  const studentCountry = student.country_of_origin?.toLowerCase().trim();
  const mentorCountry = mentor.profiles?.country_of_origin?.toLowerCase().trim();
  if (studentCountry && mentorCountry && studentCountry === mentorCountry) {
    score += 30;
    reasonParts.push(`Also from ${mentor.profiles!.country_of_origin}`);
  }

  // ── Field of interest overlap (+15 each) ───────────────────────────────────
  const fieldMatches = student.fields_of_interest.filter((f) =>
    mentor.expertise.includes(f),
  );
  score += fieldMatches.length * 15;
  if (fieldMatches.length > 0) {
    const labels = fieldMatches.map(fieldLabel);
    reasonParts.push(`Expertise in ${labels.join(", ")}`);
  }

  // ── Challenges overlap (+10 each) ──────────────────────────────────────────
  const challengeMatches = student.challenges.filter((c) =>
    mentor.expertise.includes(c),
  );
  score += challengeMatches.length * 10;
  if (challengeMatches.length > 0) {
    const labels = challengeMatches.map(challengeLabel);
    reasonParts.push(`Has navigated ${labels.join(", ").toLowerCase()}`);
  }

  // ── Goals overlap (+10 each) ───────────────────────────────────────────────
  const goalMatches = student.goals.filter((g) =>
    mentor.expertise.includes(g),
  );
  score += goalMatches.length * 10;
  if (goalMatches.length > 0) {
    const labels = goalMatches.map(goalLabel);
    reasonParts.push(`Can help with ${labels.join(", ").toLowerCase()}`);
  }

  return {
    mentor_id: mentor.profile_id,
    score,
    reasoning: reasonParts.join(" · ") || "Verified mentor on Hoddle",
  };
}
