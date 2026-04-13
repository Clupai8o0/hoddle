import { z } from "zod";

export const inviteMentorSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required.")
    .email("Enter a valid email address."),
  note: z.string().max(500, "Note must be 500 characters or fewer.").optional(),
});

export type InviteMentorInput = z.infer<typeof inviteMentorSchema>;
