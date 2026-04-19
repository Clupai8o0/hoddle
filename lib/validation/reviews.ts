import { z } from "zod";

export const adminReviewCreateSchema = z.object({
  author_name: z
    .string()
    .trim()
    .min(1, "Author name is required.")
    .max(120, "Keep the name to 120 characters or fewer."),
  author_context: z
    .string()
    .trim()
    .max(160, "Keep context to 160 characters or fewer.")
    .optional()
    .default(""),
  rating: z.coerce
    .number()
    .int("Rating must be a whole number.")
    .min(1, "Rating must be at least 1 star.")
    .max(5, "Rating can't exceed 5 stars."),
  content: z
    .string()
    .trim()
    .min(10, "Review must be at least 10 characters.")
    .max(400, "Keep the review to 400 characters or fewer."),
  published: z.boolean().optional().default(true),
  display_order: z.coerce.number().int().optional().default(0),
});

export const adminReviewEditSchema = adminReviewCreateSchema;

export type AdminReviewCreateInput = z.infer<typeof adminReviewCreateSchema>;
export type AdminReviewEditInput = z.infer<typeof adminReviewEditSchema>;
