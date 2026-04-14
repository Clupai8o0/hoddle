"use server";

import { createClient } from "@/lib/supabase/server";
import {
  scheduleSessionSchema,
  recordingUrlSchema,
  completeSessionSchema,
} from "@/lib/validation/session";
import { revalidatePath } from "next/cache";

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getCurrentUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

async function assertMentor(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  return data?.role === "mentor";
}

// ── Schedule session (mentor only) ────────────────────────────────────────────

export async function scheduleSession(
  input: unknown,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const parsed = scheduleSessionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) return { ok: false, error: "Not authenticated." };
  if (!(await assertMentor(supabase, user.id))) return { ok: false, error: "Not authorised." };

  // Convert the datetime-local string to a UTC ISO timestamp
  const scheduledAtIso = new Date(parsed.data.scheduled_at).toISOString();

  const { data, error } = await supabase
    .from("live_sessions")
    .insert({
      mentor_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      scheduled_at: scheduledAtIso,
      duration_minutes: parsed.data.duration_minutes,
      max_attendees: parsed.data.max_attendees ?? null,
      meeting_url: parsed.data.meeting_url || null,
      status: "scheduled",
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: "Failed to schedule session." };

  revalidatePath("/mentor/sessions");
  revalidatePath("/sessions");

  return { ok: true, id: data.id };
}

// ── Register for session ──────────────────────────────────────────────────────

export async function registerForSession(
  sessionId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) return { ok: false, error: "Not authenticated." };

  // Verify session is upcoming and scheduled
  const { data: session } = await supabase
    .from("live_sessions")
    .select("id, status, scheduled_at, max_attendees")
    .eq("id", sessionId)
    .eq("status", "scheduled")
    .gte("scheduled_at", new Date().toISOString())
    .maybeSingle();

  if (!session) return { ok: false, error: "Session not found or no longer available." };

  // Enforce capacity
  if (session.max_attendees) {
    const { count } = await supabase
      .from("session_registrations")
      .select("profile_id", { count: "exact", head: true })
      .eq("session_id", sessionId);

    if ((count ?? 0) >= session.max_attendees) {
      return { ok: false, error: "This session is full." };
    }
  }

  const { error } = await supabase
    .from("session_registrations")
    .upsert({ session_id: sessionId, profile_id: user.id }, { onConflict: "session_id,profile_id" });

  if (error) return { ok: false, error: "Failed to register." };

  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath("/sessions");

  return { ok: true };
}

// ── Unregister from session ───────────────────────────────────────────────────

export async function unregisterFromSession(
  sessionId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) return { ok: false, error: "Not authenticated." };

  const { error } = await supabase
    .from("session_registrations")
    .delete()
    .eq("session_id", sessionId)
    .eq("profile_id", user.id);

  if (error) return { ok: false, error: "Failed to unregister." };

  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath("/sessions");

  return { ok: true };
}

// ── Complete session + mark attendance (mentor only) ──────────────────────────

export async function completeSession(
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = completeSessionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) return { ok: false, error: "Not authenticated." };
  if (!(await assertMentor(supabase, user.id))) return { ok: false, error: "Not authorised." };

  // Verify session belongs to this mentor
  const { data: session } = await supabase
    .from("live_sessions")
    .select("id")
    .eq("id", parsed.data.session_id)
    .eq("mentor_id", user.id)
    .maybeSingle();

  if (!session) return { ok: false, error: "Session not found." };

  // Mark session as completed
  await supabase
    .from("live_sessions")
    .update({ status: "completed" })
    .eq("id", parsed.data.session_id);

  // Mark attended profiles
  if (parsed.data.attended_profile_ids.length > 0) {
    await supabase
      .from("session_registrations")
      .update({ attended: true })
      .eq("session_id", parsed.data.session_id)
      .in("profile_id", parsed.data.attended_profile_ids);
  }

  revalidatePath(`/mentor/sessions/${parsed.data.session_id}`);
  revalidatePath("/mentor/sessions");

  return { ok: true };
}

// ── Set recording URL (mentor only) ──────────────────────────────────────────

export async function setRecordingUrl(
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = recordingUrlSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) return { ok: false, error: "Not authenticated." };
  if (!(await assertMentor(supabase, user.id))) return { ok: false, error: "Not authorised." };

  const { error } = await supabase
    .from("live_sessions")
    .update({ recording_url: parsed.data.recording_url })
    .eq("id", parsed.data.session_id)
    .eq("mentor_id", user.id);

  if (error) return { ok: false, error: "Failed to save recording URL." };

  revalidatePath(`/mentor/sessions/${parsed.data.session_id}`);
  revalidatePath(`/sessions/${parsed.data.session_id}`);

  return { ok: true };
}
