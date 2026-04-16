# Admin Mentor Management — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a complete mentor create/edit feature to the admin panel so non-technical team members can set up mentor accounts (auth + profile + avatar) without the mentor needing to self-onboard.

**Architecture:** The admin creates a Supabase auth user via the service-role admin client (`admin.auth.admin.createUser`), which fires the existing `handle_new_user` trigger to auto-create a `profiles` row. The server action then updates that profile row and inserts a `mentors` row with all provided details. Avatar upload goes through a server action using the admin client to bypass the avatars bucket RLS (which only allows owner writes). A shared client-side form component is used for both create and edit modes.

**Tech Stack:** Next.js App Router, TypeScript, Supabase admin client (service role), Zod validation, Tailwind CSS with Hoddle design tokens, `lucide-react` icons.

---

## Key context for the implementer

### Relevant docs to read before starting
- `CLAUDE.md` — master briefing, design non-negotiables (no `#ffffff` backgrounds, no `#000000` text, no warm colours, blue-tinted shadows, etc.)
- `docs/design.md` — full design system
- `docs/database-schema.md` — table schemas and RLS policies

### Critical patterns to follow
- **Design tokens only** — never hardcode hex values. Use Tailwind classes like `bg-surface`, `text-on-surface`, `text-primary`, `bg-surface-container`, etc. All tokens are defined in `app/globals.css`.
- **Admin auth check** — every server action must verify the caller is admin (see pattern in `lib/actions/mentor-invites.ts:26-41`).
- **Admin client for privileged ops** — `createAdminClient()` from `lib/supabase/admin.ts` uses the service role key and bypasses RLS. Use it for: creating auth users, writing to other users' avatar folders, inserting mentors rows, updating profiles for other users.
- **Server client for auth check** — `createClient()` from `lib/supabase/server.ts` uses the session cookie. Use it only to verify the caller's identity/role.
- **Return shape** — server actions return `{ ok: true, data? } | { ok: false, error: string }`. Never throw.
- **Avatars bucket RLS** — policies restrict writes to `avatars/{owner_uid}/...`. Admin uploading for a mentor must use the admin client (service role), not the browser client.
- **`handle_new_user` trigger** — when `admin.auth.admin.createUser()` creates an auth user, the trigger auto-inserts a `profiles` row with just the `id`. The server action then updates that row with `full_name`, `role`, etc.
- **Slug generation** — existing pattern in `lib/actions/mentor-invites.ts:199`: `emailUsername-${Date.now().toString(36)}`.
- **Form components** — use `Input` from `@/components/ui/input`, `Textarea` from `@/components/ui/textarea`, `Button` from `@/components/ui/button`, `Tag` from `@/components/ui/tag`. See their APIs in `components/ui/`.
- **Expertise chips** — use `FIELDS_OF_INTEREST` from `@/lib/validation/onboarding` for the expertise tag vocabulary. See the chip toggle pattern in `app/(app)/mentor/profile/edit/edit-profile-form.tsx:54-64,272-298`.
- **University/Country dropdowns** — use `UNIVERSITIES` and `COUNTRIES` from `@/lib/validation/onboarding`.
- **Container** — wrap pages in `<Container className="py-16">` from `@/components/ui/container`.
- **Breadcrumb nav** — follow the pattern in the existing admin pages (e.g., `app/(admin)/admin/mentors/[id]/page.tsx:42-57`).
- **Icons** — `lucide-react` at `strokeWidth={1.5}`, functional use only. Add `aria-hidden="true"`.

### File structure overview

```
New files:
  lib/validation/admin-mentor.ts          — Zod schemas for create + edit
  lib/actions/admin-mentors.ts            — Server actions: create, update, upload avatar
  app/(admin)/admin/mentors/admin-mentor-form.tsx  — Shared form component (client)
  app/(admin)/admin/mentors/new/page.tsx   — Create mentor page (client, wraps form)
  app/(admin)/admin/mentors/[id]/edit/page.tsx — Edit mentor page (server, fetches data + renders form)
  app/(admin)/admin/mentors/[id]/edit/edit-mentor-client.tsx — Client wrapper for edit form

Modified files:
  app/(admin)/admin/mentors/page.tsx       — Add "Create mentor" button next to "Invite mentor"
  app/(admin)/admin/mentors/[id]/page.tsx  — Add "Edit" button to detail page sidebar
  app/(admin)/admin/page.tsx               — Add "Create mentor" card to dashboard
```

