# Google OAuth Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add "Continue with Google" OAuth sign-in alongside the existing email magic link flow on `/login` and `/signup`.

**Architecture:** A new `signInWithGoogle()` server action in `lib/actions/auth.ts` calls Supabase's `signInWithOAuth()` and redirects the browser to Google's consent screen. After consent, Google redirects to the existing `/api/auth/callback` route which already handles PKCE code exchange and onboarding routing — no changes needed there. A new `OAuthButtons` Server Component renders the button and is dropped into both auth pages above the magic link form.

**Tech Stack:** Next.js 15 App Router, TypeScript strict, Tailwind CSS v4, `@supabase/ssr`, `next/navigation`

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Modify | `lib/actions/auth.ts` | Add `signInWithGoogle()` server action |
| Create | `components/ui/oauth-buttons.tsx` | Server Component: Google button + "or" divider |
| Modify | `app/(auth)/login/page.tsx` | Render `OAuthButtons`, display URL-param errors |
| Modify | `app/(auth)/signup/page.tsx` | Render `OAuthButtons` |

**Unchanged:** `/api/auth/callback` — already handles PKCE and onboarding routing.

---

## Task 1: Add `signInWithGoogle()` server action

**Files:**
- Modify: `lib/actions/auth.ts`

- [ ] **Step 1: Add the server action**

Open `lib/actions/auth.ts`. The file already has `"use server"` at the top and imports `redirect`, `headers`, and `createClient`. Add the following function after `signOut()` (before `sendMagicLink`):

```ts
export async function signInWithGoogle(): Promise<never> {
  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host") ??
    headersList.get("host") ??
    "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/api/auth/callback` },
  });

  if (error || !data.url) {
    redirect("/login?error=oauth_failed");
  }

  redirect(data.url);
}
```

The complete top of the file after the change looks like:

```ts
"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

export async function signOut(): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function signInWithGoogle(): Promise<never> {
  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host") ??
    headersList.get("host") ??
    "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/api/auth/callback` },
  });

  if (error || !data.url) {
    redirect("/login?error=oauth_failed");
  }

  redirect(data.url);
}

