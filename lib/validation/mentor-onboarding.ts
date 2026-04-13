import { z } from "zod";

export const mentorOnboardingSchema = z.object({
  headline: z
    .string()
    .min(1, "Headline is required.")
    .max(120, "Keep it to 120 characters or fewer."),
  current_position: z
    .string()
    .min(1, "Current position is required.")
    .max(120, "Keep it to 120 characters or fewer."),
  bio: z
    .string()
    .min(30, "Bio must be at least 30 characters — give students a sense of your story.")
    .max(800, "Bio must be 800 characters or fewer."),
  expertise: z
    .array(z.string())
    .min(1, "Select at least one area.")
    .max(5, "Select up to 5 areas."),
  hometown: z
    .string()
    .min(1, "Hometown is required.")
    .max(100, "Keep it to 100 characters or fewer."),
});

export type MentorOnboardingData = z.infer<typeof mentorOnboardingSchema>;
