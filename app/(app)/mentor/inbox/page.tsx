import { MessageCircle, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Tag } from "@/components/ui/tag";

export const metadata = { title: "Inbox — Hoddle" };
export const dynamic = "force-dynamic";

export default async function MentorInboxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: questions } = await supabase
    .from("session_questions")
    .select(
      `id, body, anonymous, answered, session_id,
       live_sessions!inner(id, title, mentor_id, scheduled_at)`,
    )
    .eq("live_sessions.mentor_id", user!.id)
    .order("id", { ascending: false });

  const allQuestions = questions ?? [];
  const unanswered = allQuestions.filter((q) => !q.answered);
  const answered = allQuestions.filter((q) => q.answered);

  return (
    <div className="space-y-10">
      <header>
        <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant mb-1">
          Student questions
        </p>
        <h1 className="font-display font-bold text-3xl text-primary">Inbox</h1>
        {unanswered.length > 0 && (
          <p className="font-body text-on-surface-variant mt-2">
            {unanswered.length} question{unanswered.length !== 1 ? "s" : ""} awaiting your response.
          </p>
        )}
      </header>

      {/* Unanswered */}
      <section>
        <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant mb-4">
          Unanswered ({unanswered.length})
        </p>
        {unanswered.length === 0 ? (
          <div className="bg-surface-container-low rounded-xl p-8 flex items-center gap-3">
            <CheckCircle size={16} strokeWidth={1.5} className="text-secondary" aria-hidden="true" />
            <p className="font-body text-on-surface-variant">All caught up.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {unanswered.map((q) => (
              <QuestionCard key={q.id} question={q} />
            ))}
          </div>
        )}
      </section>

      {/* Answered */}
      {answered.length > 0 && (
        <section>
          <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant mb-4">
            Answered ({answered.length})
          </p>
          <div className="space-y-3">
            {answered.map((q) => (
              <QuestionCard key={q.id} question={q} />
            ))}
          </div>
        </section>
      )}

      {allQuestions.length === 0 && (
        <div className="bg-surface-container-low rounded-xl p-10 text-center">
          <MessageCircle size={24} strokeWidth={1.5} className="text-on-surface-variant mx-auto mb-3" aria-hidden="true" />
          <p className="font-body text-on-surface-variant">
            No questions yet. They&apos;ll appear here once students submit them to your sessions.
          </p>
        </div>
      )}
    </div>
  );
}

type Question = {
  id: string;
  body: string;
  anonymous: boolean;
  answered: boolean;
  session_id: string;
  live_sessions:
    | { id: string; title: string; scheduled_at: string }
    | { id: string; title: string; scheduled_at: string }[]
    | null;
};

function QuestionCard({ question }: { question: Question }) {
  const session = Array.isArray(question.live_sessions)
    ? question.live_sessions[0]
    : question.live_sessions;

  return (
    <div className="bg-surface-container rounded-xl px-5 py-5">
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Tag
              variant={question.answered ? "success" : "muted"}
              className="text-[10px] px-2 py-0.5"
            >
              {question.answered ? "Answered" : "Unanswered"}
            </Tag>
            {question.anonymous && (
              <span className="font-body text-[10px] text-on-surface-variant">
                Anonymous
              </span>
            )}
          </div>
          <p className="font-body text-sm text-on-surface leading-relaxed mb-2">
            &ldquo;{question.body}&rdquo;
          </p>
          {session && (
            <p className="font-body text-xs text-on-surface-variant">
              For: {session.title}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
