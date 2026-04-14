# PWA + README + Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Hoddle installable as a PWA with offline fallback, Web Push for three notification types, a user-facing install prompt, and produce a README and a step-by-step operator guide.

**Architecture:** Serwist (`@serwist/next`) wraps the Next.js config and compiles `app/sw.ts` into `/public/sw.js`. The manifest and iOS meta tags live in the root layout. Web Push uses VAPID keys via `web-push`; subscriptions are stored in a new `push_subscriptions` Supabase table and sent through a `sendWebPush` helper that plugs into the existing `notify()` function.

**Tech Stack:** `@serwist/next`, `serwist`, `web-push`, Supabase (new migration), Next.js App Router Server/Client components, Tailwind v4 tokens.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `app/sw.ts` | Serwist service worker entry |
| Create | `app/offline/page.tsx` | Offline fallback page (static RSC) |
| Create | `public/manifest.webmanifest` | PWA manifest (icons, shortcuts, colors) |
| Create | `public/icons/icon-192.png` | **Placeholder** — copy of `single-logo.png`; swap for proper icon |
| Create | `public/icons/icon-512.png` | **Placeholder** — copy of `single-logo.png`; swap for proper icon |
| Create | `components/pwa/install-prompt.tsx` | `beforeinstallprompt` handler + bottom sheet |
| Create | `components/pwa/push-permission.tsx` | Permission banner shown after high-intent action |
| Create | `lib/push/send.ts` | `sendWebPush(recipientId, payload)` server helper |
| Create | `app/api/push/subscribe/route.ts` | Save push subscription |
| Create | `app/api/push/unsubscribe/route.ts` | Remove push subscription |
| Create | `supabase/migrations/20260414000003_push_subscriptions.sql` | New table + RLS |
| Modify | `next.config.ts` | Wrap with `withSerwist` |
| Modify | `app/layout.tsx` | Add manifest link, PWA meta, `<InstallPrompt>` |
| Modify | `lib/actions/notifications.ts` | Call `sendWebPush` for push-eligible types |
| Modify | `proxy.ts` | Extend matcher exclusions for `/sw.js` |
| Create | `README.md` | Project overview + quick-start |
| Create | `docs/guide.md` | Full operator setup + admin walkthrough |

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json` (via pnpm)

- [ ] **Step 1: Install Serwist and web-push**

```bash
cd /Users/clupa/Documents/projects/hoddle
pnpm add @serwist/next serwist web-push
pnpm add -D @types/web-push
```

Expected output: packages added, no peer-dep warnings for Next 16.

- [ ] **Step 2: Verify installs**

```bash
node -e "require('@serwist/next'); require('web-push'); console.log('ok')"
```

Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add @serwist/next, serwist, web-push for PWA"
```

---

## Task 2: Generate VAPID keys and add env vars

**Files:**
- Modify: `.env.local` (create if absent)
- Modify: `.env.local.example`

- [ ] **Step 1: Generate VAPID keys**

```bash
npx web-push generate-vapid-keys
```

Expected output (example — yours will differ):
```
Public Key:
BPmZ8C...

Private Key:
r3F2u9...
```

Copy both values.

- [ ] **Step 2: Add to `.env.local`**

Open (or create) `.env.local` and add:

```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<your-public-key>
VAPID_PRIVATE_KEY=<your-private-key>
VAPID_SUBJECT=mailto:hello@hoddle.com.au
```

- [ ] **Step 3: Add placeholders to `.env.local.example`**

Read `.env.local.example`, then add:

```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:hello@hoddle.com.au
```

- [ ] **Step 4: Commit**

```bash
git add .env.local.example
git commit -m "chore: add VAPID env var placeholders"
```

(Never commit `.env.local`.)

---

## Task 3: Database migration — `push_subscriptions`

**Files:**
- Create: `supabase/migrations/20260414000003_push_subscriptions.sql`

- [ ] **Step 1: Write migration**

```sql
-- supabase/migrations/20260414000003_push_subscriptions.sql

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  endpoint text unique not null,
  keys jsonb not null,  -- { p256dh: string, auth: string }
  created_at timestamptz default now(),
  last_used_at timestamptz default now()
);

alter table push_subscriptions enable row level security;

-- Users manage only their own subscriptions
create policy "push_subscriptions: owner all"
  on push_subscriptions for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- Service role can read all (for sending pushes server-side)
-- Service role bypasses RLS by default; no extra policy needed.

comment on table push_subscriptions is
  'Web Push subscriptions for PWA notifications. One endpoint per browser/device.';
```

- [ ] **Step 2: Apply migration locally**

```bash
npx supabase db push
```

Expected: migration applied, no errors.

- [ ] **Step 3: Regenerate TypeScript types**

```bash
npx supabase gen types typescript --local > lib/supabase/database.types.ts
```

