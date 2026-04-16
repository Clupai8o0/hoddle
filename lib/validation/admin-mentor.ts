import { z } from "zod";

export const adminMentorCreateSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required.")
    .email("Enter a valid email address."),
  full_name: z
    .string()
    .min(1, "Full name is required.")
    .max(100, "Keep it to 100 characters or fewer."),
  headline: z
    .string()
    .max(120, "Keep it to 120 characters or fewer.")
    .optional()
    .default(""),
  current_position: z
    .string()
    .max(120, "Keep it to 120 characters or fewer.")
    .optional()
    .default(""),
  bio: z
    .string()
    .max(800, "Bio must be 800 characters or fewer.")
    .optional()
    .default(""),
  expertise: z
    .array(z.string())
    .max(5, "Select up to 5 areas.")
    .optional()
    .default([]),
  hometown: z
    .string()
    .max(100, "Keep it to 100 characters or fewer.")
    .optional()
    .default(""),
  country_of_origin: z
    .string()
    .max(100, "Keep it to 100 characters or fewer.")
    .optional()
    .default(""),
  university: z
    .string()
    .max(200, "Keep it to 200 characters or fewer.")
    .optional()
    .default(""),
  verify_immediately: z.boolean().optional().default(false),
});

export const adminMentorEditSchema = adminMentorCreateSchema.omit({ email: true });

export type AdminMentorCreateInput = z.infer<typeof adminMentorCreateSchema>;
export type AdminMentorEditInput = z.infer<typeof adminMentorEditSchema>;
