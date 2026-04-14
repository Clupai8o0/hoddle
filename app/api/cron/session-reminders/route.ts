import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { sessionReminderHtml } from "@/lib/email/templates/session-reminder";
import { notify } from "@/lib/actions/notifications";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Vercel cron job — runs every hour.
 *
 * Two tasks per run:
 * 1. 24-hour reminder emails — sessions starting in the 23–25h window.
 * 2. Starting-soon in-app notifications — sessions starting in the 50–70 min
 *    window (non-overlapping with each hourly check; replaces the former
 *    5-minute cron that ran on a 10–20 min window).
 *
 * Protected by CRON_SECRET header set in vercel.json.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: "Missing Supabase env vars" },
      { status: 500 },
    );
  }

  const supabase = createSupabaseClient<Database>(supabaseUrl, serviceKey);

  const now = Date.now();

  // ── Task 1: 24-hour reminder emails ──────────────────────────────────────

  const reminderWindowStart = new Date(now + 23 * 60 * 60 * 1000).toISOString();
  const reminderWindowEnd = new Date(now + 25 * 60 * 60 * 1000).toISOString();

  const { data: reminderSessions, error: reminderError } = await supabase
    .from("live_sessions")
    .select(
      `id, title, scheduled_at, duration_minutes, meeting_url,
       mentors!live_sessions_mentor_id_fkey (
         profiles!mentors_profile_id_fkey (full_name)
       )`,
    )
    .eq("status", "scheduled")
    .gte("scheduled_at", reminderWindowStart)
    .lte("scheduled_at", reminderWindowEnd);

  if (reminderError) {
    return NextResponse.json({ error: reminderError.message }, { status: 500 });
  }

  let remindersSent = 0;

  for (const session of reminderSessions ?? []) {
    const mentorName =
      (
        (session.mentors as { profiles: { full_name: string | null } | null } | null)
          ?.profiles as { full_name: string | null } | null
      )?.full_name ?? "Your mentor";

    const { data: registrations } = await supabase
      .from("session_registrations")
      .select("profile_id")
      .eq("session_id", session.id);

    if (!registrations || registrations.length === 0) continue;

    for (const reg of registrations) {
      const { data: userData, error: userError } =
        await supabase.auth.admin.getUserById(reg.profile_id);

      if (userError || !userData?.user?.email) continue;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", reg.profile_id)
        .maybeSingle();

      const attendeeName = profile?.full_name?.split(" ")[0] ?? "there";

      const html = sessionReminderHtml({
        attendeeName,
        sessionTitle: session.title,
        mentorName,
        scheduledAt: session.scheduled_at,
        durationMinutes: session.duration_minutes,
        meetingUrl: session.meeting_url ?? null,
      });

      const result = await sendEmail({
        to: userData.user.email,
        subject: `Reminder: "${session.title}" is tomorrow`,
        html,
      });

      if (result.ok) remindersSent++;
    }
  }

  // ── Task 2: Starting-soon in-app notifications ────────────────────────────
  // Window: 50–70 min from now (20-min window, non-overlapping per hourly run).

  const soonWindowStart = new Date(now + 50 * 60 * 1000).toISOString();
  const soonWindowEnd = new Date(now + 70 * 60 * 1000).toISOString();

  const { data: soonSessions, error: soonError } = await supabase
    .from("live_sessions")
    .select("id, title, scheduled_at, meeting_url")
    .eq("status", "scheduled")
    .gte("scheduled_at", soonWindowStart)
    .lte("scheduled_at", soonWindowEnd);

  if (soonError) {
    return NextResponse.json({ error: soonError.message }, { status: 500 });
  }

  let soonSent = 0;

  for (const session of soonSessions ?? []) {
    const { data: registrations } = await supabase
      .from("session_registrations")
      .select("profile_id")
      .eq("session_id", session.id);

    if (!registrations || registrations.length === 0) continue;

    for (const reg of registrations) {
      void notify(reg.profile_id, "session_starting_soon", {
        session_id: session.id,
        session_title: session.title,
        scheduled_at: session.scheduled_at,
        meeting_url: session.meeting_url ?? null,
      });
      soonSent++;
    }
  }

  return NextResponse.json({
    reminders_sent: remindersSent,
    soon_notified: soonSent,
    reminder_sessions: (reminderSessions ?? []).length,
    soon_sessions: (soonSessions ?? []).length,
  });
}
