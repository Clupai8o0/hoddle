import { z } from "zod";

// ── Per-step schemas ─────────────────────────────────────────────────────────

export const step1Schema = z.object({
  full_name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or fewer"),
});

export const step2Schema = z.object({
  country_of_origin: z.string().min(1, "Country is required"),
  university: z.string().min(1, "University is required"),
});

export const step3Schema = z.object({
  goals: z
    .array(z.string())
    .min(1, "Select at least one goal")
    .max(3, "Select up to 3 goals"),
});

export const step4Schema = z.object({
  challenges: z
    .array(z.string())
    .min(1, "Select at least one challenge")
    .max(3, "Select up to 3 challenges"),
});

export const step5Schema = z.object({
  fields_of_interest: z
    .array(z.string())
    .min(1, "Select at least one field")
    .max(3, "Select up to 3 fields"),
});

// ── Full schema (used by the server action) ──────────────────────────────────

export const onboardingSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(step4Schema)
  .merge(step5Schema);

export type OnboardingData = z.infer<typeof onboardingSchema>;

// ── Option vocabulary ────────────────────────────────────────────────────────
// These are enforced in Zod, not in the database, so they can evolve without
// migrations during Phase 1. Promote to Postgres enums when vocabulary stabilises.

export const GOALS = [
  { value: "improve_academic_performance", label: "Improve academic performance" },
  { value: "land_internship", label: "Land an internship" },
  { value: "build_network", label: "Build my network" },
  { value: "improve_english", label: "Improve my English" },
  { value: "find_accommodation", label: "Find accommodation" },
  { value: "understand_local_culture", label: "Understand local culture" },
  { value: "manage_finances", label: "Manage finances" },
  { value: "mental_wellbeing", label: "Support my mental wellbeing" },
] as const;

export const CHALLENGES = [
  { value: "academic_writing", label: "Academic writing" },
  { value: "time_management", label: "Time management" },
  { value: "homesickness", label: "Homesickness" },
  { value: "financial_stress", label: "Financial stress" },
  { value: "career_direction", label: "Career direction" },
  { value: "making_friends", label: "Making friends" },
  { value: "language_barrier", label: "Language barrier" },
  { value: "understanding_grading", label: "Understanding the grading system" },
  { value: "finding_work", label: "Finding part-time work" },
] as const;

export const FIELDS_OF_INTEREST = [
  { value: "engineering", label: "Engineering" },
  { value: "business", label: "Business & Economics" },
  { value: "information_technology", label: "Information Technology" },
  { value: "health_sciences", label: "Health Sciences" },
  { value: "arts_humanities", label: "Arts & Humanities" },
  { value: "design_architecture", label: "Design & Architecture" },
  { value: "law", label: "Law" },
  { value: "science", label: "Science" },
  { value: "education", label: "Education" },
] as const;

export const UNIVERSITIES = [
  "The University of Melbourne",
  "Monash University",
  "RMIT University",
  "Deakin University",
  "La Trobe University",
  "Swinburne University of Technology",
  "Victoria University",
  "Australian Catholic University (Melbourne)",
  "Other",
] as const;

export const COUNTRIES = [
  "China",
  "India",
  "Vietnam",
  "Indonesia",
  "Malaysia",
  "Nepal",
  "Pakistan",
  "Sri Lanka",
  "Bangladesh",
  "Philippines",
  "Thailand",
  "South Korea",
  "Japan",
  "Hong Kong",
  "Taiwan",
  "Singapore",
  "Brazil",
  "Colombia",
  "Mexico",
  "United States",
  "United Kingdom",
  "Canada",
  "Germany",
  "France",
  "Italy",
  "Spain",
  "Other",
] as const;
