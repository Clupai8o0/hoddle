import { z } from "zod";

export const contentItemSchema = z.object({
  type: z.enum(["article", "video", "resource"]),
  title: z.string().min(3, "Title must be at least 3 characters.").max(200),
  excerpt: z.string().max(300, "Excerpt must be 300 characters or fewer.").optional(),
  body: z.string().optional(),
  video_url: z
    .string()
    .url("Must be a valid URL.")
    .optional()
    .or(z.literal("")),
  hero_image_url: z
    .string()
    .url("Must be a valid URL.")
    .optional()
    .or(z.literal("")),
});

export type ContentItemInput = z.infer<typeof contentItemSchema>;

export const publishSchema = z.object({
  id: z.string().uuid("Invalid content item."),
});
