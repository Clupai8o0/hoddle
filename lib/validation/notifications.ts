import { z } from "zod";

export const updateNotificationPreferencesSchema = z.object({
  email_enabled: z.boolean(),
  in_app_enabled: z.boolean(),
  types_muted: z.array(z.string()),
});

export type UpdateNotificationPreferencesInput = z.infer<
  typeof updateNotificationPreferencesSchema
>;
