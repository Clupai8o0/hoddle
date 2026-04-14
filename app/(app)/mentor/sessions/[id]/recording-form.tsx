"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setRecordingUrl } from "@/lib/actions/sessions";
import { Button } from "@/components/ui/button";

interface RecordingFormProps {
  sessionId: string;
  currentUrl: string | null;
}

export function RecordingForm({ sessionId, currentUrl }: RecordingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [url, setUrl] = useState(currentUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    if (!url.trim()) return;
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await setRecordingUrl({
        session_id: sessionId,
        recording_url: url.trim(),
      });
      if (!result.ok) {
        setError(result.error);
      } else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <input
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setSaved(false);
          }}
          placeholder="https://…"
          className="flex-1 bg-surface-container-low rounded-xl px-4 py-3 font-body text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 border-0"
          aria-label="Recording URL"
        />
        <Button
          onClick={handleSave}
          disabled={isPending || !url.trim()}
          size="default"
        >
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>
      {error && (
        <p className="text-xs text-error font-body" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <p className="text-xs text-secondary font-body font-semibold">
          Recording URL saved.
        </p>
      )}
    </div>
  );
}
