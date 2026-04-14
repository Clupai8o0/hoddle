"use server";

import { createClient } from "@/lib/supabase/server";
import { sessionQuestionSchema } from "@/lib/validation/session-question";
import { checkRateLimit } from "@/lib/utils/rate-limit";

export async function submitSessionQuestion(
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = sessionQuestionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "You must be signed in to ask a question." };

  // Rate limit: max 5 questions per 60 minutes
  const limit = await checkRateLimit({
    supabase,
    table: "session_questions",
    userColumn: "profile_id",
    userId: user.id,
    windowMinutes: 60,
    maxCount: 5,
    label: "session questions",
  });
  if (!limit.allowed) return { ok: false, error: limit.error };

  const { session_id, body, anonymous } = parsed.data;

  // Verify session exists, is upcoming, and belongs to a real mentor
  const now = new Date().toISOString();
  const { data: session } = await supabase
    .from("live_sessions")
    .select("id, status, scheduled_at")
    .eq("id", session_id)
    .gte("scheduled_at", now)
    .eq("status", "scheduled")
    .maybeSingle();

  if (!session) {
    return { ok: false, error: "This session is no longer accepting questions." };
  }

  const { error } = await supabase.from("session_questions").insert({
    session_id,
    profile_id: user.id,
    body: body.trim(),
    anonymous,
    answered: false,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
