import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/actions/notifications";

/**
 * Vercel cron job — runs every 5 minutes.
 * Finds sessions starting in the next 10–20 minutes and sends
 * "starting soon" in-app + email notifications to all registrants.
 *
 * Protected by CRON_SECRET header.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // 10–20 min from now window
  const windowStart = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const windowEnd = new Date(Date.now() + 20 * 60 * 1000).toISOString();

  const { data: sessions, error: sessionsError } = await supabase
    .from("live_sessions")
    .select("id, title, scheduled_at, meeting_url")
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
      sent++;
    }
  }

  return NextResponse.json({ sent, sessions: sessions.length });
}
