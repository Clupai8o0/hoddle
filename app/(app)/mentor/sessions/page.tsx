import { Plus, Users, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";

export const metadata = { title: "Sessions — Hoddle" };
export const dynamic = "force-dynamic";

export default async function MentorSessionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const now = new Date().toISOString();

  const [upcomingResult, pastResult] = await Promise.all([
    supabase
      .from("live_sessions")
      .select("id, title, description, scheduled_at, duration_minutes, max_attendees, status")
      .eq("mentor_id", user!.id)
      .gte("scheduled_at", now)
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("live_sessions")
      .select("id, title, scheduled_at, duration_minutes, status")
      .eq("mentor_id", user!.id)
      .lt("scheduled_at", now)
      .order("scheduled_at", { ascending: false })
      .limit(10),
  ]);

  const upcoming = upcomingResult.data ?? [];
  const past = pastResult.data ?? [];

  return (
    <div className="space-y-10">
      <header className="flex items-start justify-between">
        <div>
          <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant mb-1">
            Live Q&amp;As
          </p>
          <h1 className="font-display font-bold text-3xl text-primary">Sessions</h1>
        </div>
        <Button variant="primary" size="default" disabled title="Session scheduling coming soon">
          <Plus size={15} strokeWidth={1.5} aria-hidden="true" />
          Schedule session
        </Button>
      </header>

      <p className="font-body text-sm text-on-surface-variant bg-surface-container rounded-lg px-4 py-3">
        Session scheduling (date picker, capacity, meeting URL) is coming in the next sprint.
      </p>

      {/* Upcoming */}
      <section>
        <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant mb-4">
          Upcoming ({upcoming.length})
        </p>
        {upcoming.length === 0 ? (
          <div className="bg-surface-container-low rounded-xl p-8 text-center">
            <p className="font-body text-on-surface-variant">
              No upcoming sessions. Schedule a live Q&amp;A to connect with students.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((session) => (
              <SessionCard key={session.id} session={session} variant="upcoming" />
            ))}
          </div>
        )}
      </section>

      {/* Past */}
      {past.length > 0 && (
        <section>
          <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant mb-4">
            Past sessions ({past.length})
          </p>
          <div className="space-y-3">
            {past.map((session) => (
              <SessionCard key={session.id} session={session} variant="past" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

type Session = {
  id: string;
  title: string;
  description?: string | null;
  scheduled_at: string;
  duration_minutes: number;
  max_attendees?: number | null;
  status: string;
};

function SessionCard({
  session,
  variant,
}: {
  session: Session;
  variant: "upcoming" | "past";
}) {
  const date = new Date(session.scheduled_at);
  const formattedDate = date.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const formattedTime = date.toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="bg-surface-container rounded-xl px-5 py-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Tag
              variant={session.status === "completed" ? "success" : variant === "upcoming" ? "default" : "muted"}
              className="text-[10px] px-2 py-0.5"
            >
              {session.status === "completed" ? "Completed" : variant === "upcoming" ? "Upcoming" : "Past"}
            </Tag>
          </div>
          <p className="font-body font-medium text-on-surface mb-2">{session.title}</p>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 font-body text-xs text-on-surface-variant">
              <Clock size={12} strokeWidth={1.5} aria-hidden="true" />
              {formattedDate} · {formattedTime} · {session.duration_minutes} min
            </span>
            {session.max_attendees && (
              <span className="flex items-center gap-1.5 font-body text-xs text-on-surface-variant">
                <Users size={12} strokeWidth={1.5} aria-hidden="true" />
                Up to {session.max_attendees} students
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