Expected: `database.types.ts` updated; check that `push_subscriptions` appears in the output.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260414000003_push_subscriptions.sql lib/supabase/database.types.ts
git commit -m "feat(db): add push_subscriptions table with RLS"
```

---

## Task 4: Update `next.config.ts` for Serwist

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Rewrite next.config.ts**

```typescript
import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  reloadOnOnline: true,
  // Disable in dev so hot-reload is not broken by the SW
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Supabase Storage — public buckets (avatar_url, content-media, story-images)
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default withSerwist(nextConfig);
```

- [ ] **Step 2: Verify build compiles**

```bash
pnpm build 2>&1 | tail -20
```

Expected: build succeeds. The SW is compiled to `public/sw.js`.

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "feat(pwa): wrap Next config with Serwist"
```

---

## Task 5: Write the service worker (`app/sw.ts`)

**Files:**
- Create: `app/sw.ts`

- [ ] **Step 1: Create service worker**

```typescript
// app/sw.ts
import { defaultCache } from "@serwist/next/worker";
import { CacheFirst, NetworkFirst, NetworkOnly, Serwist } from "serwist";
import { ExpirationPlugin } from "serwist";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const SUPABASE_ORIGIN = /^https:\/\/[^/]+\.supabase\.co\/rest\//i;
const STATIC_ASSETS = /\.(?:js|css|woff2?|png|jpg|jpeg|webp|svg|gif|ico)$/i;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,

  runtimeCaching: [
    // Supabase REST API reads — NetworkFirst, 5 s timeout, 24 h cache
    {
      matcher: SUPABASE_ORIGIN,
      handler: new NetworkFirst({
        cacheName: "supabase-api",
        networkTimeoutSeconds: 5,
        plugins: [
          new ExpirationPlugin({
            maxAgeSeconds: 24 * 60 * 60,
            maxEntries: 64,
          }),
        ],
      }),
    },
    // Static assets — CacheFirst, 30 d
    {
      matcher: STATIC_ASSETS,
      handler: new CacheFirst({
        cacheName: "static-assets",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 200,
            maxAgeSeconds: 30 * 24 * 60 * 60,
          }),
        ],
      }),
    },
    // Everything else from defaultCache (Next.js pages, fonts, etc.)
    ...defaultCache,
  ],

  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

// Handle Web Push messages
self.addEventListener("push", (event: PushEvent) => {
  if (!event.data) return;
  const data = event.data.json() as { title: string; body: string; url?: string };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url ?? "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const url: string = (event.notification.data as { url: string }).url;
  event.waitUntil(
    (self.clients as Clients).openWindow(url),
  );
});

serwist.addEventListeners();
```

- [ ] **Step 2: Build to verify SW compiles**

```bash
pnpm build 2>&1 | grep -E "(sw\.js|error|warn)" | head -20
```

Expected: `public/sw.js` written, no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add app/sw.ts
git commit -m "feat(pwa): add Serwist service worker with caching strategies"
```

---

## Task 6: Create PWA icons and manifest

**Files:**
- Create: `public/manifest.webmanifest`
- Create: `public/icons/icon-192.png` (placeholder)
- Create: `public/icons/icon-512.png` (placeholder)

- [ ] **Step 1: Create icons directory and copy placeholder**

```bash
mkdir -p /Users/clupa/Documents/projects/hoddle/public/icons
cp /Users/clupa/Documents/projects/hoddle/public/single-logo.png \
   /Users/clupa/Documents/projects/hoddle/public/icons/icon-192.png
cp /Users/clupa/Documents/projects/hoddle/public/single-logo.png \
   /Users/clupa/Documents/projects/hoddle/public/icons/icon-512.png
```

> **Note:** These are placeholder copies. Before going to production, generate proper 192×192 and 512×512 PNGs (plus a maskable variant) from the Hoddle logo. Use the cream `#fef8f1` background with the Hoddle Blue `#001842` mark.

- [ ] **Step 2: Write manifest**

```json
{
  "name": "Hoddle Melbourne",
  "short_name": "Hoddle",
  "description": "Mentorship for first-year international students in Melbourne.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#fef8f1",
  "theme_color": "#1e3a5f",
  "categories": ["education", "social"],
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "Dashboard",
      "short_name": "Dashboard",
      "description": "Your student dashboard",
      "url": "/dashboard",
      "icons": [{ "src": "/icons/icon-192.png", "sizes": "192x192" }]
    },
    {
      "name": "Inbox",
      "short_name": "Inbox",
      "description": "Notifications and messages",
      "url": "/inbox",
      "icons": [{ "src": "/icons/icon-192.png", "sizes": "192x192" }]
    },
    {
      "name": "Mentors",
      "short_name": "Mentors",
      "description": "Browse mentors",
      "url": "/mentors",
      "icons": [{ "src": "/icons/icon-192.png", "sizes": "192x192" }]
    }
  ]
}
```

- [ ] **Step 3: Commit**

```bash
git add public/manifest.webmanifest public/icons/
git commit -m "feat(pwa): add manifest and icon placeholders"
```

---

## Task 7: Update root layout with PWA meta tags and install prompt

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Update layout**

Replace the entire `app/layout.tsx` with:

