import Link from "next/link";
import { Plus, ArrowRight, Eye, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";

export const metadata = { title: "Mentor Dashboard — Hoddle" };
export const dynamic = "force-dynamic";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning,";
  if (hour < 17) return "Good afternoon,";
  return "Good evening,";
}

export default async function MentorDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profileResult, contentResult, sessionsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user!.id)
      .single(),
    supabase
      .from("content_items")
      .select("id, title, type, slug, view_count, published_at, created_at")
      .eq("mentor_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("live_sessions")
      .select("id, title, scheduled_at, duration_minutes, max_attendees, status")
      .eq("mentor_id", user!.id)
      .gte("scheduled_at", new Date().toISOString())
      .eq("status", "scheduled")
      .order("scheduled_at", { ascending: true })
      .limit(3),
  ]);

  const profile = profileResult.data;
  const contentItems = contentResult.data ?? [];
  const upcomingSessions = sessionsResult.data ?? [];

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  // Aggregate stats
  const totalViews = contentItems.reduce((sum, item) => sum + (item.view_count ?? 0), 0);
  const publishedCount = contentItems.filter((item) => item.published_at).length;

  const stats = [
    { label: "Content views", value: totalViews.toLocaleString() },
    { label: "Published pieces", value: publishedCount },
    { label: "Upcoming sessions", value: upcomingSessions.length },
  ];

  return (
    <div className="space-y-10">
      {/* Welcome */}
      <section
        className="rounded-2xl p-8 lg:p-10"
        style={{
          background:
            "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary) 100%)",
        }}
      >
        <p className="font-body text-on-primary/60 text-sm mb-1">{getGreeting()}</p>
        <h1 className="font-display font-bold text-3xl lg:text-4xl text-on-primary mb-1">
          {firstName}.
        </h1>
        <p className="font-body text-on-primary/70 leading-relaxed max-w-md">
          Your mentorship hub — content, sessions, and student questions, all in one place.
        </p>
      </section>

      {/* Stats */}
      <section>
        <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant mb-4">
          Your impact
        </p>
        <div className="grid grid-cols-3 gap-4">
          {stats.map(({ label, value }) => (
            <div
              key={label}
              className="bg-surface-container rounded-xl p-5"
            >
              <p className="font-display font-bold text-3xl text-primary mb-1">
                {value}
              </p>
              <p className="font-body text-sm text-on-surface-variant">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Content */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant mb-1">
              Your library
            </p>
            <h2 className="font-display font-semibold text-xl text-on-surface">
              My Shared Wisdom
            </h2>
          </div>
          <Button variant="primary" size="sm" asChild>
            <Link href="/mentor/content">
              <Plus size={14} strokeWidth={1.5} aria-hidden="true" />
              Create
            </Link>
          </Button>
        </div>

        {contentItems.length === 0 ? (
          <div className="bg-surface-container-low rounded-xl p-8 text-center">
            <p className="font-body text-on-surface-variant mb-4">
              You haven&apos;t published anything yet. Share your first piece of wisdom.
            </p>
            <Button variant="secondary" size="default" asChild>
              <Link href="/mentor/content">
                <Plus size={14} strokeWidth={1.5} aria-hidden="true" />
                New article
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {contentItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-surface-container rounded-xl px-5 py-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Tag variant={item.published_at ? "success" : "muted"} className="text-[10px] px-2 py-0.5">
                        {item.published_at ? "Published" : "Draft"}
                      </Tag>
                      <span className="font-body text-[10px] uppercase tracking-[0.1em] text-on-surface-variant">
                        {item.type}
                      </span>
                    </div>
                    <p className="font-body font-medium text-sm text-on-surface truncate">
                      {item.title}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                  <span className="flex items-center gap-1 font-body text-xs text-on-surface-variant">
                    <Eye size={12} strokeWidth={1.5} aria-hidden="true" />
                    {(item.view_count ?? 0).toLocaleString()}
                  </span>
                  <Link
                    href={`/mentor/content`}
                    className="font-body text-xs text-primary hover:underline underline-offset-2"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
            {contentItems.length === 5 && (
              <Link
                href="/mentor/content"
                className="flex items-center justify-center gap-2 font-body text-sm text-primary hover:underline underline-offset-2 py-2"
              >
                View all content
                <ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" />
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Upcoming sessions */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant mb-1">
              What&apos;s ahead
            </p>
            <h2 className="font-display font-semibold text-xl text-on-surface">
              Upcoming sessions
            </h2>
          </div>
          <Button variant="secondary" size="sm" asChild>
            <Link href="/mentor/sessions">
              <Plus size={14} strokeWidth={1.5} aria-hidden="true" />
              Schedule
            </Link>
          </Button>
        </div>

        {upcomingSessions.length === 0 ? (
          <div className="bg-surface-container-low rounded-xl p-8 text-center">
            <p className="font-body text-on-surface-variant mb-4">
              No upcoming sessions. Schedule a live Q&amp;A to connect with students.
            </p>
            <Button variant="secondary" size="default" asChild>
              <Link href="/mentor/sessions">Schedule a session</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingSessions.map((session) => {
              const date = new Date(session.scheduled_at);
              const formattedDate = date.toLocaleDateString("en-AU", {
                weekday: "short",
                day: "numeric",
                month: "short",
              });
              const formattedTime = date.toLocaleTimeString("en-AU", {
                hour: "numeric",
                minute: "2-digit",
              });
              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between bg-surface-container rounded-xl px-5 py-4"
                >
                  <div>
                    <p className="font-body font-medium text-sm text-on-surface mb-1">
                      {session.title}
                    </p>
                    <p className="font-body text-xs text-on-surface-variant">
                      {formattedDate} · {formattedTime} · {session.duration_minutes} min
                    </p>
                  </div>
                  <Link
                    href="/mentor/sessions"
                    className="flex items-center gap-1 font-body text-xs text-primary hover:underline underline-offset-2"
                  >
                    View
                    <ArrowRight size={12} strokeWidth={1.5} aria-hidden="true" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Inbox preview */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant mb-1">
              Student questions
            </p>
            <h2 className="font-display font-semibold text-xl text-on-surface">
              Inbox
            </h2>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/mentor/inbox">
              View all
              <ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <InboxPreview mentorId={user!.id} />
      </section>
    </div>
  );
}

async function InboxPreview({ mentorId }: { mentorId: string }) {
  const supabase = await createClient();

  // Fetch unanswered questions for this mentor's sessions
  const { data: questions } = await supabase
    .from("session_questions")
    .select(
      `id, body, anonymous, answered,
       live_sessions!inner(mentor_id, title)`,
    )
    .eq("live_sessions.mentor_id", mentorId)
    .eq("answered", false)
    .order("id", { ascending: false })
    .limit(3);

  if (!questions || questions.length === 0) {
    return (
      <div className="bg-surface-container-low rounded-xl p-6 flex items-center gap-3">
        <MessageCircle size={16} strokeWidth={1.5} className="text-on-surface-variant" aria-hidden="true" />
        <p className="font-body text-sm text-on-surface-variant">
          No unanswered questions right now.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {questions.map((q) => {
        const session = Array.isArray(q.live_sessions) ? q.live_sessions[0] : q.live_sessions;
        return (
          <div
            key={q.id}
            className="bg-surface-container rounded-xl px-5 py-4"
          >
            <p className="font-body text-sm text-on-surface leading-relaxed line-clamp-2 mb-2">
              &ldquo;{q.body}&rdquo;
            </p>
            <div className="flex items-center justify-between">
              <p className="font-body text-xs text-on-surface-variant">
                {q.anonymous ? "Anonymous" : "Student"} · {session?.title ?? "Session"}
              </p>
              <Link
                href="/mentor/inbox"
                className="font-body text-xs text-primary hover:underline underline-offset-2"
              >
                Answer →
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
