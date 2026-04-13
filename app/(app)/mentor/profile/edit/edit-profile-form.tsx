"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { updateMentorProfile } from "@/lib/actions/mentor-onboarding";
import { FIELDS_OF_INTEREST } from "@/lib/validation/onboarding";
import type { MentorOnboardingData } from "@/lib/validation/mentor-onboarding";

interface EditProfileFormProps {
  defaultValues: MentorOnboardingData;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="font-body text-sm text-error mt-1" role="alert">
      {message}
    </p>
  );
}

export function EditProfileForm({ defaultValues }: EditProfileFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [headline, setHeadline] = useState(defaultValues.headline);
  const [currentPosition, setCurrentPosition] = useState(defaultValues.current_position);
  const [bio, setBio] = useState(defaultValues.bio);
  const [expertise, setExpertise] = useState<string[]>(defaultValues.expertise);
  const [hometown, setHometown] = useState(defaultValues.hometown);

  function clearError(field: string) {
    setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  }

  function toggleExpertise(value: string) {
    clearError("expertise");
    setSaved(false);
    setExpertise((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : prev.length < 5
          ? [...prev, value]
          : prev,
    );
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!headline.trim()) errs.headline = "Headline is required.";
    else if (headline.trim().length > 120) errs.headline = "Max 120 characters.";
    if (!currentPosition.trim()) errs.current_position = "Current position is required.";
    if (!bio.trim() || bio.trim().length < 30) errs.bio = "Bio must be at least 30 characters.";
    if (bio.trim().length > 800) errs.bio = "Bio must be 800 characters or fewer.";
    if (expertise.length === 0) errs.expertise = "Select at least one area.";
    if (!hometown.trim()) errs.hometown = "Hometown is required.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    setServerError(null);
    setSaved(false);

    const payload: MentorOnboardingData = {
      headline: headline.trim(),
      current_position: currentPosition.trim(),
      bio: bio.trim(),
      expertise,
      hometown: hometown.trim(),
    };

    startTransition(async () => {
      const result = await updateMentorProfile(payload);
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div className="bg-surface-container rounded-xl p-6 lg:p-8 space-y-6">
        <h2 className="font-display font-semibold text-lg text-on-surface">Identity</h2>

        <div>
          <Input
            label="Headline"
            placeholder="e.g. Senior Designer at Canva · Monash grad"
            value={headline}
            onChange={(e) => { setHeadline(e.target.value); clearError("headline"); setSaved(false); }}
            error={errors.headline}
          />
          <p className="font-body text-xs text-on-surface-variant mt-1.5 text-right">{headline.length}/120</p>
        </div>

        <Input
          label="Current position"
          placeholder="e.g. Product Designer at Atlassian"
          value={currentPosition}
          onChange={(e) => { setCurrentPosition(e.target.value); clearError("current_position"); setSaved(false); }}
          error={errors.current_position}
        />

        <Input
          label="Hometown"
          placeholder="e.g. Mumbai, India"
          value={hometown}
          onChange={(e) => { setHometown(e.target.value); clearError("hometown"); setSaved(false); }}
          error={errors.hometown}
        />
      </div>

      <div className="bg-surface-container rounded-xl p-6 lg:p-8 space-y-4">
        <h2 className="font-display font-semibold text-lg text-on-surface">Your story</h2>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="bio"
            className="font-body text-sm font-medium text-on-surface tracking-[0.08em] uppercase"
          >
            Bio
          </label>
          <textarea
            id="bio"
            rows={7}
            value={bio}
            onChange={(e) => { setBio(e.target.value); clearError("bio"); setSaved(false); }}
            maxLength={800}
            className={cn(
              "w-full px-4 py-3 font-body text-base text-on-surface bg-surface-container-low rounded-md outline-none border-none ring-0 focus:ring-2 focus:ring-tertiary focus:ring-offset-0 placeholder:text-on-surface-variant/60 resize-none",
              errors.bio && "ring-2 ring-error",
            )}
          />
          <div className="flex justify-between items-start">
            <FieldError message={errors.bio} />
            <p className="font-body text-xs text-on-surface-variant ml-auto">{bio.length}/800</p>
          </div>
        </div>
      </div>

      <div className="bg-surface-container rounded-xl p-6 lg:p-8 space-y-4">
        <h2 className="font-display font-semibold text-lg text-on-surface">Expertise</h2>
        <p className="font-body text-sm text-on-surface-variant">Select up to 5 areas.</p>

        <div className="flex flex-wrap gap-3">
          {FIELDS_OF_INTEREST.map(({ value, label }) => {
            const selected = expertise.includes(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleExpertise(value)}
                disabled={!selected && expertise.length >= 5}
                aria-pressed={selected}
                className={cn(
                  "px-4 py-2.5 rounded-full font-body text-sm font-medium transition-all duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                  selected
                    ? "bg-primary text-on-primary shadow-[0_4px_12px_rgba(0,24,66,0.20)]"
                    : "bg-surface-container-high text-on-surface hover:bg-primary-container hover:text-on-primary-container",
                  !selected && expertise.length >= 5 && "opacity-40 cursor-not-allowed",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
        <FieldError message={errors.expertise} />
        <p className="font-body text-xs text-on-surface-variant">{expertise.length}/5 selected</p>
      </div>

      {serverError && (
        <p className="font-body text-sm text-error" role="alert">
          {serverError}
        </p>
      )}

      {saved && (
        <div className="flex items-center gap-2 font-body text-sm text-secondary" role="status">
          <CheckCircle size={16} strokeWidth={1.5} aria-hidden="true" />
          Profile saved.
        </div>
      )}

      <Button
        type="button"
        variant="primary"
        size="lg"
        onClick={handleSave}
        disabled={isPending}
      >
        {isPending ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}
