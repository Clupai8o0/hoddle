import { z } from "zod";

export const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  body: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(4000, "Message too long"),
});

export const getOrCreateConversationSchema = z.object({
  otherProfileId: z.string().uuid(),
});

export const markConversationReadSchema = z.object({
  conversationId: z.string().uuid(),
});

export const getConversationsSchema = z.object({
  cursor: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

export const getMessagesSchema = z.object({
  conversationId: z.string().uuid(),
  cursor: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(50).default(30),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type GetOrCreateConversationInput = z.infer<
  typeof getOrCreateConversationSchema
>;
export type MarkConversationReadInput = z.infer<
  typeof markConversationReadSchema
>;
export type GetConversationsInput = z.infer<typeof getConversationsSchema>;
export type GetMessagesInput = z.infer<typeof getMessagesSchema>;
