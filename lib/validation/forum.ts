import { z } from "zod";

export const newThreadSchema = z.object({
  title: z
    .string()
    .min(10, "Title must be at least 10 characters")
    .max(200, "Title must be under 200 characters"),
  body: z
    .string()
    .min(20, "Body must be at least 20 characters")
    .max(10000, "Body must be under 10,000 characters"),
  category_slug: z.string().min(1, "Please select a category"),
  is_anonymous: z.boolean(),
});

export const newPostSchema = z.object({
  thread_id: z.string().uuid(),
  body: z
    .string()
    .min(1, "Reply cannot be empty")
    .max(5000, "Reply must be under 5,000 characters"),
  parent_post_id: z.string().uuid().optional(),
  is_anonymous: z.boolean(),
});

export const editPostSchema = z.object({
  id: z.string().uuid(),
  body: z
    .string()
    .min(1, "Post cannot be empty")
    .max(5000, "Post must be under 5,000 characters"),
});

export const reactionSchema = z.object({
  post_id: z.string().uuid(),
  reaction: z.enum(["heart", "thanks", "helpful"]),
});

export type NewThreadInput = z.infer<typeof newThreadSchema>;
export type NewPostInput = z.infer<typeof newPostSchema>;
export type EditPostInput = z.infer<typeof editPostSchema>;
export type ReactionInput = z.infer<typeof reactionSchema>;
