# Feedback System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a floating UX feedback widget to every page that posts category + message submissions to an Airtable base, auto-capturing the current page URL and user identity.

**Architecture:** A Zod-validated server action calls the Airtable REST API server-side (API key never exposed to the browser). A `'use client'` floating widget component collects the form and calls the action. The widget is mounted in the three existing layout files so it appears on every page without per-page duplication.

**Tech Stack:** Next.js App Router, TypeScript strict, Zod, Airtable REST API (`fetch`), Tailwind CSS v4 design tokens, sonner (already installed for toasts).

---

## File Map

| Status | File | Purpose |
|---|---|---|
| Modify | `.env.example` | Add `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, `AIRTABLE_FEEDBACK_TABLE_ID` |
| Create | `lib/validation/feedback.ts` | Zod schema for feedback input |
| Create | `lib/actions/feedback.ts` | `submitFeedback` server action — validates + POSTs to Airtable |
| Create | `components/patterns/feedback-widget.tsx` | Floating button + popover form (client component) |
| Modify | `app/(app)/layout.tsx` | Mount `<FeedbackWidget>` with `userId` + `userEmail` |
| Modify | `app/(browse)/layout.tsx` | Mount `<FeedbackWidget>` when user is authenticated |
| Modify | `app/(marketing)/layout.tsx` | Fetch user + mount `<FeedbackWidget>` when signed in |

---

## Task 1: Add env vars to `.env.example`

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Add Airtable env vars**

Open `.env.example` and append the following block after the existing content:

```
# Airtable — UX feedback widget
# Create a Personal Access Token at https://airtable.com/create/tokens
# with scope: data.records:write
# Base ID is in the Airtable URL: https://airtable.com/{BASE_ID}/...
# Table ID (or table name) is in the URL when you open the table.
AIRTABLE_API_KEY=your-airtable-personal-access-token
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
AIRTABLE_FEEDBACK_TABLE_ID=tblXXXXXXXXXXXXXX
```

- [ ] **Step 2: Verify build is unaffected**

```bash
pnpm build
```

Expected: build passes (no TS errors, same as before — we haven't imported the env vars yet).

- [ ] **Step 3: Commit**

```bash
git add .env.example
git commit -m "chore: add Airtable env vars to .env.example"
```

---

## Task 2: Zod validation schema

**Files:**
- Create: `lib/validation/feedback.ts`

- [ ] **Step 1: Create the schema file**

```ts
// lib/validation/feedback.ts
import { z } from "zod";

export const feedbackSchema = z.object({
  category: z.enum(["Bug", "Suggestion", "Confusion", "Other"]),
  message: z
    .string()
    .min(1, "Please enter a message.")
    .max(1000, "Message must be 1000 characters or fewer."),
  pageUrl: z.string().url("Invalid page URL."),
  userId: z.string().uuid("Invalid user ID."),
  userEmail: z.string().email("Invalid email."),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;
```

- [ ] **Step 2: Verify TypeScript accepts it**

```bash
pnpm build
```

Expected: build passes with zero new errors.

- [ ] **Step 3: Commit**

```bash
git add lib/validation/feedback.ts
git commit -m "feat: add Zod schema for feedback input"
```

---

## Task 3: Server action

**Files:**
- Create: `lib/actions/feedback.ts`

- [ ] **Step 1: Create the server action**

```ts
// lib/actions/feedback.ts
"use server";

import { feedbackSchema } from "@/lib/validation/feedback";

export async function submitFeedback(
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const { category, message, pageUrl, userId, userEmail } = parsed.data;

  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableId = process.env.AIRTABLE_FEEDBACK_TABLE_ID;

  if (!apiKey || !baseId || !tableId) {
    return { ok: false, error: "Feedback service is not configured." };
  }

  let res: Response;
  try {
    res = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          Category: category,
          Message: message,
          "Page URL": pageUrl,
          "User ID": userId,
          "User Email": userEmail,
          "Submitted At": new Date().toISOString(),
        },
      }),
    });
  } catch {
    return { ok: false, error: "Failed to submit feedback." };
  }

  if (!res.ok) {
    return { ok: false, error: "Failed to submit feedback." };
  }

  return { ok: true };
}
```

- [ ] **Step 2: Verify TypeScript accepts it**

```bash
pnpm build
```

Expected: build passes with zero new errors.

- [ ] **Step 3: Commit**

```bash
git add lib/actions/feedback.ts
git commit -m "feat: add submitFeedback server action (Airtable)"
```

---

## Task 4: Feedback widget component

**Files:**
- Create: `components/patterns/feedback-widget.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/patterns/feedback-widget.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitFeedback } from "@/lib/actions/feedback";

