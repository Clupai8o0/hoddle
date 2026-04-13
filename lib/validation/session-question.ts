import { z } from "zod";

export const sessionQuestionSchema = z.object({
  session_id: z.string().uuid("Invalid session."),
  body: z
    .string()
    .min(10, "Question must be at least 10 characters.")
    .max(500, "Question must be 500 characters or fewer."),
  anonymous: z.boolean(),
});

export type SessionQuestionInput = z.infer<typeof sessionQuestionSchema>;
