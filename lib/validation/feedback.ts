import { z } from "zod";

export const feedbackSchema = z.object({
  category: z.enum(["Bug", "Suggestion", "Confusion", "Other"]),
  message: z
    .string()
    .min(1, "Please enter a message.")
    .max(1000, "Message must be 1000 characters or fewer."),
  pageUrl: z.string().url("Invalid page URL."),
  userId: z.string().uuid("Invalid user ID."),
  userEmail: z.string().email("Invalid email."),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;
