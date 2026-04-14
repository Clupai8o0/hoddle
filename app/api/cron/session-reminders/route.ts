import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { sessionReminderHtml } from "@/lib/email/templates/session-reminder";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Vercel cron job — runs once daily at 08:00 UTC.
 * Finds sessions starting in the 23–25 hour window and sends
 * 24-hour reminder emails to all registered students.
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

  // Find sessions in the 23–25h from now window
  const windowStart = new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString();
  const windowEnd = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString();

  const { data: sessions, error: sessionsError } = await supabase
    .from("live_sessions")
    .select(
      `id, title, scheduled_at, duration_minutes, meeting_url,
       mentors!live_sessions_mentor_id_fkey (
         profiles!mentors_profile_id_fkey (full_name)
       )`,
    )
    .eq("status", "scheduled")
    .gte("scheduled_at", windowStart)
    .lte("scheduled_at", windowEnd);

  if (sessionsError) {
    return NextResponse.json({ error: sessionsError.message }, { status: 500 });
  }

  if (!sessions || sessions.length === 0) {
    return NextResponse.json({ sent: 0, message: "No sessions in window." });
  }

  let sent = 0;

  for (const session of sessions) {
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

      if (result.ok) sent++;
    }
  }

  return NextResponse.json({ sent, sessions: sessions.length });
}
