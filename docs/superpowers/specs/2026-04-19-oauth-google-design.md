# Google OAuth Login — Design Spec

**Date:** 2026-04-19  
**Status:** Approved  
**Scope:** Add "Continue with Google" OAuth alongside the existing magic link flow

---

## 1. Goal

Allow students (and returning mentors) to sign in or sign up using their Google account, without replacing the existing email magic link option. New Google users are routed to onboarding; returning users go straight to the dashboard.

---

## 2. Architecture

### What stays the same
- `/api/auth/callback` — already handles PKCE code exchange (`exchangeCodeForSession`) and onboarding routing via `profile?.onboarded_at`. No changes required.
- Supabase server/browser clients — no changes.
- Onboarding flow — new Google users land here automatically because their profile has no `onboarded_at`.
- Magic link flow — fully preserved alongside OAuth.

### What gets added

| Item | Location | Description |
|---|---|---|
| `signInWithGoogle()` | `lib/actions/auth.ts` | Server action that calls `supabase.auth.signInWithOAuth({ provider: 'google' })` and redirects to the returned URL |
| `OAuthButtons` | `components/ui/oauth-buttons.tsx` | Button component rendering "Continue with Google" in Hoddle design tokens |
| Divider + button placement | `app/(auth)/login/page.tsx` + `app/(auth)/signup/page.tsx` | OAuth button above magic link form, separated by an "or" divider |

### Auth flow

```
User clicks "Continue with Google"
  → signInWithGoogle() server action
  → supabase.auth.signInWithOAuth() generates Google consent URL
  → redirect(data.url) sends browser to Google
  → User consents on Google screen
  → Google redirects to /api/auth/callback?code=...
  → exchangeCodeForSession() creates Supabase session
  → profile check:
      no onboarded_at → /onboarding  (new user)
      has onboarded_at → /dashboard  (returning user)
```

---

## 3. Implementation details

### `signInWithGoogle()` server action

Added to `lib/actions/auth.ts`. Uses the existing `createClient()` (server client) and derives `origin` the same way `sendMagicLink` does (via `x-forwarded-host` / `host` headers).

```ts
export async function signInWithGoogle(): Promise<never> {
  const headersList = await headers()
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "localhost:3000"
  const proto = headersList.get("x-forwarded-proto") ?? "http"
  const origin = `${proto}://${host}`

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/api/auth/callback` },
  })

  if (error || !data.url) {
    redirect("/login?error=oauth_failed")
  }

  redirect(data.url)
}
```

### `OAuthButtons` component

Located at `components/ui/oauth-buttons.tsx`. A **Server Component** — no state or browser APIs needed. Uses `<form action={signInWithGoogle}>` to call the server action directly.

- Background: `bg-surface-container-lowest` (white card surface)
- Border: tonal using `ring-1 ring-on-surface/10`
- Text: `text-on-surface` label — "Continue with Google"
- Icon: inline Google "G" SVG (no external dependency)
- Hover: `hover:bg-surface-container` (tonal shift, no warm colours)
- Shadow: `shadow-[0_12px_40px_rgba(0,24,66,0.10)]` (Hoddle blue-tinted diffuse shadow)

### Login + Signup page changes

Both pages get the same structural addition above the existing form:

```
┌────────────────────────────────┐
│  [G]  Continue with Google     │  ← OAuthButtons
└────────────────────────────────┘
         ─────  or  ─────
  [ existing magic link form ]
```

The "or" divider uses `text-on-surface-variant` with tonal lines — no `1px solid` borders (design non-negotiable §3.4).

---

## 4. Manual steps (cannot be coded)

These must be completed before OAuth will work in any environment.

### Step 1 — Google Cloud Console

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Name: `Hoddle Melbourne`
5. Add **Authorized redirect URIs**:
   - Development: `http://localhost:3000/api/auth/callback`
   - Production: `https://<your-production-domain>/api/auth/callback`
6. Click **Create** — copy the **Client ID** and **Client Secret**

### Step 2 — Supabase Dashboard

1. Go to your Supabase project → **Authentication** → **Providers**
2. Find **Google** and toggle it **on**
3. Paste the **Client ID** and **Client Secret** from Step 1
4. Save

> Note: Google credentials live entirely in Supabase. No new environment variables are needed in `.env.local`.

### Step 3 — Supabase Redirect URL allowlist

1. In Supabase → **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
   - `http://localhost:3000/api/auth/callback`
   - `https://<your-production-domain>/api/auth/callback`

---

## 5. Out of scope

- Additional OAuth providers (GitHub, Apple) — can be added later by repeating this pattern
- Linking multiple OAuth providers to a single account — Supabase handles this automatically when the same email is used
- Removing magic links — magic link flow is preserved alongside OAuth

---

## 6. Testing checklist

- [ ] New user: Google sign-in → lands on `/onboarding`
- [ ] Returning user: Google sign-in → lands on `/dashboard`
- [ ] OAuth error (user cancels consent): lands on `/login?error=oauth_failed`
- [ ] Magic link flow still works after changes
- [ ] `OAuthButtons` renders correctly on `/login` and `/signup`
- [ ] No hardcoded hex values in new components
- [ ] No decorative icon usage (Google "G" is functional — it identifies the provider)
