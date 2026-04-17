import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Clock, Users, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AttendanceForm } from "./attendance-form";
import { RecordingForm } from "./recording-form";
import { Tag } from "@/components/ui/tag";

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatDatetime(iso: string): string {
  return new Date(iso).toLocaleString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("live_sessions")
    .select("title")
    .eq("id", id)
    .maybeSingle();
  if (!data) return { title: "Session — Hoddle" };
  return { title: `${data.title} — Sessions — Hoddle` };
}

export default async function MentorSessionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: session } = await supabase
    .from("live_sessions")
    .select(
      `id, title, description, scheduled_at, duration_minutes,
       max_attendees, meeting_url, recording_url, status, mentor_id`,
    )
    .eq("id", id)
    .eq("mentor_id", user.id)
    .maybeSingle();

  if (!session) notFound();

  const [{ data: questions }, { data: registrations }] = await Promise.all([
    supabase
      .from("session_questions")
      .select(`id, body, anonymous, answered, created_at, profile_id,
               profiles!session_questions_profile_id_fkey(full_name)`)
      .eq("session_id", id)
      .order("answered")
      .order("created_at"),
    supabase
      .from("session_registrations")
      .select(`profile_id, attended,
               profiles!session_registrations_profile_id_fkey(full_name, avatar_url)`)
      .eq("session_id", id),
  ]);

  type QuestionRow = {
    id: string;
    body: string;
    anonymous: boolean;
    answered: boolean;
    created_at: string;
    profile_id: string;
    profiles: { full_name: string | null } | null;
  };

  type RegistrationRow = {
    profile_id: string;
    attended: boolean;
    profiles: { full_name: string | null; avatar_url: string | null } | null;
  };

  const typedQuestions = (questions ?? []) as unknown as QuestionRow[];
  const typedRegs = (registrations ?? []) as unknown as RegistrationRow[];

  const unanswered = typedQuestions.filter((q) => !q.answered);
  const answered = typedQuestions.filter((q) => q.answered);

  const registrants = typedRegs.map((r) => ({
    profile_id: r.profile_id,
    full_name: (r.profiles as { full_name: string | null } | null)?.full_name ?? null,
    avatar_url: (r.profiles as { avatar_url: string | null } | null)?.avatar_url ?? null,
  }));

  const initialAttended = typedRegs
    .filter((r) => r.attended)
    .map((r) => r.profile_id);

  const isUpcoming =
    session.status === "scheduled" &&
    new Date(session.scheduled_at) > new Date();

  const statusLabel: Record<string, string> = {
    scheduled: "Upcoming",
    live: "Live now",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Header */}
      <div>
        <Link
          href="/mentor/sessions"
          className="font-body text-xs text-on-surface-variant hover:text-primary transition-colors uppercase tracking-wider mb-4 inline-block"
        >
          ← Sessions
        </Link>
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Tag
                variant={
                  session.status === "completed"
                    ? "success"
                    : session.status === "cancelled"
                      ? "muted"
                      : "default"
                }
                className="text-[10px]"
              >
                {statusLabel[session.status] ?? session.status}
              </Tag>
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary leading-tight">
              {session.title}
            </h1>
            <div className="flex flex-wrap gap-4 mt-3 font-body text-sm text-on-surface-variant">
              <span className="flex items-center gap-1.5">
                <Clock size={14} strokeWidth={1.5} aria-hidden="true" />
                {formatDatetime(session.scheduled_at)}
              </span>
              <span className="flex items-center gap-1.5">
                <Users size={14} strokeWidth={1.5} aria-hidden="true" />
                {typedRegs.length} registered
                {session.max_attendees ? ` / ${session.max_attendees} max` : ""}
              </span>
            </div>
          </div>
          {isUpcoming && session.meeting_url && (
            <a
              href={session.meeting_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-sm font-semibold text-primary hover:underline"
            >
              Open meeting link ↗
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
        {/* ── Questions ── */}
        <div className="lg:col-span-7 space-y-8">
          <section>
            <h2 className="font-display font-semibold text-xl text-on-surface mb-5">
              Questions ({typedQuestions.length})
            </h2>

            {typedQuestions.length === 0 ? (
              <p className="font-body text-sm text-on-surface-variant">
                No questions submitted yet.
              </p>
            ) : (
              <div className="space-y-4">
                {unanswered.length > 0 && (
                  <div>
                    <p className="font-body text-xs uppercase tracking-widest text-on-surface-variant mb-3">
                      Unanswered ({unanswered.length})
                    </p>
                    {unanswered.map((q) => (
                      <QuestionCard key={q.id} question={q} />
                    ))}
                  </div>
                )}
                {answered.length > 0 && (
                  <div>
                    <p className="font-body text-xs uppercase tracking-widest text-on-surface-variant mb-3">
                      Answered ({answered.length})
                    </p>
                    {answered.map((q) => (
                      <QuestionCard key={q.id} question={q} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* ── Sidebar ── */}
        <div className="lg:col-span-5 space-y-8">
          {/* Recording URL */}
          {(session.status === "completed" ||
            new Date(session.scheduled_at) < new Date()) && (
            <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient">
              <h2 className="font-display font-semibold text-base text-on-surface mb-4">
                Recording
              </h2>
              <RecordingForm
                sessionId={id}
                currentUrl={session.recording_url ?? null}
              />
            </section>
          )}

          {/* Attendance */}
          <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient">
            <h2 className="font-display font-semibold text-base text-on-surface mb-1">
              Attendance
            </h2>
            <p className="font-body text-xs text-on-surface-variant mb-5">
              {typedRegs.length} student
              {typedRegs.length !== 1 ? "s" : ""} registered
            </p>
            <AttendanceForm
              sessionId={id}
              registrants={registrants}
              alreadyCompleted={session.status === "completed"}
              initialAttended={initialAttended}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

function QuestionCard({
  question,
}: {
  question: {
    id: string;
    body: string;
    anonymous: boolean;
    answered: boolean;
    profiles: { full_name: string | null } | null;
  };
}) {
  const authorName = question.anonymous
    ? "Anonymous"
    : ((question.profiles as { full_name: string | null } | null)?.full_name ?? "Student");

  return (
    <div
      className={[
        "rounded-xl px-5 py-4 mb-3",
        question.answered
          ? "bg-secondary-container/40"
          : "bg-surface-container-low",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="font-body text-sm text-on-surface leading-relaxed">
            {question.body}
          </p>
          <p className="font-body text-xs text-on-surface-variant mt-2">
            {authorName}
          </p>
        </div>
        {question.answered && (
          <CheckCircle2
            size={16}
            strokeWidth={1.5}
            className="text-secondary shrink-0 mt-0.5"
            aria-label="Answered"
          />
        )}
      </div>
    </div>
  );
}