export async function sendMagicLink(
  // ... rest of file unchanged
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors. If you see `Property 'url' does not exist on type`, ensure `@supabase/supabase-js` is up to date — `signInWithOAuth` returns `{ data: { provider, url }, error }`.

- [ ] **Step 3: Commit**

```bash
git add lib/actions/auth.ts
git commit -m "feat(auth): add signInWithGoogle server action"
```

---

## Task 2: Create `OAuthButtons` Server Component

**Files:**
- Create: `components/ui/oauth-buttons.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { signInWithGoogle } from "@/lib/actions/auth";

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 6.294C4.672 4.167 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function OAuthButtons() {
  return (
    <div className="w-full">
      <form action={signInWithGoogle}>
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-3 bg-surface-container-lowest ring-1 ring-on-surface/10 hover:bg-surface-container text-on-surface font-body font-medium text-sm py-3 px-4 rounded-xl shadow-[0_12px_40px_rgba(0,24,66,0.10)] transition-colors cursor-pointer"
        >
          <GoogleIcon />
          Continue with Google
        </button>
      </form>

      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-on-surface/10" />
        <span className="font-body text-sm text-on-surface-variant">or</span>
        <div className="flex-1 h-px bg-on-surface/10" />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/ui/oauth-buttons.tsx
git commit -m "feat(auth): add OAuthButtons server component"
```

---

## Task 3: Update `/login` page

**Files:**
- Modify: `app/(auth)/login/page.tsx`

This page is already `"use client"`. Two changes:
1. Import and render `<OAuthButtons />` above the magic link form
2. Read `?error=` from the URL to display OAuth failure messages

- [ ] **Step 1: Add the import and `useSearchParams` hook**

At the top of `app/(auth)/login/page.tsx`, add the import for `OAuthButtons` and `useSearchParams`:

```ts
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OAuthButtons } from "@/components/ui/oauth-buttons";
import { sendMagicLink } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/browser";
import { acceptMentorInvite } from "@/lib/actions/mentor-invites";
```

- [ ] **Step 2: Read URL error inside the component**

Inside `LoginPage`, add `useSearchParams` and seed `serverError` from the URL on mount. Replace the existing state declarations block with:

```ts
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(
    searchParams.get("error") === "oauth_failed"
      ? "Google sign-in failed. Please try again or use your email below."
      : null,
  );
  const hashHandled = useRef(false);
  // ... rest of component unchanged
```

- [ ] **Step 3: Render `OAuthButtons` above the magic link form**

In the non-sent branch of the return statement, add `<OAuthButtons />` above the `<form>`. The non-sent block should now read:

```tsx
<div className="max-w-md w-full">
  <h1 className="font-display font-bold text-3xl sm:text-4xl text-primary mb-2">
    Welcome back.
  </h1>
  <p className="font-body text-on-surface-variant text-base sm:text-lg mb-8 sm:mb-10">
    Enter your email and we&apos;ll send you a secure sign-in link.
  </p>

  <OAuthButtons />

  <form onSubmit={handleSubmit} noValidate className="space-y-6">
    <Input
      type="email"
      label="Email address"
      placeholder="you@example.com"
      value={email}
      onChange={(e) => {
        setEmail(e.target.value);
        if (emailError) setEmailError(null);
      }}
      error={emailError ?? undefined}
      autoComplete="email"
      autoFocus
    />

    {serverError && (
      <p className="font-body text-sm text-error" role="alert">
        {serverError}
      </p>
    )}

    <Button
      type="submit"
      variant="primary"
      size="lg"
      className="w-full"
      disabled={isPending}
    >
      {isPending ? "Sending…" : "Send me a link"}
    </Button>
  </form>

  <p className="mt-8 font-body text-sm text-on-surface-variant">
    New to Hoddle?{" "}
    <Link
      href="/signup"
      className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
    >
      Create an account
    </Link>
  </p>
</div>
```

Note: `OAuthButtons` renders the Google button **and** the "or" divider as a unit, so no additional divider markup is needed here.

- [ ] **Step 4: Wrap in Suspense (required for `useSearchParams`)**

Because `useSearchParams()` requires a Suspense boundary in Next.js App Router, wrap the default export. Replace the exported function signature:

```tsx
import { Suspense } from "react";

function LoginPageInner() {
  // ... all existing LoginPage code (rename the function)
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}
```

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/\(auth\)/login/page.tsx
git commit -m "feat(auth): add Google OAuth button to login page"
```

---

## Task 4: Update `/signup` page

**Files:**
- Modify: `app/(auth)/signup/page.tsx`

- [ ] **Step 1: Add the `OAuthButtons` import**

```ts
"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OAuthButtons } from "@/components/ui/oauth-buttons";
import { sendMagicLink } from "@/lib/actions/auth";
```

- [ ] **Step 2: Render `OAuthButtons` above the magic link form**

In the non-sent branch, add `<OAuthButtons />` between the subtitle paragraph and the `<form>`. The non-sent block should now read:

```tsx
<div className="max-w-md w-full">
  <h1 className="font-display font-bold text-3xl sm:text-4xl text-primary mb-2">
    Your Melbourne story starts here.
  </h1>
  <p className="font-body text-on-surface-variant text-base sm:text-lg mb-8 sm:mb-10 leading-relaxed">
    Connect with mentors who&apos;ve walked the same path — the same
    trams, laneways, and lecture halls.
  </p>

  <OAuthButtons />

  <form onSubmit={handleSubmit} noValidate className="space-y-6">
    <Input
      type="email"
      label="Email address"
      placeholder="you@example.com"
      value={email}
      onChange={(e) => {
        setEmail(e.target.value);
        if (emailError) setEmailError(null);
      }}
      error={emailError ?? undefined}
      autoComplete="email"
      autoFocus
    />

    {serverError && (
      <p className="font-body text-sm text-error" role="alert">
        {serverError}
      </p>
    )}

    <Button
      type="submit"
      variant="hero"
      size="lg"
      className="w-full"
      disabled={isPending}
    >
      {isPending ? "Sending…" : "Get started"}
    </Button>
  </form>

  <p className="mt-3 font-body text-xs text-on-surface-variant leading-relaxed">
    By continuing, you agree to Hoddle&apos;s{" "}
    <Link
      href="/terms"
      className="underline underline-offset-2 hover:text-on-surface transition-colors"
    >
      Terms of Service
    </Link>{" "}
    and{" "}
    <Link
      href="/privacy"
      className="underline underline-offset-2 hover:text-on-surface transition-colors"
    >
      Privacy Policy
    </Link>
    .
  </p>

  <p className="mt-8 font-body text-sm text-on-surface-variant">
    Already have an account?{" "}
    <Link
      href="/login"
      className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
    >
      Sign in
    </Link>
  </p>
</div>
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/\(auth\)/signup/page.tsx
git commit -m "feat(auth): add Google OAuth button to signup page"
```

---

## Manual steps (you must do these — cannot be coded)

After all code tasks are complete, OAuth will still return an error until these are done.

### Google Cloud Console

1. Go to https://console.cloud.google.com → **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Application type: **Web application**, Name: `Hoddle Melbourne`
4. Authorized redirect URIs — add both:
   - `http://localhost:3000/api/auth/callback`
   - `https://<your-production-domain>/api/auth/callback`
5. Click **Create** → copy the **Client ID** and **Client Secret**

### Supabase Dashboard — enable Google provider

1. Supabase project → **Authentication** → **Providers** → **Google** → toggle **on**
2. Paste **Client ID** and **Client Secret** from above → **Save**

### Supabase Dashboard — allowlist redirect URL

1. Supabase project → **Authentication** → **URL Configuration** → **Redirect URLs**
2. Add:
   - `http://localhost:3000/api/auth/callback`
   - `https://<your-production-domain>/api/auth/callback`

> No `.env.local` changes needed — credentials live in Supabase, not the app.

---

## Manual verification checklist

Run `npm run dev` and verify:

- [ ] `/login` shows "Continue with Google" button above the email form with an "or" divider
- [ ] `/signup` shows "Continue with Google" button above the email form with an "or" divider
- [ ] Clicking "Continue with Google" redirects to Google's consent screen (after manual steps are done)
- [ ] After Google consent, new user lands on `/onboarding`
- [ ] After Google consent, returning user lands on `/dashboard`
- [ ] Cancelling Google consent redirects to `/login` with the error message visible
- [ ] Magic link flow still works on both pages
- [ ] `npx tsc --noEmit` passes with zero errors
