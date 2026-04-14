"use client";

import { useState, useTransition } from "react";
import { updateNotificationPreferences } from "@/lib/actions/notifications";
import { Button } from "@/components/ui/button";
import type { Database } from "@/lib/supabase/database.types";

type NotificationType = Database["public"]["Enums"]["notification_type"];

const NOTIFICATION_TYPES: { type: NotificationType; label: string; description: string }[] = [
  {
    type: "forum_reply_to_your_thread",
    label: "Forum replies",
    description: "When someone replies to a thread you started",
  },
  {
    type: "success_story_approved",
    label: "Story approved",
    description: "When your submitted success story is approved and published",
  },
  {
    type: "mentor_replied_to_your_question",
    label: "Question answered",
    description: "When a mentor answers a question you submitted for a session",
  },
  {
    type: "new_content_from_mentor_you_follow",
    label: "New content from followed mentors",
    description: "When a mentor you follow publishes new content",
  },
  {
    type: "session_reminder_24h",
    label: "24h session reminders",
    description: "Reminder email the day before a session you're registered for",
  },
  {
    type: "session_starting_soon",
    label: "Session starting soon",
    description: "Alert 15 minutes before a session you're registered for",
  },
];

interface PreferencesFormProps {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  typesMuted: string[];
}

export function PreferencesForm({
  emailEnabled: initialEmail,
  inAppEnabled: initialInApp,
  typesMuted: initialMuted,
}: PreferencesFormProps) {
  const [emailEnabled, setEmailEnabled] = useState(initialEmail);
  const [inAppEnabled, setInAppEnabled] = useState(initialInApp);
  const [typesMuted, setTypesMuted] = useState<Set<string>>(new Set(initialMuted));
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function toggleMuted(type: string) {
    setTypesMuted((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  function handleSave() {
    setSaved(false);
    setServerError(null);
    startTransition(async () => {
      const result = await updateNotificationPreferences({
        email_enabled: emailEnabled,
        in_app_enabled: inAppEnabled,
        types_muted: [...typesMuted],
      });
      if (result.ok) {
        setSaved(true);
      } else {
        setServerError(result.error);
      }
    });
  }

  return (
    <div className="space-y-10">
      {/* Channels */}
      <section className="space-y-4">
        <h2 className="font-display text-lg font-bold text-on-surface">Channels</h2>
        <div className="space-y-3">
          <ToggleRow
            label="In-app notifications"
            description="Show a badge on the bell icon and notifications in your inbox"
            checked={inAppEnabled}
            onChange={setInAppEnabled}
          />
          <ToggleRow
            label="Email notifications"
            description="Receive email for important activity — unsubscribe anytime"
            checked={emailEnabled}
            onChange={setEmailEnabled}
          />
        </div>
      </section>

      {/* Per-type */}
      <section className="space-y-4">
        <h2 className="font-display text-lg font-bold text-on-surface">Notification types</h2>
        <p className="font-body text-sm text-on-surface-variant">
          Mute individual notification types. These apply to both in-app and email.
        </p>
        <div className="space-y-3">
          {NOTIFICATION_TYPES.map(({ type, label, description }) => (
            <ToggleRow
              key={type}
              label={label}
              description={description}
              checked={!typesMuted.has(type)}
              onChange={(checked) => {
                if (!checked) toggleMuted(type);
                else {
                  setTypesMuted((prev) => {
                    const next = new Set(prev);
                    next.delete(type);
                    return next;
                  });
                }
              }}
            />
          ))}
        </div>
      </section>

      {serverError && (
        <p className="text-sm text-error font-body bg-error/10 px-4 py-3 rounded-xl" role="alert">
          {serverError}
        </p>
      )}
      {saved && (
        <p className="text-sm text-success font-body" role="status">
          Preferences saved.
        </p>
      )}

      <Button onClick={handleSave} disabled={isPending} size="lg">
        {isPending ? "Saving…" : "Save preferences"}
      </Button>
    </div>
  );
}

// ── Toggle row ────────────────────────────────────────────────────────────────

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 bg-surface-container-low rounded-2xl px-5 py-4">
      <div>
        <p className="font-body text-sm font-semibold text-on-surface">{label}</p>
        <p className="font-body text-xs text-on-surface-variant mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
          checked ? "bg-primary" : "bg-surface-container-high"
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-surface shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
        <span className="sr-only">{checked ? "On" : "Off"}</span>
      </button>
    </div>
  );
}
