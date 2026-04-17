import Link from "next/link";
import { Plus, Users, Clock, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";

export const metadata = { title: "Sessions — Hoddle" };
export const dynamic = "force-dynamic";

type Session = {
  id: string;
  title: string;
  description?: string | null;
  scheduled_at: string;
  duration_minutes: number;
  max_attendees?: number | null;
  status: string;
  recording_url?: string | null;
  session_registrations: { count: number }[];
};

export default async function MentorSessionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const now = new Date().toISOString();

  const [{ data: upcoming }, { data: past }] = await Promise.all([
    supabase
      .from("live_sessions")
      .select(
        "id, title, description, scheduled_at, duration_minutes, max_attendees, status, session_registrations(count)",
      )
      .eq("mentor_id", user!.id)
      .gte("scheduled_at", now)
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("live_sessions")
      .select(
        "id, title, scheduled_at, duration_minutes, status, recording_url, session_registrations(count)",
      )
      .eq("mentor_id", user!.id)
      .lt("scheduled_at", now)
      .order("scheduled_at", { ascending: false })
      .limit(10),
  ]);

  const typedUpcoming = (upcoming ?? []) as unknown as Session[];
  const typedPast = (past ?? []) as unknown as Session[];

  return (
    <div className="space-y-8 sm:space-y-10">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant mb-1">
            Live Q&amp;As
          </p>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary">
            Sessions
          </h1>
        </div>
        <Button asChild variant="primary" size="default">
          <Link href="/mentor/sessions/new">
            <Plus size={15} strokeWidth={1.5} aria-hidden="true" />
            <span className="whitespace-nowrap">Schedule session</span>
          </Link>
        </Button>
      </header>

      {/* Upcoming */}
      <section>
        <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant mb-4">
          Upcoming ({typedUpcoming.length})
        </p>
        {typedUpcoming.length === 0 ? (
          <div className="bg-surface-container-low rounded-xl p-8 text-center">
            <p className="font-body text-on-surface-variant mb-4">
              No upcoming sessions. Schedule a live Q&amp;A to connect with
              students.
            </p>
            <Button asChild size="sm">
              <Link href="/mentor/sessions/new">Schedule one now</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {typedUpcoming.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </section>

      {/* Past */}
      {typedPast.length > 0 && (
        <section>
          <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant mb-4">
            Past sessions ({typedPast.length})
          </p>
          <div className="space-y-3">
            {typedPast.map((session) => (
              <SessionCard key={session.id} session={session} past />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SessionCard({
  session,
  past = false,
}: {
  session: Session;
  past?: boolean;
}) {
  const date = new Date(session.scheduled_at);
  const dateStr = date.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const timeStr = date.toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "2-digit",
  });
  const regCount = session.session_registrations[0]?.count ?? 0;

  return (
    <Link
      href={`/mentor/sessions/${session.id}`}
      className="group bg-surface-container rounded-xl px-4 sm:px-5 py-4 sm:py-5 flex items-start justify-between gap-3 sm:gap-4 hover:bg-surface-container-high transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Tag
            variant={
              session.status === "completed"
                ? "success"
                : past
                  ? "muted"
                  : "default"
            }
            className="text-[10px] px-2 py-0.5"
          >
            {session.status === "completed"
              ? "Completed"
              : past
                ? "Past"
                : "Upcoming"}
          </Tag>
          {!past && session.recording_url && (
            <Tag variant="success" className="text-[10px] px-2 py-0.5">
              Recording added
            </Tag>
          )}
        </div>
        <p className="font-body font-medium text-on-surface group-hover:text-primary transition-colors mb-2">
          {session.title}
        </p>
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5 font-body text-xs text-on-surface-variant">
            <Clock size={12} strokeWidth={1.5} aria-hidden="true" />
            {dateStr} · {timeStr} · {session.duration_minutes} min
          </span>
          <span className="flex items-center gap-1.5 font-body text-xs text-on-surface-variant">
            <Users size={12} strokeWidth={1.5} aria-hidden="true" />
            {regCount} registered
            {session.max_attendees ? ` / ${session.max_attendees}` : ""}
          </span>
        </div>
      </div>
      <ChevronRight
        size={16}
        strokeWidth={1.5}
        className="text-on-surface-variant group-hover:text-primary transition-colors shrink-0 mt-1"
        aria-hidden="true"
      />
    </Link>
  );
}
