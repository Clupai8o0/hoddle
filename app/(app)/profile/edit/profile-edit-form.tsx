"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CheckCircle, Camera } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { updateStudentProfile, type StudentProfileData } from "@/lib/actions/student-profile";
import {
  GOALS,
  CHALLENGES,
  FIELDS_OF_INTEREST,
  COUNTRIES,
  UNIVERSITIES,
} from "@/lib/validation/onboarding";
import { createClient } from "@/lib/supabase/browser";

interface ProfileEditFormProps {
  defaultValues: StudentProfileData;
  currentAvatarUrl: string | null;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="font-body text-sm text-error mt-1" role="alert">
      {message}
    </p>
  );
}

function ChipGroup({
  options,
  selected,
  max,
  onToggle,
  error,
}: {
  options: readonly { value: string; label: string }[];
  selected: string[];
  max: number;
  onToggle: (value: string) => void;
  error?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2.5">
        {options.map(({ value, label }) => {
          const isSelected = selected.includes(value);
          const isDisabled = !isSelected && selected.length >= max;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onToggle(value)}
              disabled={isDisabled}
              aria-pressed={isSelected}
              className={cn(
                "px-4 py-2 rounded-full font-body text-sm font-medium transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                isSelected
                  ? "bg-primary text-on-primary shadow-[0_4px_12px_rgba(0,24,66,0.20)]"
                  : "bg-surface-container-high text-on-surface hover:bg-primary-container hover:text-on-primary-container",
                isDisabled && "opacity-40 cursor-not-allowed",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
      {error && <FieldError message={error} />}
      <p className="font-body text-xs text-on-surface-variant">
        {selected.length}/{max} selected
      </p>
    </div>
  );
}

export function ProfileEditForm({ defaultValues, currentAvatarUrl }: ProfileEditFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Avatar upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Profile fields
  const [fullName, setFullName] = useState(defaultValues.full_name);
  const [country, setCountry] = useState(defaultValues.country_of_origin);
  const [university, setUniversity] = useState(defaultValues.university);
  const [yearOfStudy, setYearOfStudy] = useState(defaultValues.year_of_study);
  const [goals, setGoals] = useState<string[]>(defaultValues.goals);
  const [challenges, setChallenges] = useState<string[]>(defaultValues.challenges);
  const [fields, setFields] = useState<string[]>(defaultValues.fields_of_interest);

  function clearError(field: string) {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function toggle(
    value: string,
    current: string[],
    set: React.Dispatch<React.SetStateAction<string[]>>,
    max: number,
    field: string,
  ) {
    clearError(field);
    setSaved(false);
    set((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : prev.length < max
          ? [...prev, value]
          : prev,
    );
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.full_name = "Full name is required.";
    else if (fullName.trim().length > 100) errs.full_name = "Keep it to 100 characters or fewer.";
    if (!country) errs.country = "Country is required.";
    if (!university) errs.university = "University is required.";
    if (goals.length === 0) errs.goals = "Select at least one goal.";
    if (challenges.length === 0) errs.challenges = "Select at least one challenge.";
    if (fields.length === 0) errs.fields = "Select at least one area.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarPreview(URL.createObjectURL(file));
    setAvatarError(null);
    setAvatarUploading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in.");

      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      const bustedUrl = `${publicUrl}?t=${Date.now()}`;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ avatar_url: bustedUrl })
        .eq("id", user.id);

      if (profileError) throw profileError;

      setAvatarUrl(bustedUrl);
      router.refresh();
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Upload failed.");
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
    }
  }

  function handleSave() {
    if (!validate()) return;
    setServerError(null);
    setSaved(false);

    const payload: StudentProfileData = {
      full_name: fullName.trim(),
      country_of_origin: country,
      university,
      year_of_study: yearOfStudy,
      goals,
      challenges,
      fields_of_interest: fields,
    };

    startTransition(async () => {
      const result = await updateStudentProfile(payload);
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
      {/* Avatar */}
      <div className="bg-surface-container rounded-xl p-6 lg:p-8 space-y-4">
        <h2 className="font-display font-semibold text-lg text-on-surface">Profile photo</h2>
        <div className="flex items-center gap-6">
          <div className="relative w-20 h-20 rounded-full overflow-hidden bg-surface-container-high flex-shrink-0">
            {avatarPreview ?? avatarUrl ? (
              <Image
                src={avatarPreview ?? avatarUrl!}
                alt="Your avatar"
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-on-surface-variant/40">
                <Camera size={28} strokeWidth={1.5} aria-hidden="true" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleAvatarChange}
              aria-label="Upload profile photo"
            />
            <Button
              type="button"
              variant="ghost"
              size="default"
              disabled={avatarUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarUploading ? "Uploading…" : "Upload photo"}
            </Button>
            <p className="font-body text-xs text-on-surface-variant">
              JPEG, PNG or WebP · max 2 MB
            </p>
            {avatarError && (
              <p className="font-body text-xs text-error" role="alert">
                {avatarError}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Identity */}
      <div className="bg-surface-container rounded-xl p-6 lg:p-8 space-y-6">
        <h2 className="font-display font-semibold text-lg text-on-surface">About you</h2>

        <Input
          label="Full name"
          placeholder="e.g. Anh Nguyen"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            clearError("full_name");
            setSaved(false);
          }}
          error={errors.full_name}
        />

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="country"
            className="font-body text-sm font-medium text-on-surface tracking-[0.08em] uppercase"
          >
            Country of origin
          </label>
          <select
            id="country"
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              clearError("country");
              setSaved(false);
            }}
            className="w-full px-4 py-3 font-body text-base text-on-surface bg-surface-container-low rounded-md outline-none focus:ring-2 focus:ring-tertiary"
          >
            <option value="">Select country…</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <FieldError message={errors.country} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="university"
            className="font-body text-sm font-medium text-on-surface tracking-[0.08em] uppercase"
          >
            University
          </label>
          <select
            id="university"
            value={university}
            onChange={(e) => {
              setUniversity(e.target.value);
              clearError("university");
              setSaved(false);
            }}
            className="w-full px-4 py-3 font-body text-base text-on-surface bg-surface-container-low rounded-md outline-none focus:ring-2 focus:ring-tertiary"
          >
            <option value="">Select university…</option>
            {UNIVERSITIES.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          <FieldError message={errors.university} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="year"
            className="font-body text-sm font-medium text-on-surface tracking-[0.08em] uppercase"
          >
            Year of study
          </label>
          <select
            id="year"
            value={yearOfStudy}
            onChange={(e) => {
              setYearOfStudy(Number(e.target.value));
              setSaved(false);
            }}
            className="w-full px-4 py-3 font-body text-base text-on-surface bg-surface-container-low rounded-md outline-none focus:ring-2 focus:ring-tertiary"
          >
            {[1, 2, 3, 4, 5, 6].map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Goals */}
      <div className="bg-surface-container rounded-xl p-6 lg:p-8 space-y-4">
        <div>
          <h2 className="font-display font-semibold text-lg text-on-surface">Your goals</h2>
          <p className="font-body text-sm text-on-surface-variant mt-1">
            What are you working towards? Pick up to 3.
          </p>
        </div>
        <ChipGroup
          options={GOALS}
          selected={goals}
          max={3}
          onToggle={(v) => toggle(v, goals, setGoals, 3, "goals")}
          error={errors.goals}
        />
      </div>

      {/* Challenges */}
      <div className="bg-surface-container rounded-xl p-6 lg:p-8 space-y-4">
        <div>
          <h2 className="font-display font-semibold text-lg text-on-surface">Your challenges</h2>
          <p className="font-body text-sm text-on-surface-variant mt-1">
            What are you navigating right now? Pick up to 3.
          </p>
        </div>
        <ChipGroup
          options={CHALLENGES}
          selected={challenges}
          max={3}
          onToggle={(v) => toggle(v, challenges, setChallenges, 3, "challenges")}
          error={errors.challenges}
        />
      </div>

      {/* Fields of interest */}
      <div className="bg-surface-container rounded-xl p-6 lg:p-8 space-y-4">
        <div>
          <h2 className="font-display font-semibold text-lg text-on-surface">Areas of interest</h2>
          <p className="font-body text-sm text-on-surface-variant mt-1">
            Your field of study or career interest. Pick up to 3.
          </p>
        </div>
        <ChipGroup
          options={FIELDS_OF_INTEREST}
          selected={fields}
          max={3}
          onToggle={(v) => toggle(v, fields, setFields, 3, "fields")}
          error={errors.fields}
        />
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