type Category = "Bug" | "Suggestion" | "Confusion" | "Other";

const CATEGORIES: Category[] = ["Bug", "Suggestion", "Confusion", "Other"];

interface FeedbackWidgetProps {
  userId: string;
  userEmail: string;
}

export function FeedbackWidget({ userId, userEmail }: FeedbackWidgetProps) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Category | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleOpen() {
    setOpen((v) => !v);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !message.trim()) return;
    setLoading(true);
    const result = await submitFeedback({
      category,
      message: message.trim(),
      pageUrl: window.location.href,
      userId,
      userEmail,
    });
    setLoading(false);
    if (result.ok) {
      toast.success("Thanks for your feedback");
      setOpen(false);
      setCategory(null);
      setMessage("");
    } else {
      toast.error("Something went wrong — try again");
    }
  }

  const canSubmit = category !== null && message.trim().length > 0 && !loading;

  return (
    <div ref={panelRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Popover panel */}
      {open && (
        <div
          className="w-80 rounded-xl p-5 bg-surface-container"
          style={{ boxShadow: "0 12px 40px rgba(0, 24, 66, 0.10)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="font-display text-sm font-semibold text-on-surface tracking-wide">
              Share feedback
            </p>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close feedback panel"
              className="text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Category pills */}
            <div className="flex flex-wrap gap-2" role="group" aria-label="Feedback category">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  disabled={loading}
                  aria-pressed={category === cat}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium font-body transition-colors",
                    category === cat
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest",
                    loading && "opacity-50 cursor-not-allowed",
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Message */}
            <Textarea
              placeholder="Tell us what you noticed…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={1000}
              disabled={loading}
              className="min-h-[96px] text-sm"
              aria-label="Feedback message"
            />

            {/* Submit */}
            <Button
              type="submit"
              size="sm"
              disabled={!canSubmit}
              className="self-end"
            >
              {loading ? (
                <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
              ) : (
                "Send"
              )}
            </Button>
          </form>
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={handleOpen}
        aria-label="Open feedback panel"
        aria-expanded={open}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-full",
          "bg-primary text-on-primary",
          "font-body text-sm font-medium",
          "transition-all duration-200",
          "hover:shadow-[0_12px_40px_rgba(0,24,66,0.18)] hover:-translate-y-px",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        )}
      >
        <MessageSquare size={15} strokeWidth={1.5} />
        Feedback
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript accepts it**

```bash
pnpm build
```

Expected: build passes with zero new errors.

- [ ] **Step 3: Commit**

```bash
git add components/patterns/feedback-widget.tsx
git commit -m "feat: add FeedbackWidget floating component"
```

---

## Task 5: Wire into `app/(app)/layout.tsx`

**Files:**
- Modify: `app/(app)/layout.tsx`

The `(app)` layout already has `user.id` and `user.email` from the existing Supabase auth call. We just need to import the widget and render it.

- [ ] **Step 1: Add the widget**

Replace the full file content with:

```tsx
// app/(app)/layout.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/layout/app-nav";
import { QueryProvider } from "@/components/providers/query-provider";
import { FeedbackWidget } from "@/components/patterns/feedback-widget";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { count: unreadCount }] = await Promise.all([
    supabase
      .from("profiles")
      .select("onboarded_at, full_name, avatar_url, role")
      .eq("id", user.id)
      .single(),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .is("read_at", null),
  ]);

  if (!profile?.onboarded_at) {
    if (profile?.role === "mentor") {
      redirect("/mentor-onboarding");
    }
    redirect("/onboarding");
  }

  return (
    <QueryProvider>
      <AppNav
        userName={profile?.full_name ?? "You"}
        avatarUrl={profile?.avatar_url}
        userId={user.id}
        initialUnreadCount={unreadCount ?? 0}
      />
      {children}
      <FeedbackWidget userId={user.id} userEmail={user.email ?? ""} />
    </QueryProvider>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
pnpm build
```

Expected: build passes, `app/(app)` routes still compile cleanly.

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/layout.tsx
git commit -m "feat: mount FeedbackWidget in app layout"
```

---

## Task 6: Wire into `app/(browse)/layout.tsx`

**Files:**
- Modify: `app/(browse)/layout.tsx`

The browse layout already fetches the user optionally. We render the widget only when the user is authenticated.

- [ ] **Step 1: Add the widget**

Replace the full file content with:

```tsx
// app/(browse)/layout.tsx
import { createClient } from "@/lib/supabase/server";
import { BrowseNav } from "@/components/layout/browse-nav";
import { FeedbackWidget } from "@/components/patterns/feedback-widget";

export default async function BrowseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let navUser: {
    name: string;
    avatarUrl?: string | null;
    userId: string;
    unreadCount: number;
  } | null = null;

  if (user) {
    const [{ data: profile }, { count: unreadCount }] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", user.id)
        .is("read_at", null),
    ]);

    if (profile) {
      navUser = {
        name: profile.full_name ?? "You",
        avatarUrl: profile.avatar_url,
        userId: user.id,
        unreadCount: unreadCount ?? 0,
      };
    }
  }

  return (
    <>
      <BrowseNav user={navUser} />
      {children}
      {user && (
        <FeedbackWidget userId={user.id} userEmail={user.email ?? ""} />
      )}
    </>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
pnpm build
```

Expected: build passes.

- [ ] **Step 3: Commit**

```bash
git add app/\(browse\)/layout.tsx
git commit -m "feat: mount FeedbackWidget in browse layout"
```

---

## Task 7: Wire into `app/(marketing)/layout.tsx`

**Files:**
- Modify: `app/(marketing)/layout.tsx`

The marketing layout currently does nothing (no user fetch). We add a user check and render the widget only when signed in.

- [ ] **Step 1: Add the widget**

Replace the full file content with:

```tsx
// app/(marketing)/layout.tsx
import { createClient } from "@/lib/supabase/server";
import { FeedbackWidget } from "@/components/patterns/feedback-widget";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      {children}
      {user && (
        <FeedbackWidget userId={user.id} userEmail={user.email ?? ""} />
      )}
    </>
  );
}
```

- [ ] **Step 2: Verify full build**

```bash
pnpm build
```

Expected: build passes cleanly across all routes.

- [ ] **Step 3: Final commit**

```bash
git add app/\(marketing\)/layout.tsx
git commit -m "feat: mount FeedbackWidget in marketing layout"
```

---

## Task 8: Manual smoke test checklist

Run the dev server and verify:

```bash
pnpm dev
```

- [ ] Widget floating button appears bottom-right on an authenticated page (`/dashboard`)
- [ ] Widget floating button appears bottom-right on a browse page (`/content`)
- [ ] Widget does NOT appear when signed out on a marketing page (`/`)
- [ ] Widget DOES appear when signed in on a marketing page (`/about`)
- [ ] Clicking "Feedback" opens the popover above the button
- [ ] Clicking outside the popover closes it
- [ ] Submit button is disabled until both a category and message are provided
- [ ] Submitting (with real Airtable creds in `.env.local`) creates a record in Airtable with correct fields
- [ ] Success shows sonner toast "Thanks for your feedback" and closes the panel
- [ ] Popover resets (no leftover category or message) after a successful submission
