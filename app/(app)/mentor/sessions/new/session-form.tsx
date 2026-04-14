"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  scheduleSessionSchema,
  type ScheduleSessionInput,
} from "@/lib/validation/session";
import { scheduleSession } from "@/lib/actions/sessions";
import { Button } from "@/components/ui/button";

const DURATION_OPTIONS = [
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
];

const inputClass =
  "w-full bg-surface-container-low rounded-xl px-4 py-3 font-body text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 border-0";

export function SessionForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ScheduleSessionInput>({
    resolver: zodResolver(scheduleSessionSchema),
    defaultValues: {
      duration_minutes: 60,
    },
  });

  const description = watch("description") ?? "";

  async function onSubmit(data: ScheduleSessionInput) {
    setServerError(null);
    // Convert datetime-local to UTC ISO
    const payload = {
      ...data,
      scheduled_at: new Date(data.scheduled_at).toISOString(),
    };
    const result = await scheduleSession(payload);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    router.push(`/mentor/sessions/${result.id}`);
  }

  // Min datetime — now (browser local)
  const minDatetime = new Date(Date.now() + 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Title */}
      <div className="space-y-2">
        <label htmlFor="title" className="block font-body text-sm font-semibold text-on-surface">
          Session title <span className="text-error" aria-hidden="true">*</span>
        </label>
        <input
          id="title"
          type="text"
          placeholder="e.g. Ask me anything about engineering internships"
          {...register("title")}
          className={inputClass}
        />
        {errors.title && (
          <p className="text-sm text-error font-body" role="alert">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <div className="flex items-end justify-between">
          <label htmlFor="description" className="block font-body text-sm font-semibold text-on-surface">
            Description{" "}
            <span className="font-normal text-on-surface-variant">(optional)</span>
          </label>
          <span className="text-xs text-on-surface-variant font-body" aria-live="polite">
            {description.length}/500
          </span>
        </div>
        <textarea
          id="description"
          rows={4}
          placeholder="What topics will you cover? What should students prepare?"
          {...register("description")}
          className={`${inputClass} resize-none`}
        />
        {errors.description && (
          <p className="text-sm text-error font-body" role="alert">{errors.description.message}</p>
        )}
      </div>

      {/* Date + time */}
      <div className="space-y-2">
        <label htmlFor="scheduled_at" className="block font-body text-sm font-semibold text-on-surface">
          Date &amp; time <span className="text-error" aria-hidden="true">*</span>
        </label>
        <input
          id="scheduled_at"
          type="datetime-local"
          min={minDatetime}
          {...register("scheduled_at")}
          className={inputClass}
        />
        <p className="font-body text-xs text-on-surface-variant">
          Times are shown in your local timezone.
        </p>
        {errors.scheduled_at && (
          <p className="text-sm text-error font-body" role="alert">{errors.scheduled_at.message}</p>
        )}
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <label htmlFor="duration_minutes" className="block font-body text-sm font-semibold text-on-surface">
          Duration <span className="text-error" aria-hidden="true">*</span>
        </label>
        <select
          id="duration_minutes"
          {...register("duration_minutes", { valueAsNumber: true })}
          className={inputClass}
        >
          {DURATION_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {errors.duration_minutes && (
          <p className="text-sm text-error font-body" role="alert">{errors.duration_minutes.message}</p>
        )}
      </div>

      {/* Max attendees */}
      <div className="space-y-2">
        <label htmlFor="max_attendees" className="block font-body text-sm font-semibold text-on-surface">
          Max attendees{" "}
          <span className="font-normal text-on-surface-variant">(optional — leave blank for unlimited)</span>
        </label>
        <input
          id="max_attendees"
          type="number"
          min={1}
          max={500}
          placeholder="e.g. 50"
          {...register("max_attendees", { valueAsNumber: true })}
          className={inputClass}
        />
        {errors.max_attendees && (
          <p className="text-sm text-error font-body" role="alert">{errors.max_attendees.message}</p>
        )}
      </div>

      {/* Meeting URL */}
      <div className="space-y-2">
        <label htmlFor="meeting_url" className="block font-body text-sm font-semibold text-on-surface">
          Meeting URL{" "}
          <span className="font-normal text-on-surface-variant">(optional — can be added later)</span>
        </label>
        <input
          id="meeting_url"
          type="url"
          placeholder="https://meet.google.com/… or https://zoom.us/…"
          {...register("meeting_url")}
          className={inputClass}
        />
        {errors.meeting_url && (
          <p className="text-sm text-error font-body" role="alert">{errors.meeting_url.message}</p>
        )}
      </div>

      {serverError && (
        <p className="text-sm text-error font-body bg-error/10 px-4 py-3 rounded-xl" role="alert">
          {serverError}
        </p>
      )}

      <div className="flex items-center gap-4 pt-2">
        <Button type="submit" disabled={isSubmitting} size="lg">
          {isSubmitting ? "Scheduling…" : "Schedule session"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