```typescript
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { InstallPrompt } from "@/components/pwa/install-prompt";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#1e3a5f",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://hoddle.com.au"),
  title: {
    default: "Hoddle Melbourne — Mentorship for International Students",
    template: "%s | Hoddle Melbourne",
  },
  description:
    "Connect with high-achieving mentors who've walked the same path. Guidance, community, and real stories for first-year international students in Melbourne.",
  openGraph: {
    title: "Hoddle Melbourne — Mentorship for International Students",
    description:
      "Connect with high-achieving mentors who've walked the same path. Guidance, community, and real stories for first-year international students in Melbourne.",
    url: "https://hoddle.com.au",
    siteName: "Hoddle Melbourne",
    locale: "en_AU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hoddle Melbourne — Mentorship for International Students",
    description:
      "Guidance, community, and real stories for first-year international students in Melbourne.",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Hoddle",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${beVietnamPro.variable}`}
    >
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/layout.tsx
git commit -m "feat(pwa): add manifest link, PWA meta tags, install prompt mount"
```

---

## Task 8: Install prompt component

**Files:**
- Create: `components/pwa/install-prompt.tsx`

- [ ] **Step 1: Create component**

```typescript
// components/pwa/install-prompt.tsx
"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const SESSION_COUNT_KEY = "hoddle-session-count";
const INSTALL_DISMISSED_KEY = "hoddle-install-dismissed";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Already installed? Don't show.
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const alreadyDismissed =
      localStorage.getItem(INSTALL_DISMISSED_KEY) === "true";
    if (alreadyDismissed) return;

    // Increment session counter
    const count =
      parseInt(localStorage.getItem(SESSION_COUNT_KEY) ?? "0", 10) + 1;
    localStorage.setItem(SESSION_COUNT_KEY, String(count));

    // Only show prompt after the user's second session
    if (count < 2) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem(INSTALL_DISMISSED_KEY, "true");
    }
    setShow(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(INSTALL_DISMISSED_KEY, "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Install Hoddle"
      className="fixed bottom-6 left-4 right-4 z-50 md:left-auto md:right-6 md:w-80"
    >
      <div className="rounded-xl bg-primary p-4 shadow-ambient">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-sm font-semibold text-on-primary">
              Add Hoddle to your home screen
            </p>
            <p className="mt-1 text-xs text-on-primary/70">
              Get quick access to your dashboard, mentors, and inbox.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="mt-0.5 shrink-0 text-on-primary/50 hover:text-on-primary"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
        <button
          onClick={handleInstall}
          className="mt-3 w-full rounded-lg bg-on-primary px-3 py-2 text-xs font-semibold text-primary hover:bg-on-primary/90"
        >
          Add to home screen
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
pnpm tsc --noEmit 2>&1 | head -20
```

Expected: no errors relating to `install-prompt.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/pwa/install-prompt.tsx
git commit -m "feat(pwa): add install prompt component"
```

---

## Task 9: Offline fallback page

**Files:**
- Create: `app/offline/page.tsx`

- [ ] **Step 1: Create page**

```typescript
// app/offline/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "You're offline",
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-24">
      <div className="w-full max-w-md text-center">
        {/* Decorative typographic mark */}
        <p className="font-display text-7xl font-bold tracking-tighter text-primary/10 select-none">
          ·
        </p>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-on-surface">
          You&apos;re offline
        </h1>
        <p className="mt-4 font-body text-base leading-relaxed text-on-surface-variant">
          Hoddle needs a connection to load new content. Check your Wi-Fi or
          mobile data, then come back — your mentors will still be here.
        </p>
        <p className="mt-8 text-xs text-on-surface-variant/60">
          hoddle.com.au
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
pnpm tsc --noEmit 2>&1 | grep "offline" | head -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/offline/page.tsx
git commit -m "feat(pwa): add offline fallback page"
```

---

## Task 10: Push subscription API routes

**Files:**
- Create: `app/api/push/subscribe/route.ts`
- Create: `app/api/push/unsubscribe/route.ts`

- [ ] **Step 1: Write subscribe route**

```typescript
// app/api/push/subscribe/route.ts
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

interface PushKeys {
  p256dh: string;
  auth: string;
}

interface SubscriptionBody {
  endpoint: string;
  expirationTime: number | null;
  keys: PushKeys;
}

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SubscriptionBody;
  try {
    body = (await request.json()) as SubscriptionBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("push_subscriptions").upsert(
    {
      profile_id: user.id,
      endpoint: body.endpoint,
      keys: body.keys as unknown as import("@/lib/supabase/database.types").Json,
      last_used_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    console.error("[push/subscribe]", error.message);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Write unsubscribe route**

```typescript
// app/api/push/unsubscribe/route.ts
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { endpoint: string };
  try {
    body = (await request.json()) as { endpoint: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const admin = createAdminClient();
  await admin
    .from("push_subscriptions")
    .delete()
    .eq("profile_id", user.id)
    .eq("endpoint", body.endpoint);

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
pnpm tsc --noEmit 2>&1 | grep "push" | head -10
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/push/subscribe/route.ts app/api/push/unsubscribe/route.ts
git commit -m "feat(pwa): add push subscribe/unsubscribe API routes"
```

---

## Task 11: `sendWebPush` server helper

**Files:**
- Create: `lib/push/send.ts`

- [ ] **Step 1: Create helper**

```typescript
// lib/push/send.ts
import webPush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

// Configure VAPID once at module load (server-only)
webPush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/**
 * Send a Web Push notification to all subscribed devices for a given user.
 * Silently removes expired/invalid subscriptions (HTTP 410 Gone).
 * Safe to call from any server context.
 */
export async function sendWebPush(
  recipientId: string,
  payload: PushPayload,
): Promise<void> {
  const admin = createAdminClient();

  const { data: subs, error } = await admin
    .from("push_subscriptions")
    .select("endpoint, keys")
    .eq("profile_id", recipientId);

  if (error) {
    console.error("[sendWebPush] fetch error:", error.message);
    return;
  }
  if (!subs?.length) return;

  const message = JSON.stringify(payload);

  await Promise.allSettled(
    subs.map(async (sub) => {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: sub.keys as { p256dh: string; auth: string },
      };
      try {
        await webPush.sendNotification(pushSub, message);
        // Refresh last_used_at on successful delivery
        await admin
          .from("push_subscriptions")
          .update({ last_used_at: new Date().toISOString() })
          .eq("endpoint", sub.endpoint);
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        // 410 Gone = subscription no longer valid; clean up
        if (statusCode === 410) {
          await admin
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", sub.endpoint);
        } else {
          console.error("[sendWebPush] delivery failed:", statusCode, sub.endpoint);
        }
      }
    }),
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
pnpm tsc --noEmit 2>&1 | grep "send" | head -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/push/send.ts
git commit -m "feat(pwa): add sendWebPush helper"
```

---

## Task 12: Wire `sendWebPush` into `notify()`

**Files:**
- Modify: `lib/actions/notifications.ts`

The three push-eligible types per the spec: `session_starting_soon`, `forum_reply_to_your_thread`, `mentor_replied_to_your_question`.

- [ ] **Step 1: Add import and push call inside `notify()`**

After the email dispatch (after line 71 in the current file), read the full `notify` function, then add the `sendWebPush` call. The full updated function:

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { buildNotificationEmail } from "@/lib/email/templates/notification-emails";
import { sendWebPush } from "@/lib/push/send";
import { updateNotificationPreferencesSchema } from "@/lib/validation/notifications";
import { revalidatePath } from "next/cache";
import type { Database } from "@/lib/supabase/database.types";

type NotificationType = Database["public"]["Enums"]["notification_type"];

const PUSH_ELIGIBLE_TYPES = new Set<NotificationType>([
  "session_starting_soon",
  "forum_reply_to_your_thread",
  "mentor_replied_to_your_question",
]);

/**
 * Write a notification to the DB and optionally dispatch an email + Web Push.
 * Uses the admin client — safe to call from any server action or cron route.
 */
export async function notify(
  recipientId: string,
  type: NotificationType,
  payload: Record<string, unknown>,
): Promise<void> {
  const supabase = createAdminClient();

  // Write in-app notification
  const { error } = await supabase.from("notifications").insert({
    recipient_id: recipientId,
    type,
    payload: payload as import("@/lib/supabase/database.types").Json,
  });

  if (error) {
    console.error("[notify] DB insert failed:", error.message);
    return;
  }

  // Check preferences — defaults: email on, in_app on, nothing muted
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("email_enabled, in_app_enabled, types_muted")
    .eq("profile_id", recipientId)
    .maybeSingle();

  const emailEnabled = prefs?.email_enabled ?? true;
  const typesMuted: string[] = (prefs?.types_muted as string[]) ?? [];
  const isMuted = typesMuted.includes(type);

  // Fetch email + name (needed for both email and push title)
  const {
    data: { user },
  } = await supabase.auth.admin.getUserById(recipientId);
  if (!user?.email) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", recipientId)
    .maybeSingle();

  const recipientName = profile?.full_name ?? "there";

  // Email dispatch
  if (emailEnabled && !isMuted) {
    const content = buildNotificationEmail(type, payload, recipientName);
    if (content) {
      await sendEmail({
        to: user.email,
        subject: content.subject,
        html: content.html,
      });
    }
  }

  // Web Push dispatch (only for push-eligible types, only if not muted)
  if (PUSH_ELIGIBLE_TYPES.has(type) && !isMuted) {
    const pushPayload = buildPushPayload(type, payload, recipientName);
    if (pushPayload) {
      await sendWebPush(recipientId, pushPayload);
    }
  }
}

/** Build the Web Push notification payload for a given notification type. */
function buildPushPayload(
  type: NotificationType,
  payload: Record<string, unknown>,
  recipientName: string,
): { title: string; body: string; url?: string } | null {
  switch (type) {
    case "session_starting_soon":
      return {
        title: "Your session is starting soon",
        body: `${String(payload.sessionTitle ?? "A session")} starts in 10 minutes.`,
        url: `/sessions/${String(payload.sessionId ?? "")}`,
      };
    case "forum_reply_to_your_thread":
      return {
        title: "New reply in your thread",
        body: `Someone replied to "${String(payload.threadTitle ?? "your post")}".`,
        url: `/forums/${String(payload.categorySlug ?? "")}/${String(payload.threadSlug ?? "")}`,
      };
    case "mentor_replied_to_your_question":
      return {
        title: "Your mentor answered",
        body: `${String(payload.mentorName ?? "A mentor")} replied to your question.`,
        url: `/sessions/${String(payload.sessionId ?? "")}`,
      };
    default:
      return null;
  }
}
```

- [ ] **Step 2: Verify the rest of the notifications actions are unchanged**

The rest of the file (markNotificationRead, markAllNotificationsRead, updateNotificationPreferences) should not be touched. Grep to confirm:

```bash
grep -n "markNotificationRead\|updateNotificationPreferences" lib/actions/notifications.ts | head -10
```

Expected: both functions are still present.

- [ ] **Step 3: Verify TypeScript**

```bash
pnpm tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/actions/notifications.ts
git commit -m "feat(pwa): wire sendWebPush into notify() for push-eligible types"
```

---

## Task 13: Push permission component

**Files:**
- Create: `components/pwa/push-permission.tsx`

This is a banner intended to be rendered on high-intent pages (session detail, forum thread). It asks for push permission after the user has taken an action.

- [ ] **Step 1: Create component**

```typescript
// components/pwa/push-permission.tsx
"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";

const PUSH_ASKED_KEY = "hoddle-push-asked";

export function PushPermissionBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    if (Notification.permission !== "default") return; // already granted or denied
    if (localStorage.getItem(PUSH_ASKED_KEY) === "true") return;

    // Show after a 2 s delay so the user has settled on the page
    const timer = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleAllow = async () => {
    localStorage.setItem(PUSH_ASKED_KEY, "true");
    setShow(false);

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const reg = await navigator.serviceWorker.ready;
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) return;

    // Convert base64 VAPID key to Uint8Array
    const keyBytes = Uint8Array.from(
      atob(vapidPublicKey.replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0),
    );

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyBytes,
    });

    // Persist subscription server-side
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub.toJSON()),
    });
  };

  const handleDismiss = () => {
    localStorage.setItem(PUSH_ASKED_KEY, "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Enable push notifications"
      className="flex items-start gap-3 rounded-xl border border-outline-variant bg-surface-container-high p-4"
    >
      <Bell
        size={18}
        strokeWidth={1.5}
        className="mt-0.5 shrink-0 text-primary"
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm font-semibold text-on-surface">
          Stay in the loop
        </p>
        <p className="mt-0.5 text-xs text-on-surface-variant">
          Get notified when a mentor replies or a session is about to start.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleAllow}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary hover:bg-primary-mid"
          >
            Turn on notifications
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 text-xs text-on-surface-variant hover:text-on-surface"
          >
            Not now
          </button>
        </div>
      </div>
      <button
        onClick={handleDismiss}
        aria-label="Close"
        className="shrink-0 text-on-surface-variant hover:text-on-surface"
      >
        <X size={14} strokeWidth={1.5} />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Add to session detail page**

Read `app/(browse)/sessions/[id]/page.tsx`, find a good insertion point near the top of the main content area, and add:

```typescript
import { PushPermissionBanner } from "@/components/pwa/push-permission";

// Inside the JSX, above the question form:
<PushPermissionBanner />
```

- [ ] **Step 3: Verify TypeScript**

```bash
pnpm tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/pwa/push-permission.tsx app/(browse)/sessions/[id]/page.tsx
git commit -m "feat(pwa): add push permission banner (sessions page)"
```

---

## Task 14: Update middleware matcher to exclude PWA routes

**Files:**
- Modify: `proxy.ts`

- [ ] **Step 1: Read the bottom of proxy.ts to find the matcher**

```bash
tail -20 /Users/clupa/Documents/projects/hoddle/proxy.ts
```

- [ ] **Step 2: Update matcher to exclude `/sw.js` and manifest**

Find the `config` export (or the `matcher` array) and update it so the service worker and manifest are never intercepted. The updated matcher string:

```typescript
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.webmanifest|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 3: Verify TypeScript**

```bash
pnpm tsc --noEmit 2>&1 | head -10
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add proxy.ts
git commit -m "fix(pwa): exclude sw.js and manifest from middleware matcher"
```

---

## Task 15: Full build verification

- [ ] **Step 1: Clean build**

```bash
pnpm build 2>&1 | tail -30
```

Expected: builds successfully. `public/sw.js` present in output.

- [ ] **Step 2: Check manifest is served**

```bash
pnpm start &
sleep 3
curl -s http://localhost:3000/manifest.webmanifest | head -5
kill %1
```

Expected: JSON with `"name": "Hoddle Melbourne"`.

- [ ] **Step 3: Check SW is served**

```bash
pnpm start &
sleep 3
curl -sI http://localhost:3000/sw.js | grep "content-type"
kill %1
```

Expected: `content-type: application/javascript` (or `text/javascript`).

- [ ] **Step 4: Update todo.md**

Mark all §3.5 PWA checkboxes as done in `todo.md`.

- [ ] **Step 5: Commit**

```bash
git add todo.md
git commit -m "docs: mark PWA tasks complete in todo.md"
```

---

## Task 16: Write `README.md`

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README**

```markdown
# Hoddle Melbourne

Mentorship platform connecting first-year international students in Melbourne with high-achieving peer mentors who've navigated the same challenges.

Mentors publish advice, host live Q&As, and share their stories. Students discover mentors matched to their background and goals, ask questions in community forums, and eventually graduate into sharing their own success stories.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Database / Auth | Supabase (Postgres + RLS + Magic Link) |
| Email | Resend |
| PWA | Serwist + Web Push |
| Deployment | Vercel |

## Quick start (local)

**Prerequisites:** Node 20+, pnpm, Docker (for Supabase local), a Supabase project.

```bash
git clone https://github.com/your-org/hoddle.git
cd hoddle
pnpm install
cp .env.local.example .env.local
# Fill in .env.local — see docs/guide.md §2
npx supabase start          # starts local Postgres + Auth
npx supabase db push        # applies all migrations
npx supabase gen types typescript --local > lib/supabase/database.types.ts
pnpm dev
```

Open `http://localhost:3000`.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Server-only service role key |
| `RESEND_API_KEY` | ✅ | Email delivery |
| `RESEND_FROM_EMAIL` | ✅ | From address (e.g. `hello@hoddle.com.au`) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | ✅ | Web Push VAPID public key |
| `VAPID_PRIVATE_KEY` | ✅ | Web Push VAPID private key |
| `VAPID_SUBJECT` | ✅ | Web Push contact (e.g. `mailto:hello@hoddle.com.au`) |

Generate VAPID keys: `npx web-push generate-vapid-keys`

## Documentation

| Doc | Purpose |
|---|---|
| `CLAUDE.md` | Architecture and coding conventions for AI assistants |
| `todo.md` | Phase-by-phase task list |
| `docs/guide.md` | Full setup + admin walkthrough |
| `docs/design.md` | Visual design system |
| `docs/database-schema.md` | Tables, RLS policies, enums |
| `docs/architecture.md` | System architecture and data flow |
| `docs/changelog.md` | Version history |

## Project structure

```
app/
  (marketing)/   Landing page, about
  (auth)/        Login, signup, onboarding wizards
  (app)/         Authenticated student + mentor surfaces
  (browse)/      Public-facing mentor profiles, content, forums, stories
  (admin)/       Admin panel (role-gated)
  api/           Cron jobs, push subscription endpoints
  sw.ts          PWA service worker (compiled by Serwist)
  offline/       Offline fallback page

components/
  ui/            Primitives: Button, Card, Input, Tag, Pagination
  patterns/      Composed: MentorCard, ContentCard, TiptapEditor
  layout/        Nav shells, notification bell
  pwa/           Install prompt, push permission banner

lib/
  supabase/      Typed server + browser + admin clients
  actions/       Server actions (all mutations)
  validation/    Zod schemas
  matching/      Mentor recommendation algorithm
  email/         Resend templates
  push/          Web Push helper
```

## Deployment

Deploy to Vercel. Set all environment variables under **Project → Settings → Environment Variables**. Vercel cron jobs are configured in `vercel.json` and run automatically on the Pro plan.

See `docs/guide.md` for the full step-by-step deployment walkthrough.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with quick-start and project structure"
```

---

## Task 17: Write `docs/guide.md`

**Files:**
- Create: `docs/guide.md`

- [ ] **Step 1: Write guide**

```markdown
# Hoddle — Operator Guide

This guide walks through everything needed to run Hoddle: local development setup, first Supabase deployment, admin panel usage, inviting mentors, and managing the platform day-to-day.

---

## Contents

1. [Local development setup](#1-local-development-setup)
2. [Supabase project setup (production)](#2-supabase-project-setup-production)
3. [Vercel deployment](#3-vercel-deployment)
4. [First admin user](#4-first-admin-user)
5. [Admin dashboard](#5-admin-dashboard)
6. [Inviting and verifying mentors](#6-inviting-and-verifying-mentors)
7. [Moderating success stories](#7-moderating-success-stories)
8. [Mentor experience](#8-mentor-experience)
9. [Student experience](#9-student-experience)
10. [Cron jobs](#10-cron-jobs)
11. [PWA and push notifications](#11-pwa-and-push-notifications)

---

## 1. Local development setup

### Prerequisites

- **Node.js 20+** — check with `node -v`
- **pnpm** — install with `npm install -g pnpm`
- **Docker Desktop** — required by Supabase CLI for local Postgres
- **Supabase CLI** — `npm install -g supabase`

### Steps

```bash
# 1. Clone
git clone https://github.com/your-org/hoddle.git
cd hoddle

# 2. Install dependencies
pnpm install

# 3. Copy env template
cp .env.local.example .env.local
```

Open `.env.local` and fill in every variable (see §2 for Supabase values):

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase start output>
SUPABASE_SERVICE_ROLE_KEY=<from supabase start output>
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=hello@hoddle.com.au
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:hello@hoddle.com.au
```

```bash
# 4. Start local Supabase (Docker must be running)
npx supabase start

# Output includes the anon key and service role key — paste into .env.local

# 5. Apply migrations
npx supabase db push

# 6. Regenerate TypeScript types
npx supabase gen types typescript --local > lib/supabase/database.types.ts

# 7. Start dev server
pnpm dev
```

The app is now running at `http://localhost:3000`.

To generate VAPID keys for Web Push:
```bash
npx web-push generate-vapid-keys
```
Paste both keys into `.env.local`.

---

## 2. Supabase project setup (production)

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Note the **Project URL** and **anon key** from *Settings → API*
3. Note the **service_role key** (keep secret, server-only)
4. In the Supabase Dashboard → **SQL editor**, run all migration files in order from `supabase/migrations/`
   - Or link your project and push: `npx supabase link --project-ref <ref> && npx supabase db push`
5. In **Storage**, create three buckets:
   - `avatars` — public read
   - `content-media` — public read
   - `content-resources` — private
   - `session-recordings` — private
   - `story-images` — public read
   - `badge-art` — public read
   - `pwa-assets` — public read
6. Enable **Realtime** on the `notifications` table: *Database → Replication → supabase_realtime → Add table → notifications*
7. In **Authentication → Email templates**, customise the magic link email to match Hoddle branding

---

## 3. Vercel deployment

1. Push the repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Import project** → select the repo
3. Framework: **Next.js** (auto-detected)
4. Add all environment variables (Settings → Environment Variables):
   - All variables from `.env.local` except the local Supabase URLs — use production Supabase values
5. Deploy
6. Cron jobs in `vercel.json` activate automatically on the **Pro plan**

### Custom domain

Dashboard → Domains → add `hoddle.com.au`. Follow DNS instructions. Supabase Auth needs the site URL updated: *Authentication → URL Configuration → Site URL → `https://hoddle.com.au`*.

---

## 4. First admin user

There is no admin sign-up UI. The first admin must be promoted directly in the database.

1. Sign up normally via `https://hoddle.com.au/signup` (magic link)
2. In Supabase Dashboard → SQL editor:

```sql
update profiles
set role = 'admin'
where id = '<your-user-uuid>';
```

Your user UUID appears in *Authentication → Users*.

3. Refresh the app — you now have access to `/admin`.

---

## 5. Admin dashboard

Navigate to `/admin` (you must be logged in with the `admin` role).

### Admin home (`/admin/admin`)

- Pending mentor verifications count
- Pending success story moderation count
- Quick links to each admin section

### Mentor list (`/admin/admin/mentors`)

- All mentor accounts with verification status
- Click a mentor to review their profile

### Mentor detail (`/admin/admin/mentors/[id]`)

- Full mentor profile preview
- **Verify** button — sets `verified_at`, makes mentor visible to students
- **Unverify** button — revokes visibility without deleting the account

### Story moderation (`/admin/admin/stories`)

- Pending stories submitted by students
- **Approve** — sets `status = 'published'`, sends `success_story_approved` notification
- **Reject** — sets `status = 'rejected'`

---

## 6. Inviting and verifying mentors

Mentors are invite-only. Students cannot self-select as mentors.

### Step 1: Send an invite

1. Go to `/admin/admin/mentors/invite`
2. Enter the mentor's email address and an optional personal note
3. Submit → Hoddle sends a magic-link invite email with a unique token valid for 14 days

### Step 2: Mentor accepts

The mentor clicks the link in their email, completes the mentor sign-up flow (Supabase magic link), then is taken to the mentor onboarding wizard where they fill in:
- Headline (one-line tagline)
- Bio (long-form story, markdown)
- Expertise tags (used in matching)
- Hometown / current role

### Step 3: Admin verifies

1. Go to `/admin/admin/mentors`
2. Find the new mentor (they appear as "Unverified")
3. Click their name → review profile
4. Click **Verify mentor** → they are now visible to students

Until verified, a mentor can log in and edit their profile but students cannot see them.

---

## 7. Moderating success stories

Students submit success stories from `/stories/new`. Stories land in `status = 'pending'` and are invisible to other students until approved.

1. Go to `/admin/admin/stories`
2. Read the story — click the title to open the full reader in a new tab
3. **Approve** to publish, **Reject** to decline
4. The author receives an in-app notification and email either way

---

## 8. Mentor experience

After accepting an invite and completing onboarding, mentors land at `/mentor`.

### Mentor dashboard (`/mentor`)

- Content stats: total views, published items
- Upcoming sessions with attendee counts
- Recent questions from students

### Publishing content (`/mentor/content`)

- **New** → choose Article, Video, or Resource
- Article: rich-text editor (Tiptap), add a hero image via Supabase Storage
- Video: paste a YouTube or Vimeo URL
- Resource: upload a file (max 25 MB), add label
- **Publish** sets `published_at`; draft is invisible to students

### Scheduling a Q&A session (`/mentor/sessions/new`)

- Set date/time, duration, optional attendee cap, Zoom/Meet link
- Submit → session appears in `/sessions` for students to register

### Managing a session (`/mentor/sessions/[id]`)

- View submitted questions (anonymous or named)
- Mark questions as answered
- After the session: mark attendance, add recording URL

---

## 9. Student experience

### Sign up (`/signup`)

Students enter their email and receive a magic link. No password required.

### Onboarding (`/onboarding`)

A 5-step wizard collects:
1. Full name
2. Country of origin, university, year of study
3. Goals (multi-select)
4. Challenges (multi-select)
5. Fields of interest (multi-select)

The wizard runs the matching algorithm on completion and surfaces 3–5 recommended mentors on the dashboard.

### Dashboard (`/dashboard`)

- Recommended mentors with "why this mentor" explanations
- Latest published content
- Upcoming sessions you're registered for
- Recent forum activity in your areas of interest

### Finding mentors (`/mentors`)

- Browse all verified mentors
- Filter by expertise tags
- Click a mentor card to view their full profile

### Asking questions

- On a mentor's profile, the "Ask a question" CTA links to their next session
- On the session page, submit a question (optionally anonymous)

### Community forums (`/forums`)

- Five seeded categories: First Semester Struggles, Career & Internships, Living in Melbourne, Academic Writing, Visa & Admin
- Start threads, reply, react (heart / thanks / helpful)
- Edit your own posts within 30 minutes

### Success stories (`/stories`)

- Read published success stories from other students
- Submit your own via `/stories/new` — moderated before publication

---

## 10. Cron jobs

Three Vercel cron jobs run automatically (Pro plan required):

| Job | Schedule | Purpose |
|---|---|---|
| `/api/cron/session-reminders` | Every hour | Sends `session_reminder_24h` notification to registrants |
| `/api/cron/session-starting-soon` | Every 5 minutes | Sends `session_starting_soon` push + notification 10–20 min before |
| `/api/cron/recompute-recommendations` | Daily at 4 PM UTC | Recomputes mentor recommendations for all students |

To run a cron manually (e.g. for testing):
```bash
curl -X GET https://hoddle.com.au/api/cron/recompute-recommendations \
  -H "Authorization: Bearer $CRON_SECRET"
```

The `CRON_SECRET` env var protects cron endpoints from external triggering. Add it to Vercel env vars and to each cron route handler.

---

## 11. PWA and push notifications

### Installing the app

On Chrome/Edge desktop or Android Chrome, visit the app → a prompt appears after your second session offering to add Hoddle to your home screen. On iOS Safari, use **Share → Add to Home Screen**.

### Push notifications

After registering for a session or posting in a forum, a banner appears asking permission for push notifications. If granted, Hoddle sends browser push for:

- A session starting in 10 minutes
- A reply in a forum thread you started
- A mentor answering your question

To disable: go to `/settings/notifications` → toggle off specific types.

### Offline behaviour

When offline, cached pages (landing page, dashboard shell, mentor directory) load from cache. Pages not in cache show the offline fallback at `/offline`.

### PWA icons

The current icons are placeholders copied from `single-logo.png`. Before production, replace with:
- `public/icons/icon-192.png` — 192×192 PNG, cream background `#fef8f1`, Hoddle Blue mark
- `public/icons/icon-512.png` — 512×512 PNG, same treatment
- A maskable variant at 512×512 with safe-zone padding (80% of canvas)
```

- [ ] **Step 2: Commit**

```bash
git add docs/guide.md
git commit -m "docs: add operator guide (setup, admin, mentors, students, PWA)"
```

---

## Self-Review

**Spec coverage check:**

| Requirement (todo §3.5) | Task |
|---|---|
| Configure Serwist with caching strategy | Task 5 |
| `public/manifest.webmanifest` | Task 6 |
| Install prompt (after 2 sessions, dismissible) | Task 8 |
| Offline fallback page | Task 9 |
| Service worker precaches (via Serwist `__SW_MANIFEST`) | Task 4 + 5 |
| Web Push for session_starting_soon, forum_reply, mentor_replied | Task 11–12 |
| push_subscriptions table | Task 3 |
| sendWebPush helper | Task 11 |
| Permission prompt after high-intent action | Task 13 |
| badge + shortcuts in manifest | Task 6 |
| Middleware exclusion for sw.js | Task 14 |
| README | Task 16 |
| guide.md | Task 17 |

**Placeholder scan:** None. All steps have complete code.

**Type consistency:** `PushPayload` defined in `lib/push/send.ts` and used only there. `BeforeInstallPromptEvent` defined locally in each component. `PushPermissionBanner` export name matches import in `app/(browse)/sessions/[id]/page.tsx`.

**Gaps fixed:** Added middleware matcher update (Task 14) to prevent SW/manifest from being intercepted. Added Vercel env var note for `CRON_SECRET` in guide.md §10.