---

## Task 1: Zod validation schemas

**Files:**
- Create: `lib/validation/admin-mentor.ts`

- [ ] **Step 1: Create the validation schema file**

```typescript
// lib/validation/admin-mentor.ts
import { z } from "zod";

export const adminMentorCreateSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required.")
    .email("Enter a valid email address."),
  full_name: z
    .string()
    .min(1, "Full name is required.")
    .max(100, "Keep it to 100 characters or fewer."),
  headline: z
    .string()
    .max(120, "Keep it to 120 characters or fewer.")
    .optional()
    .default(""),
  current_position: z
    .string()
    .max(120, "Keep it to 120 characters or fewer.")
    .optional()
    .default(""),
  bio: z
    .string()
    .max(800, "Bio must be 800 characters or fewer.")
    .optional()
    .default(""),
  expertise: z
    .array(z.string())
    .max(5, "Select up to 5 areas.")
    .optional()
    .default([]),
  hometown: z
    .string()
    .max(100, "Keep it to 100 characters or fewer.")
    .optional()
    .default(""),
  country_of_origin: z
    .string()
    .max(100, "Keep it to 100 characters or fewer.")
    .optional()
    .default(""),
  university: z
    .string()
    .max(200, "Keep it to 200 characters or fewer.")
    .optional()
    .default(""),
  verify_immediately: z.boolean().optional().default(false),
});

export const adminMentorEditSchema = adminMentorCreateSchema.omit({ email: true });

export type AdminMentorCreateInput = z.infer<typeof adminMentorCreateSchema>;
export type AdminMentorEditInput = z.infer<typeof adminMentorEditSchema>;
```

- [ ] **Step 2: Commit**

```bash
git add lib/validation/admin-mentor.ts
git commit -m "feat(admin): add Zod schemas for admin mentor create/edit"
```

---

## Task 2: Server actions

**Files:**
- Create: `lib/actions/admin-mentors.ts`

- [ ] **Step 1: Create the server actions file**

