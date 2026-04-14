import { z } from "zod";

export const scheduleSessionSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters.")
    .max(200, "Title must be 200 characters or fewer."),
  description: z.string().max(500).optional().or(z.literal("")),
  // datetime-local value from the browser — converted to ISO on submit
  scheduled_at: z.string().min(1, "Please pick a date and time."),
  duration_minutes: z
    .number()
    .int()
    .min(15, "Minimum 15 minutes.")
    .max(180, "Maximum 3 hours."),
  max_attendees: z.number().int().min(1).max(500).optional(),
  meeting_url: z.string().url("Must be a valid URL.").optional().or(z.literal("")),
});

export const recordingUrlSchema = z.object({
  session_id: z.string().uuid(),
  recording_url: z.string().url("Must be a valid URL."),
});

export const completeSessionSchema = z.object({
  session_id: z.string().uuid(),
  attended_profile_ids: z.array(z.string().uuid()),
});

export type ScheduleSessionInput = z.infer<typeof scheduleSessionSchema>;
export type RecordingUrlInput = z.infer<typeof recordingUrlSchema>;
export type CompleteSessionInput = z.infer<typeof completeSessionSchema>;
