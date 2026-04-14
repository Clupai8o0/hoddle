import { z } from "zod";

export const MILESTONE_OPTIONS = [
  "Completed first semester",
  "Passed my hardest subject",
  "Got a part-time job",
  "Landed an internship",
  "Made close friends",
  "Joined a student club",
  "Found my study routine",
  "Navigated visa requirements",
  "Improved my English",
  "Presented in class",
  "Received a scholarship",
  "Connected with a mentor",
] as const;

export const submitSuccessStorySchema = z.object({
  title: z
    .string()
    .min(10, "Title must be at least 10 characters.")
    .max(200, "Title must be 200 characters or fewer."),
  body: z
    .string()
    .min(50, "Story must be at least 50 characters.")
    .max(10000, "Story must be 10,000 characters or fewer."),
  milestones: z
    .array(z.string())
    .min(1, "Select at least one milestone.")
    .max(6, "Select up to 6 milestones."),
  hero_image_url: z
    .string()
    .url("Must be a valid URL.")
    .optional()
    .or(z.literal("")),
});

export const moderateStorySchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
});

export type SubmitSuccessStoryInput = z.infer<typeof submitSuccessStorySchema>;
export type ModerateStoryInput = z.infer<typeof moderateStorySchema>;