```typescript
// lib/actions/admin-mentors.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  adminMentorCreateSchema,
  adminMentorEditSchema,
} from "@/lib/validation/admin-mentor";

// ---------------------------------------------------------------------------
// Helper: verify caller is admin
// ---------------------------------------------------------------------------

async function requireAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { ok: false, error: "Insufficient permissions." };
  }
  return { ok: true, userId: user.id };
}

// ---------------------------------------------------------------------------
// createMentorFromAdmin
// ---------------------------------------------------------------------------

export async function createMentorFromAdmin(
  input: unknown,
): Promise<{ ok: true; profileId: string } | { ok: false; error: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const parsed = adminMentorCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const {
    email,
    full_name,
    headline,
    current_position,
    bio,
    expertise,
    hometown,
    country_of_origin,
    university,
    verify_immediately,
  } = parsed.data;

  const admin = createAdminClient();

  // 1. Create the auth user (this fires handle_new_user trigger → profiles row)
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true, // skip email verification — admin is vouching
  });

  if (authError) {
    // Supabase returns "A user with this email address has already been registered"
    if (authError.message?.includes("already been registered")) {
      return { ok: false, error: "A user with this email already exists." };
    }
    return { ok: false, error: authError.message };
  }

  const userId = authData.user.id;

  // 2. Update the profiles row (created by trigger) with role + details
  const { error: profileError } = await admin
    .from("profiles")
    .update({
      role: "mentor" as const,
      full_name: full_name || null,
      country_of_origin: country_of_origin || null,
      university: university || null,
      onboarded_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (profileError) {
    return { ok: false, error: `Profile update failed: ${profileError.message}` };
  }

  // 3. Generate slug from email
  const emailUsername = email
    .split("@")[0]!
    .replace(/[^a-z0-9]/gi, "-")
    .toLowerCase();
  const slug = `${emailUsername}-${Date.now().toString(36)}`;

  // 4. Create the mentors row
  const { error: mentorError } = await admin.from("mentors").insert({
    profile_id: userId,
    slug,
    headline: headline || null,
    bio: bio || null,
    expertise: expertise ?? [],
    hometown: hometown || null,
    current_position: current_position || null,
    verified_at: verify_immediately ? new Date().toISOString() : null,
  });

  if (mentorError) {
    return { ok: false, error: `Mentor row creation failed: ${mentorError.message}` };
  }

  return { ok: true, profileId: userId };
}

// ---------------------------------------------------------------------------
// updateMentorFromAdmin
// ---------------------------------------------------------------------------

export async function updateMentorFromAdmin(
  profileId: string,
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const parsed = adminMentorEditSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const {
    full_name,
    headline,
    current_position,
    bio,
    expertise,
    hometown,
    country_of_origin,
    university,
    verify_immediately,
  } = parsed.data;

  const admin = createAdminClient();

  // Update profiles + mentors in parallel
  const [profileResult, mentorResult] = await Promise.all([
    admin
      .from("profiles")
      .update({
        full_name: full_name || null,
        country_of_origin: country_of_origin || null,
        university: university || null,
      })
      .eq("id", profileId),
    admin
      .from("mentors")
      .update({
        headline: headline || null,
        bio: bio || null,
        expertise: expertise ?? [],
        hometown: hometown || null,
        current_position: current_position || null,
      })
      .eq("profile_id", profileId),
  ]);

  if (profileResult.error) {
    return { ok: false, error: `Profile update failed: ${profileResult.error.message}` };
  }
  if (mentorResult.error) {
    return { ok: false, error: `Mentor update failed: ${mentorResult.error.message}` };
  }

  // Handle verify toggle — only set if switching from unverified → verified
  if (verify_immediately) {
    const { data: mentor } = await admin
      .from("mentors")
      .select("verified_at")
      .eq("profile_id", profileId)
      .single();

    if (mentor && !mentor.verified_at) {
      await admin
        .from("mentors")
        .update({ verified_at: new Date().toISOString() })
        .eq("profile_id", profileId);
    }
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// uploadMentorAvatarFromAdmin — uses admin client to bypass avatars RLS
// ---------------------------------------------------------------------------

export async function uploadMentorAvatarFromAdmin(
  profileId: string,
  formData: FormData,
): Promise<{ ok: true; avatarUrl: string } | { ok: false; error: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "No file provided." };
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return { ok: false, error: "Only JPEG, PNG, and WebP images are allowed." };
  }

  // Validate file size (2 MB limit matches bucket config)
  if (file.size > 2 * 1024 * 1024) {
    return { ok: false, error: "Image must be under 2 MB." };
  }

  const admin = createAdminClient();

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${profileId}/avatar.${ext}`;

  // Convert File to ArrayBuffer for server-side upload
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await admin.storage
    .from("avatars")
    .upload(path, buffer, { upsert: true, contentType: file.type });

  if (uploadError) {
    return { ok: false, error: `Upload failed: ${uploadError.message}` };
  }

  const {
    data: { publicUrl },
  } = admin.storage.from("avatars").getPublicUrl(path);

  // Cache-bust
  const avatarUrl = `${publicUrl}?t=${Date.now()}`;

  // Update profile with new avatar URL
  const { error: profileError } = await admin
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", profileId);

  if (profileError) {
    return { ok: false, error: `Saved image but failed to update profile: ${profileError.message}` };
  }

  return { ok: true, avatarUrl };
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/actions/admin-mentors.ts
git commit -m "feat(admin): add server actions for creating, editing, and uploading avatar for mentors"
```

---

## Task 3: Shared admin mentor form component

**Files:**
- Create: `app/(admin)/admin/mentors/admin-mentor-form.tsx`

This is the main form used by both the "new" and "edit" pages. It is a `"use client"` component.

**Key design decisions:**
- The form receives a `mode` prop: `"create"` shows the email field; `"edit"` hides it.
- The form receives `defaultValues` for pre-population in edit mode.
- Avatar upload calls the `uploadMentorAvatarFromAdmin` server action via `FormData`.
- Expertise uses the chip toggle pattern from the existing mentor edit form.
- University and country use `<select>` dropdowns using the vocabulary from `lib/validation/onboarding.ts`.
- A "Verify immediately" checkbox is included.
- On success, create mode redirects to the new mentor's detail page; edit mode shows a "Saved" confirmation.

- [ ] **Step 1: Create the form component**

```tsx
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

        // Upload avatar if one was selected
        if (pendingAvatarFile) {
          const formData = new FormData();
          formData.append("file", pendingAvatarFile);
          await uploadMentorAvatarFromAdmin(result.profileId, formData);
          // Non-blocking — if avatar upload fails, the mentor is still created
        }

        router.push(`/admin/mentors/${result.profileId}`);
      } else {
        const result = await updateMentorFromAdmin(profileId!, payload);
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
              JPEG, PNG or WebP &middot; max 2 MB
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
            placeholder="e.g. Senior Designer at Canva &middot; Monash grad"
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
        <label className="flex items-start gap-4 cursor-pointer">
          <input
            type="checkbox"
            checked={verifyImmediately}
            onChange={(e) => {
              setVerifyImmediately(e.target.checked);
              setSaved(false);
            }}
            className="mt-1 w-5 h-5 rounded accent-primary cursor-pointer"
          />
          <div>
            <p className="font-body font-medium text-on-surface">
              {mode === "create" ? "Verify immediately" : "Mark as verified"}
            </p>
            <p className="font-body text-sm text-on-surface-variant">
              Verified mentors are visible to students in the directory.
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
```

- [ ] **Step 2: Commit**

```bash
git add app/\(admin\)/admin/mentors/admin-mentor-form.tsx
git commit -m "feat(admin): add shared admin mentor form component for create/edit"
```

---

## Task 4: "Create mentor" page

**Files:**
- Create: `app/(admin)/admin/mentors/new/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// app/(admin)/admin/mentors/new/page.tsx
"use client";

import Link from "next/link";
import { Container } from "@/components/ui/container";
import { AdminMentorForm } from "../admin-mentor-form";

export default function NewMentorPage() {
  return (
    <Container className="py-16">
      <div className="max-w-2xl">
        <nav className="font-body text-sm text-on-surface-variant mb-3">
          <Link href="/admin" className="hover:text-primary transition-colors">
            Admin
          </Link>
          {" / "}
          <Link
            href="/admin/mentors"
            className="hover:text-primary transition-colors"
          >
            Mentors
          </Link>
          {" / "}
          <span className="text-on-surface">New</span>
        </nav>

        <h1 className="font-display text-4xl font-bold text-primary mb-2">
          Create a mentor
        </h1>
        <p className="font-body text-on-surface-variant text-lg mb-10">
          Create a full mentor account. They can log in later via magic link to
          their email.
        </p>

        <AdminMentorForm mode="create" />
      </div>
    </Container>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(admin\)/admin/mentors/new/page.tsx
git commit -m "feat(admin): add create mentor page at /admin/mentors/new"
```

---

## Task 5: "Edit mentor" page

**Files:**
- Create: `app/(admin)/admin/mentors/[id]/edit/page.tsx`
- Create: `app/(admin)/admin/mentors/[id]/edit/edit-mentor-client.tsx`

The page is a Server Component that fetches the mentor data, then renders a client wrapper that passes it to the shared form.

- [ ] **Step 1: Create the client wrapper**

```tsx
// app/(admin)/admin/mentors/[id]/edit/edit-mentor-client.tsx
"use client";

import { AdminMentorForm } from "../../admin-mentor-form";

interface EditMentorClientProps {
  profileId: string;
  defaultValues: {
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
  currentAvatarUrl: string | null;
}

export function EditMentorClient({
  profileId,
  defaultValues,
  currentAvatarUrl,
}: EditMentorClientProps) {
  return (
    <AdminMentorForm
      mode="edit"
      profileId={profileId}
      defaultValues={defaultValues}
      currentAvatarUrl={currentAvatarUrl}
    />
  );
}
```

- [ ] **Step 2: Create the server page**

```tsx
// app/(admin)/admin/mentors/[id]/edit/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { createAdminClient } from "@/lib/supabase/admin";
import { EditMentorClient } from "./edit-mentor-client";

export const metadata = { title: "Edit Mentor — Admin — Hoddle" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditMentorPage({ params }: PageProps) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: mentor } = await admin
    .from("mentors")
    .select(
      `profile_id, slug, headline, bio, expertise, hometown,
       current_position, verified_at,
       profiles!mentors_profile_id_fkey(full_name, avatar_url, country_of_origin, university)`,
    )
    .eq("profile_id", id)
    .single();

  if (!mentor) notFound();

  const profile = mentor.profiles as {
    full_name: string | null;
    avatar_url: string | null;
    country_of_origin: string | null;
    university: string | null;
  };

  return (
    <Container className="py-16">
      <div className="max-w-2xl">
        <nav className="font-body text-sm text-on-surface-variant mb-3">
          <Link href="/admin" className="hover:text-primary transition-colors">
            Admin
          </Link>
          {" / "}
          <Link
            href="/admin/mentors"
            className="hover:text-primary transition-colors"
          >
            Mentors
          </Link>
          {" / "}
          <Link
            href={`/admin/mentors/${id}`}
            className="hover:text-primary transition-colors"
          >
            {profile.full_name ?? mentor.slug}
          </Link>
          {" / "}
          <span className="text-on-surface">Edit</span>
        </nav>

        <h1 className="font-display text-4xl font-bold text-primary mb-2">
          Edit mentor
        </h1>
        <p className="font-body text-on-surface-variant text-lg mb-10">
          Update {profile.full_name ?? "this mentor"}&apos;s profile details.
        </p>

        <EditMentorClient
          profileId={id}
          defaultValues={{
            full_name: profile.full_name ?? "",
            headline: mentor.headline ?? "",
            current_position: mentor.current_position ?? "",
            bio: mentor.bio ?? "",
            expertise: mentor.expertise ?? [],
            hometown: mentor.hometown ?? "",
            country_of_origin: profile.country_of_origin ?? "",
            university: profile.university ?? "",
            verified: !!mentor.verified_at,
          }}
          currentAvatarUrl={profile.avatar_url}
        />
      </div>
    </Container>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/\(admin\)/admin/mentors/\[id\]/edit/
git commit -m "feat(admin): add edit mentor page at /admin/mentors/[id]/edit"
```

---

## Task 6: Update existing admin pages with links

**Files:**
- Modify: `app/(admin)/admin/mentors/page.tsx` — add "Create mentor" button
- Modify: `app/(admin)/admin/mentors/[id]/page.tsx` — add "Edit" link to sidebar
- Modify: `app/(admin)/admin/page.tsx` — add "Create mentor" card

- [ ] **Step 1: Add "Create mentor" button to mentors list page**

In `app/(admin)/admin/mentors/page.tsx`, add a second button next to the existing "Invite mentor" button.

Change the header buttons area (lines 52-58) from:

```tsx
        <Button variant="primary" size="default" asChild>
          <Link href="/admin/mentors/invite">
            <UserPlus size={16} strokeWidth={1.5} aria-hidden="true" />
            Invite mentor
          </Link>
        </Button>
```

To:

```tsx
        <div className="flex gap-3">
          <Button variant="primary" size="default" asChild>
            <Link href="/admin/mentors/new">
              <UserPlus size={16} strokeWidth={1.5} aria-hidden="true" />
              Create mentor
            </Link>
          </Button>
          <Button variant="secondary" size="default" asChild>
            <Link href="/admin/mentors/invite">
              <Mail size={16} strokeWidth={1.5} aria-hidden="true" />
              Invite mentor
            </Link>
          </Button>
        </div>
```

Also add `Mail` to the lucide-react import on line 2:

```tsx
import { UserPlus, Mail, CheckCircle, Clock } from "lucide-react";
```

- [ ] **Step 2: Add "Edit" button to mentor detail page sidebar**

In `app/(admin)/admin/mentors/[id]/page.tsx`, add an "Edit profile" link inside the sidebar `<aside>` element. Add it right after the closing `</div>` of the verification card (after line 195), before the `</aside>` closing tag:

```tsx
          <Link
            href={`/admin/mentors/${mentor.profile_id}/edit`}
            className="block mt-4 bg-surface-container rounded-xl p-6 text-center font-body font-medium text-primary hover:bg-primary-container transition-colors"
          >
            Edit profile
          </Link>
```

Also add the `Link` import if not already present (it is already imported on line 2).

- [ ] **Step 3: Add "Create mentor" card to admin dashboard**

In `app/(admin)/admin/page.tsx`, add `UserPlus` to the existing icon imports (it's already imported). Then add a new card object in the `cards` array, right after the "Invite a mentor" card (after line 53):

```typescript
    {
      href: "/admin/mentors/new",
      icon: UserPlus,
      label: "Create a mentor",
      description: "Set up a full mentor account with all profile details — they can log in later.",
      badge: null,
      badgeLabel: null,
    },
```

Note: `UserPlus` is already imported on line 3. However, to avoid duplicate icons, use a different icon for the new card. Import `UserRoundPlus` from lucide-react on line 3 and use that instead:

```tsx
import { Users, UserPlus, UserRoundPlus, Clock, BookOpen } from "lucide-react";
```

And use `icon: UserRoundPlus` for the new card.

- [ ] **Step 4: Commit**

```bash
git add app/\(admin\)/admin/mentors/page.tsx app/\(admin\)/admin/mentors/\[id\]/page.tsx app/\(admin\)/admin/page.tsx
git commit -m "feat(admin): add create/edit links to mentor list, detail, and dashboard pages"
```

---

## Task 7: Manual smoke test

No automated tests for this feature — it's admin-only UI that creates auth users (requires a running Supabase instance). Verify manually:

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test the create flow**

1. Navigate to `/admin/mentors/new`
2. Fill in all fields: email, name, headline, bio, upload a photo, select expertise, pick country/university, check "Verify immediately"
3. Click "Create mentor"
4. Confirm you're redirected to the new mentor's detail page at `/admin/mentors/[id]`
5. Verify all details appear correctly
6. Check that the avatar shows (not just initials)
7. Check the verification badge shows as "Verified"

- [ ] **Step 3: Test the edit flow**

1. From the mentor detail page, click "Edit profile" in the sidebar
2. Modify a few fields (change headline, add/remove expertise)
3. Upload a new avatar
4. Click "Save changes"
5. Confirm "Changes saved" message appears
6. Navigate back to the detail page — verify changes persisted

- [ ] **Step 4: Test edge cases**

1. Try creating a mentor with an email that already exists — should show error
2. Try creating a mentor with no email or no name — should show validation errors
3. Try uploading an oversized image (>2 MB) — should show error
4. Verify the mentor can log in via magic link to their email (if you have a test email setup)

- [ ] **Step 5: Test that existing features still work**

1. Verify the "Invite mentor" flow still works from `/admin/mentors/invite`
2. Verify mentor verification/unverification still works from the detail page
3. Verify the mentors list still loads correctly with the new button layout
4. Verify the admin dashboard shows the new "Create a mentor" card

---

## Summary of all files

| Action | Path |
|--------|------|
| Create | `lib/validation/admin-mentor.ts` |
| Create | `lib/actions/admin-mentors.ts` |
| Create | `app/(admin)/admin/mentors/admin-mentor-form.tsx` |
| Create | `app/(admin)/admin/mentors/new/page.tsx` |
| Create | `app/(admin)/admin/mentors/[id]/edit/page.tsx` |
| Create | `app/(admin)/admin/mentors/[id]/edit/edit-mentor-client.tsx` |
| Modify | `app/(admin)/admin/mentors/page.tsx` |
| Modify | `app/(admin)/admin/mentors/[id]/page.tsx` |
| Modify | `app/(admin)/admin/page.tsx` |
