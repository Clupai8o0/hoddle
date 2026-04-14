import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, Clock, Users, Video } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/container";
import { Tag } from "@/components/ui/tag";
import { RegisterButton } from "./register-button";
import { QuestionForm } from "@/app/(app)/mentors/[slug]/question-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatSessionDatetime(iso: string): string {
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
  return { title: `${data.title} — Hoddle Sessions` };
}

export default async function SessionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: session } = await supabase
    .from("live_sessions")
    .select(
      `id, title, description, scheduled_at, duration_minutes,
       max_attendees, meeting_url, recording_url, status,
       mentors!live_sessions_mentor_id_fkey (
         slug, headline,
         profiles!mentors_profile_id_fkey (full_name, avatar_url, university)
       ),
       session_registrations(count)`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!session) notFound();

  const mentor = session.mentors as {
    slug: string;
    headline: string | null;
    profiles: {
      full_name: string | null;
      avatar_url: string | null;
      university: string | null;
    } | null;
  } | null;

  const mentorName = mentor?.profiles?.full_name ?? "Mentor";
  const mentorInitials = mentorName
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  const regCount = (session.session_registrations as { count: number }[])[0]?.count ?? 0;
  const isFull =
    session.max_attendees != null && regCount >= session.max_attendees;

  let isRegistered = false;
  if (user) {
    const { data: reg } = await supabase
      .from("session_registrations")
      .select("session_id")
      .eq("session_id", id)
      .eq("profile_id", user.id)
      .maybeSingle();
    isRegistered = !!reg;
  }

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
    <Container className="py-12 lg:py-16">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 font-body text-xs text-on-surface-variant mb-8 uppercase tracking-wider"
      >
        <Link href="/sessions" className="hover:text-primary transition-colors">
          Sessions
        </Link>
        <span aria-hidden="true">›</span>
        <span className="text-on-surface/60 truncate max-w-[240px]">
          {session.title}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        {/* ── Main ── */}
        <div className="lg:col-span-7">
          {/* Status + title */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
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
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-on-surface leading-[1.1] tracking-tight mb-6">
              {session.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap gap-5 font-body text-sm text-on-surface-variant py-5 border-y border-outline-variant/20">
              <span className="flex items-center gap-2">
                <Calendar strokeWidth={1.5} size={15} aria-hidden="true" />
                {formatSessionDatetime(session.scheduled_at)}
              </span>
              <span className="flex items-center gap-2">
                <Clock strokeWidth={1.5} size={15} aria-hidden="true" />
                {session.duration_minutes} minutes
              </span>
              {session.max_attendees && (
                <span className="flex items-center gap-2">
                  <Users strokeWidth={1.5} size={15} aria-hidden="true" />
                  {regCount} / {session.max_attendees} registered
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {session.description && (
            <div className="mb-10">
              <h2 className="font-display text-xl font-bold text-on-surface mb-4">
                About this session
              </h2>
              <p className="font-body text-base text-on-surface leading-loose">
                {session.description}
              </p>
            </div>
          )}

          {/* Recording */}
          {session.status === "completed" && session.recording_url && (
            <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-ambient">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center">
                  <Video strokeWidth={1.5} size={16} className="text-secondary" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-display font-bold text-on-surface text-sm">
                    Recording available
                  </p>
                  <p className="font-body text-xs text-on-surface-variant">
                    Missed the session? Watch the recording.
                  </p>
                </div>
              </div>
              <a
                href={session.recording_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-body text-sm font-semibold text-primary hover:underline"
              >
                Watch recording ↗
              </a>
            </div>
          )}

          {/* Registration action */}
          {isUpcoming && user && (
            <div className="mt-8">
              <RegisterButton
                sessionId={id}
                isRegistered={isRegistered}
                isFull={isFull}
              />
              {isRegistered && session.meeting_url && (
                <p className="font-body text-sm text-on-surface-variant mt-3">
                  Meeting link:{" "}
                  <a
                    href={session.meeting_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    {session.meeting_url}
                  </a>
                </p>
              )}
            </div>
          )}

          {isUpcoming && !user && (
            <div className="mt-8 rounded-2xl bg-surface-container-low px-6 py-5 flex items-center justify-between gap-4">
              <p className="font-body text-sm text-on-surface-variant">
                Sign in to register for this session.
              </p>
              <Link
                href="/login"
                className="font-body text-sm font-semibold text-primary hover:underline shrink-0"
              >
                Sign in
              </Link>
            </div>
          )}

          {/* Question form for registered or upcoming students */}
          {isUpcoming && user && (
            <div className="mt-10">
              <h2 className="font-display text-xl font-bold text-on-surface mb-2">
                Submit a question
              </h2>
              <p className="font-body text-sm text-on-surface-variant mb-5">
                Questions are answered live during the session. Submit yours
                in advance so the mentor can prepare.
              </p>
              <QuestionForm sessionId={id} />
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <aside className="lg:col-span-5">
          <div className="sticky top-24 space-y-6">
            {/* Mentor card */}
            {mentor && (
              <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-ambient">
                <p className="font-body text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-4">
                  Hosted by
                </p>
                <div className="flex items-center gap-4 mb-4">
                  {mentor.profiles?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mentor.profiles.avatar_url}
                      alt={mentorName}
                      className="w-14 h-14 rounded-xl object-cover"
                    />
                  ) : (
                    <span className="w-14 h-14 rounded-xl bg-primary-container flex items-center justify-center font-display font-bold text-lg text-primary/40">
                      {mentorInitials}
                    </span>
                  )}
                  <div>
                    <p className="font-display font-bold text-on-surface">
                      {mentorName}
                    </p>
                    {mentor.headline && (
                      <p className="font-body text-sm text-secondary font-medium">
                        {mentor.headline}
                      </p>
                    )}
                    {mentor.profiles?.university && (
                      <p className="font-body text-xs text-on-surface-variant mt-0.5">
                        {mentor.profiles.university}
                      </p>
                    )}
                  </div>
                </div>
                <Link
                  href={`/mentors/${mentor.slug}`}
                  className="font-body text-sm font-semibold text-primary hover:underline"
                >
                  View full profile →
                </Link>
              </div>
            )}

            {/* Quick stats */}
            <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-ambient">
              <p className="font-body text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-4">
                Session details
              </p>
              <dl className="space-y-3">
                <div>
                  <dt className="font-body text-xs text-on-surface-variant uppercase tracking-[0.08em]">
                    Date &amp; time
                  </dt>
                  <dd className="font-body text-sm font-medium text-on-surface mt-0.5">
                    {formatSessionDatetime(session.scheduled_at)}
                  </dd>
                </div>
                <div>
                  <dt className="font-body text-xs text-on-surface-variant uppercase tracking-[0.08em]">
                    Duration
                  </dt>
                  <dd className="font-body text-sm font-medium text-on-surface mt-0.5">
                    {session.duration_minutes} minutes
                  </dd>
                </div>
                {session.max_attendees && (
                  <div>
                    <dt className="font-body text-xs text-on-surface-variant uppercase tracking-[0.08em]">
                      Capacity
                    </dt>
                    <dd className="font-body text-sm font-medium text-on-surface mt-0.5">
                      {regCount} of {session.max_attendees} registered
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="font-body text-xs text-on-surface-variant uppercase tracking-[0.08em]">
                    Format
                  </dt>
                  <dd className="font-body text-sm font-medium text-on-surface mt-0.5">
                    Live online Q&amp;A
                  </dd>
                </div>
              </dl>
            </div>

            <Link
              href="/sessions"
              className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors text-center block"
            >
              ← All sessions
            </Link>
          </div>
        </aside>
      </div>
    </Container>
  );
}
