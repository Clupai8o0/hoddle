import Link from "next/link";
import { Calendar, Clock, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/container";
import { Tag } from "@/components/ui/tag";

export const metadata = { title: "Live Sessions — Hoddle" };

type SessionRow = {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  max_attendees: number | null;
  status: string;
  recording_url?: string | null;
  mentors: {
    slug: string;
    profiles: { full_name: string | null; avatar_url: string | null } | null;
  } | null;
  session_registrations: { count: number }[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function SessionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const now = new Date().toISOString();

  const [{ data: upcoming }, { data: past }, { data: myRegistrations }] =
    await Promise.all([
      supabase
        .from("live_sessions")
        .select(
          `id, title, description, scheduled_at, duration_minutes, max_attendees, status,
           mentors!live_sessions_mentor_id_fkey (
             slug,
             profiles!mentors_profile_id_fkey (full_name, avatar_url)
           ),
           session_registrations(count)`,
        )
        .eq("status", "scheduled")
        .gte("scheduled_at", now)
        .order("scheduled_at")
        .limit(20),
      supabase
        .from("live_sessions")
        .select(
          `id, title, scheduled_at, duration_minutes, status, recording_url,
           mentors!live_sessions_mentor_id_fkey (
             slug,
             profiles!mentors_profile_id_fkey (full_name, avatar_url)
           ),
           session_registrations(count)`,
        )
        .in("status", ["completed", "cancelled"])
        .lt("scheduled_at", now)
        .order("scheduled_at", { ascending: false })
        .limit(12),
      user
        ? supabase
            .from("session_registrations")
            .select("session_id")
            .eq("profile_id", user.id)
        : { data: [] },
    ]);

  const registeredIds = new Set(
    (myRegistrations ?? []).map((r) => r.session_id),
  );

  const typedUpcoming = (upcoming ?? []) as unknown as SessionRow[];
  const typedPast = (past ?? []) as unknown as SessionRow[];

  return (
    <Container className="py-10 sm:py-16">
      <header className="mb-8 sm:mb-12">
        <p className="font-body text-xs font-bold uppercase tracking-[0.14em] text-secondary mb-3">
          Live Q&amp;As
        </p>
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-on-surface mb-4 leading-[1.05]">
          Sessions
        </h1>
        <p className="font-body text-base sm:text-xl text-on-surface-variant max-w-lg leading-relaxed">
          Live Q&amp;A sessions with verified mentors. Register to attend and
          submit your questions in advance.
        </p>
      </header>

      {/* Upcoming */}
      <section className="mb-16">
        <h2 className="text-xs font-body uppercase tracking-widest text-on-surface-variant mb-8 flex items-center gap-2">
          <span className="w-6 h-px bg-outline-variant" />
          Upcoming sessions
        </h2>

        {typedUpcoming.length === 0 ? (
          <div className="rounded-2xl bg-surface-container-low px-8 py-14 text-center">
            <p className="font-body text-on-surface-variant">
              No upcoming sessions right now. Check back soon, or browse mentor
              profiles to see when they&apos;re next online.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {typedUpcoming.map((session) => {
              const mentorProfile = (
                session.mentors?.profiles as
                  | { full_name: string | null; avatar_url: string | null }
                  | null
              );
              const regCount = session.session_registrations[0]?.count ?? 0;
              const isFull =
                session.max_attendees != null && regCount >= session.max_attendees;
              const isRegistered = registeredIds.has(session.id);

              return (
                <Link
                  key={session.id}
                  href={`/sessions/${session.id}`}
                  className="group block rounded-2xl bg-surface-container-lowest p-5 sm:p-7 shadow-ambient hover:shadow-ambient-lg transition-all hover:-translate-y-0.5"
                >
                  <div className="flex items-start gap-4 mb-5">
                    {/* Date block */}
                    <div className="shrink-0 w-12 text-center">
                      <div className="font-display font-black text-2xl text-primary leading-none">
                        {new Date(session.scheduled_at).getDate()}
                      </div>
                      <div className="font-body text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mt-0.5">
                        {new Date(session.scheduled_at).toLocaleDateString(
                          "en-AU",
                          { month: "short" },
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {isRegistered && (
                          <Tag variant="success" className="text-[10px]">
                            Registered
                          </Tag>
                        )}
                        {isFull && !isRegistered && (
                          <Tag variant="muted" className="text-[10px]">
                            Full
                          </Tag>
                        )}
                      </div>
                      <h3 className="font-display font-bold text-lg text-on-surface group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                        {session.title}
                      </h3>
                    </div>
                  </div>

                  {session.description && (
                    <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-5 line-clamp-2">
                      {session.description}
                    </p>
                  )}

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-4 text-xs font-body text-on-surface-variant mb-5">
                    <span className="flex items-center gap-1.5">
                      <Clock strokeWidth={1.5} size={13} aria-hidden="true" />
                      {formatTime(session.scheduled_at)} ·{" "}
                      {session.duration_minutes} min
                    </span>
                    {session.max_attendees && (
                      <span className="flex items-center gap-1.5">
                        <Users strokeWidth={1.5} size={13} aria-hidden="true" />
                        {regCount}/{session.max_attendees}
                      </span>
                    )}
                  </div>

                  {/* Mentor row */}
                  {mentorProfile && (
                    <div className="flex items-center gap-2.5 pt-4 border-t border-outline-variant/20">
                      {mentorProfile.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={mentorProfile.avatar_url}
                          alt={mentorProfile.full_name ?? ""}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-primary-container flex items-center justify-center text-[10px] font-bold text-primary/70">
                          {(mentorProfile.full_name ?? "?")[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className="font-body text-sm font-medium text-on-surface">
                        {mentorProfile.full_name ?? "Mentor"}
                      </span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Past sessions */}
      {typedPast.length > 0 && (
        <section>
          <h2 className="text-xs font-body uppercase tracking-widest text-on-surface-variant mb-8 flex items-center gap-2">
            <span className="w-6 h-px bg-outline-variant" />
            Past sessions
          </h2>
          <div className="space-y-3">
            {typedPast.map((session) => {
              const mentorProfile = (
                session.mentors?.profiles as
                  | { full_name: string | null }
                  | null
              );
              return (
                <Link
                  key={session.id}
                  href={`/sessions/${session.id}`}
                  className="group flex items-center justify-between gap-6 rounded-xl bg-surface-container-low px-6 py-4 hover:bg-surface-container transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-sm text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                      {session.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="font-body text-xs text-on-surface-variant flex items-center gap-1">
                        <Calendar size={11} strokeWidth={1.5} aria-hidden="true" />
                        {formatDate(session.scheduled_at)}
                      </span>
                      {mentorProfile?.full_name && (
                        <span className="font-body text-xs text-on-surface-variant">
                          · {mentorProfile.full_name}
                        </span>
                      )}
                    </div>
                  </div>
                  {session.recording_url && (
                    <Tag variant="success" className="text-[10px] shrink-0">
                      Recording available
                    </Tag>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </Container>
  );
}
