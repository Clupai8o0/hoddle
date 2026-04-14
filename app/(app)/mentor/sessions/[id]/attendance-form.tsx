"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeSession } from "@/lib/actions/sessions";
import { Button } from "@/components/ui/button";

interface Registrant {
  profile_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface AttendanceFormProps {
  sessionId: string;
  registrants: Registrant[];
  alreadyCompleted: boolean;
  initialAttended: string[]; // profile_ids already marked attended
}

export function AttendanceForm({
  sessionId,
  registrants,
  alreadyCompleted,
  initialAttended,
}: AttendanceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [attended, setAttended] = useState<Set<string>>(
    new Set(initialAttended),
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function toggle(profileId: string) {
    setAttended((prev) => {
      const next = new Set(prev);
      if (next.has(profileId)) next.delete(profileId);
      else next.add(profileId);
      return next;
    });
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await completeSession({
        session_id: sessionId,
        attended_profile_ids: Array.from(attended),
      });
      if (!result.ok) {
        setError(result.error);
      } else {
        setSuccess(true);
        router.refresh();
      }
    });
  }

  if (success) {
    return (
      <div className="rounded-xl bg-secondary/10 px-5 py-5 text-center">
        <p className="font-display font-semibold text-secondary mb-1">
          Attendance saved
        </p>
        <p className="font-body text-sm text-on-surface-variant">
          Session marked as completed.
        </p>
      </div>
    );
  }

  if (registrants.length === 0) {
    return (
      <p className="font-body text-sm text-on-surface-variant">
        No students registered for this session.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="font-body text-sm text-on-surface-variant">
        Tick the students who attended, then mark the session as completed.
      </p>

      <div className="space-y-2">
        {registrants.map((r) => {
          const initials = (r.full_name ?? "?")
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
          const checked = attended.has(r.profile_id);

          return (
            <label
              key={r.profile_id}
              className={[
                "flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-colors",
                checked
                  ? "bg-secondary-container"
                  : "bg-surface-container-low hover:bg-surface-container",
              ].join(" ")}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(r.profile_id)}
                disabled={alreadyCompleted}
                className="w-4 h-4 rounded accent-secondary"
                aria-label={`Mark ${r.full_name ?? "student"} as attended`}
              />
              {r.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.avatar_url}
                  alt={r.full_name ?? ""}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-[10px] font-bold text-primary/70 shrink-0">
                  {initials}
                </div>
              )}
              <span className="font-body text-sm font-medium text-on-surface">
                {r.full_name ?? "Unknown student"}
              </span>
              {checked && (
                <span className="ml-auto font-body text-xs font-semibold text-secondary">
                  Attended
                </span>
              )}
            </label>
          );
        })}
      </div>

      {error && (
        <p className="text-sm text-error font-body" role="alert">
          {error}
        </p>
      )}

      {!alreadyCompleted && (
        <Button
          onClick={handleSubmit}
          disabled={isPending}
          size="default"
        >
          {isPending ? "Saving…" : `Mark session complete (${attended.size} attended)`}
        </Button>
      )}
    </div>
  );
}
