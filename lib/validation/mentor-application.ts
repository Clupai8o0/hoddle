import { z } from "zod";

export const mentorApplicationSchema = z.object({
  full_name: z
    .string()
    .min(2, "Full name must be at least 2 characters.")
    .max(100, "Full name must be 100 characters or fewer."),
  email: z
    .string()
    .min(1, "Email is required.")
    .email("Enter a valid email address."),
  university: z
    .string()
    .min(2, "University or institution is required.")
    .max(120, "Must be 120 characters or fewer."),
  field_of_study: z
    .string()
    .min(2, "Field of study or role is required.")
    .max(120, "Must be 120 characters or fewer."),
  country_of_origin: z
    .string()
    .min(2, "Country of origin is required.")
    .max(80, "Must be 80 characters or fewer."),
  years_in_melbourne: z
    .string()
    .max(40, "Must be 40 characters or fewer.")
    .optional(),
  motivation: z
    .string()
    .min(80, "Please write at least 80 characters — tell us your story.")
    .max(1000, "Please keep your response to 1000 characters or fewer."),
  linkedin_url: z
    .string()
    .url("Enter a valid URL (e.g. https://linkedin.com/in/yourname).")
    .optional()
    .or(z.literal("")),
});

export type MentorApplicationInput = z.infer<typeof mentorApplicationSchema>;
