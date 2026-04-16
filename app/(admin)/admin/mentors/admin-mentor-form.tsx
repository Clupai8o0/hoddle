// app/(admin)/admin/mentors/admin-mentor-form.tsx
"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import {
  createMentorFromAdmin,
  updateMentorFromAdmin,
  uploadMentorAvatarFromAdmin,
} from "@/lib/actions/admin-mentors";
import {
  FIELDS_OF_INTEREST,
  UNIVERSITIES,
  COUNTRIES,
} from "@/lib/validation/onboarding";

interface AdminMentorFormProps {
  mode: "create" | "edit";
  /** Required for edit mode — the mentor's profile_id */
  profileId?: string;
  defaultValues?: {
    email?: string;
    full_name: string;
    headline: string;
    current_position: string;
    bio: string;
    expertise: string[];
    hometown: string;
    country_of_origin: string;
    university: string;
    verified: boolean;
  };
  currentAvatarUrl?: string | null;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="font-body text-sm text-error mt-1" role="alert">
      {message}
    </p>
  );
}

export function AdminMentorForm({
  mode,
  profileId,
  defaultValues,
  currentAvatarUrl,
}: AdminMentorFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Avatar
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl ?? null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  // Store the file for create mode (upload after user is created)
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);

  // Fields
  const [email, setEmail] = useState(defaultValues?.email ?? "");
  const [fullName, setFullName] = useState(defaultValues?.full_name ?? "");
  const [headline, setHeadline] = useState(defaultValues?.headline ?? "");
  const [currentPosition, setCurrentPosition] = useState(defaultValues?.current_position ?? "");
  const [bio, setBio] = useState(defaultValues?.bio ?? "");
  const [expertise, setExpertise] = useState<string[]>(defaultValues?.expertise ?? []);
  const [hometown, setHometown] = useState(defaultValues?.hometown ?? "");
  const [countryOfOrigin, setCountryOfOrigin] = useState(defaultValues?.country_of_origin ?? "");
  const [university, setUniversity] = useState(defaultValues?.university ?? "");
  const [verifyImmediately, setVerifyImmediately] = useState(defaultValues?.verified ?? false);

  function clearError(field: string) {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  const alreadyVerified = mode === "edit" && (defaultValues?.verified ?? false);

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
    if (mode === "create" && !email.trim()) errs.email = "Email is required.";
    if (!fullName.trim()) errs.full_name = "Full name is required.";
    if (headline.length > 120) errs.headline = "Max 120 characters.";
    if (bio.length > 800) errs.bio = "Max 800 characters.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // In edit mode, upload avatar immediately
  async function handleAvatarChangeEdit(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profileId) return;

    setAvatarPreview(URL.createObjectURL(file));
    setAvatarError(null);
    setAvatarUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    const result = await uploadMentorAvatarFromAdmin(profileId, formData);
    setAvatarUploading(false);

    if (!result.ok) {
      setAvatarError(result.error);
      setAvatarPreview(null);
      return;
    }

    setAvatarUrl(result.avatarUrl);
  }

  // In create mode, just store the file locally — upload after user is created
  function handleAvatarChangeCreate(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarError(null);
  }

  function handleSubmit() {
    if (!validate()) return;
    setServerError(null);
    setSaved(false);

    const payload = {
      ...(mode === "create" ? { email: email.trim() } : {}),
      full_name: fullName.trim(),
      headline: headline.trim(),
      current_position: currentPosition.trim(),
      bio: bio.trim(),
      expertise,
      hometown: hometown.trim(),
      country_of_origin: countryOfOrigin,
      university,
      verify_immediately: verifyImmediately,
    };

    startTransition(async () => {
      if (mode === "create") {
        const result = await createMentorFromAdmin(payload);
        if (!result.ok) {
          setServerError(result.error);
          return;
        }

        // Upload avatar if one was selected (mentor is already created at this point)
        if (pendingAvatarFile) {
          const formData = new FormData();
          formData.append("file", pendingAvatarFile);
          const avatarResult = await uploadMentorAvatarFromAdmin(result.profileId, formData);
          if (!avatarResult.ok) {
            setAvatarError(`Mentor created but photo upload failed: ${avatarResult.error}`);
          }
        }

        router.push(`/admin/mentors/${result.profileId}`);
      } else {
        if (!profileId) {
          setServerError("Missing profile ID.");
          return;
        }
        const result = await updateMentorFromAdmin(profileId, payload);
        if (!result.ok) {
          setServerError(result.error);
          return;
        }
        setSaved(true);
        router.refresh();
      }
    });
  }

  const displayAvatar = avatarPreview ?? avatarUrl;

  return (
    <div className="space-y-8">
      {/* Avatar upload */}
      <div className="bg-surface-container rounded-xl p-6 lg:p-8 space-y-4">
        <h2 className="font-display font-semibold text-lg text-on-surface">
          Profile photo
        </h2>
        <div className="flex items-center gap-6">
          <div className="relative w-20 h-20 rounded-full overflow-hidden bg-surface-container-high flex-shrink-0">
            {displayAvatar ? (
              <Image
                src={displayAvatar}
                alt={`${fullName || "Mentor"} avatar`}
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
              onChange={mode === "edit" ? handleAvatarChangeEdit : handleAvatarChangeCreate}
              aria-label="Upload profile photo"
            />
            <Button
              type="button"
              variant="ghost"
              size="default"
              disabled={avatarUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarUploading ? "Uploading..." : "Upload photo"}
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
        <h2 className="font-display font-semibold text-lg text-on-surface">
          Identity
        </h2>

        {mode === "create" && (
          <Input
            type="email"
            label="Email address"
            placeholder="mentor@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearError("email");
            }}
            error={errors.email}
            autoComplete="email"
            autoFocus
          />
        )}

        <Input
          label="Full name"
          placeholder="e.g. Priya Sharma"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            clearError("full_name");
            setSaved(false);
          }}
          error={errors.full_name}
        />

        <div>
          <Input
            label="Headline"
            placeholder="e.g. Senior Designer at Canva · Monash grad"
            value={headline}
            onChange={(e) => {
              setHeadline(e.target.value);
              clearError("headline");
              setSaved(false);
            }}
            error={errors.headline}
          />
          <p className="font-body text-xs text-on-surface-variant mt-1.5 text-right">
            {headline.length}/120
          </p>
        </div>

        <Input
          label="Current position"
          placeholder="e.g. Product Designer at Atlassian"
          value={currentPosition}
          onChange={(e) => {
            setCurrentPosition(e.target.value);
            clearError("current_position");
            setSaved(false);
          }}
          error={errors.current_position}
        />

        <Input
          label="Hometown"
          placeholder="e.g. Mumbai, India"
          value={hometown}
          onChange={(e) => {
            setHometown(e.target.value);
            setSaved(false);
          }}
        />

        {/* Country of origin — select */}
        <div className="flex flex-col gap-1.5 w-full">
          <label
            htmlFor="country_of_origin"
            className="font-body text-sm font-medium text-on-surface tracking-[0.08em] uppercase"
          >
            Country of origin
          </label>
          <select
            id="country_of_origin"
            value={countryOfOrigin}
            onChange={(e) => {
              setCountryOfOrigin(e.target.value);
              setSaved(false);
            }}
            className="w-full min-h-[56px] px-4 py-3 font-body text-base text-on-surface bg-surface-container-low rounded-md outline-none border-none ring-0 focus:ring-2 focus:ring-tertiary focus:ring-offset-0 appearance-none cursor-pointer"
          >
            <option value="">Select a country</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* University — select */}
        <div className="flex flex-col gap-1.5 w-full">
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
              setSaved(false);
            }}
            className="w-full min-h-[56px] px-4 py-3 font-body text-base text-on-surface bg-surface-container-low rounded-md outline-none border-none ring-0 focus:ring-2 focus:ring-tertiary focus:ring-offset-0 appearance-none cursor-pointer"
          >
            <option value="">Select a university</option>
            {UNIVERSITIES.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Story */}
      <div className="bg-surface-container rounded-xl p-6 lg:p-8 space-y-4">
        <h2 className="font-display font-semibold text-lg text-on-surface">
          Their story
        </h2>
        <Textarea
          label="Bio"
          placeholder="Tell students about this mentor's journey..."
          value={bio}
          onChange={(e) => {
            setBio(e.target.value);
            clearError("bio");
            setSaved(false);
          }}
          error={errors.bio}
          rows={7}
        />
        <p className="font-body text-xs text-on-surface-variant text-right">
          {bio.length}/800
        </p>
      </div>

      {/* Expertise */}
      <div className="bg-surface-container rounded-xl p-6 lg:p-8 space-y-4">
        <h2 className="font-display font-semibold text-lg text-on-surface">
          Expertise
        </h2>
        <p className="font-body text-sm text-on-surface-variant">
          Select up to 5 areas.
        </p>
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
        <p className="font-body text-xs text-on-surface-variant">
          {expertise.length}/5 selected
        </p>
      </div>

      {/* Verify checkbox */}
      <div className="bg-surface-container rounded-xl p-6 lg:p-8">
        <label className={cn("flex items-start gap-4", alreadyVerified ? "cursor-default" : "cursor-pointer")}>
          <input
            type="checkbox"
            checked={verifyImmediately}
            disabled={alreadyVerified}
            onChange={(e) => {
              setVerifyImmediately(e.target.checked);
              setSaved(false);
            }}
            className={cn("mt-1 w-5 h-5 rounded accent-primary", alreadyVerified ? "opacity-60" : "cursor-pointer")}
          />
          <div>
            <p className="font-body font-medium text-on-surface">
              {mode === "create" ? "Verify immediately" : "Mark as verified"}
            </p>
            <p className="font-body text-sm text-on-surface-variant">
              {alreadyVerified
                ? "Already verified. Use the detail page to revoke verification."
                : "Verified mentors are visible to students in the directory."}
            </p>
          </div>
        </label>
      </div>

      {/* Errors & success */}
      {serverError && (
        <p className="font-body text-sm text-error" role="alert">
          {serverError}
        </p>
      )}

      {saved && (
        <div
          className="flex items-center gap-2 font-body text-sm text-secondary"
          role="status"
        >
          <CheckCircle size={16} strokeWidth={1.5} aria-hidden="true" />
          Changes saved.
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          disabled={isPending}
        >
          {isPending
            ? mode === "create"
              ? "Creating..."
              : "Saving..."
            : mode === "create"
              ? "Create mentor"
              : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={() => router.push("/admin/mentors")}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
