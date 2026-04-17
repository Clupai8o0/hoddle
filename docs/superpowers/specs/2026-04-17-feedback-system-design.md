# Feedback System — Design Spec
_Date: 2026-04-17_

## Overview

A global UX feedback widget that floats on every page of Hoddle. Users pick a category, type a message, and submit. Submissions go to an Airtable base for the internal team to review. Page URL and user identity are captured automatically.

---

## Airtable Setup

**Base:** "Hoddle Feedback"
**Table:** "Submissions"

| Field | Airtable Type |
|---|---|
| Category | Single select: `Bug`, `Suggestion`, `Confusion`, `Other` |
| Message | Long text |
| Page URL | URL |
| User ID | Single line text |
| User Email | Email |
| Submitted At | Date (ISO 8601) |

**Environment variables required:**
- `AIRTABLE_API_KEY` — personal access token with `data.records:write` scope
- `AIRTABLE_BASE_ID` — the base ID from the Airtable URL
- `AIRTABLE_FEEDBACK_TABLE_ID` — the table ID (or name) within the base

These go in `.env.local.example` and Vercel environment variables. Never exposed to the client.

---

## Server Action

**File:** `lib/actions/feedback.ts`
**Action:** `submitFeedback(input: FeedbackInput): Promise<{ ok: true } | { ok: false; error: string }>`

**Zod schema** (`lib/validation/feedback.ts`):
```ts
{ category: z.enum(['Bug', 'Suggestion', 'Confusion', 'Other']), message: z.string().min(1).max(1000), pageUrl: z.string().url(), userId: z.string().uuid(), userEmail: z.string().email() }
```

**Flow:**
1. Validate input with Zod schema — return `{ ok: false, error }` on failure
2. POST to `https://api.airtable.com/v0/{baseId}/{tableId}` with `Authorization: Bearer {apiKey}`
3. Body: `{ fields: { Category, Message, "Page URL", "User ID", "User Email", "Submitted At" } }`
4. Return `{ ok: true }` on 200, `{ ok: false, error: 'Failed to submit feedback' }` on any non-200

The API key lives only in the server action. Never imported in client components.

---

## Widget Component

**File:** `components/patterns/feedback-widget.tsx`
**Type:** `'use client'`

**Props:**
```ts
{ userId: string; userEmail: string }
```

**Behaviour:**
- Fixed floating button at `bottom-6 right-6`, `z-50`, Hoddle Blue (`bg-primary text-on-primary`), small rounded pill with a label "Feedback"
- On click: toggles a compact card/popover anchored above the button
- Popover contains:
  1. Four pill category buttons: Bug / Suggestion / Confusion / Other (single-select, one must be chosen)
  2. Textarea for message (max 1000 chars)
  3. Submit button (disabled until category selected and message non-empty)
- On submit: calls `submitFeedback` server action with form values + `window.location.pathname` as `pageUrl` + `userId` + `userEmail`
- On success: closes popover, fires sonner toast "Thanks for your feedback"
- On error: fires sonner toast "Something went wrong — try again"
- Loading state: submit button shows spinner, inputs disabled

**Design tokens used:** `bg-primary`, `text-on-primary`, `bg-surface-container`, `text-on-surface`, `bg-surface-container-high` for selected category pill. Shadow: `0 12px 40px rgba(0, 24, 66, 0.10)`.

---

## Placement in Layouts

The widget is added to three server-layout files. Each layout fetches the current user from Supabase (already done for nav rendering) and passes `userId` and `userEmail` as props to `<FeedbackWidget>`.

| Layout file | Audience |
|---|---|
| `app/(app)/layout.tsx` | Authenticated students + mentors |
| `app/(browse)/layout.tsx` | Browse pages |
| `app/(marketing)/layout.tsx` | Public marketing pages |

For marketing pages where there may be no authenticated user, the widget is omitted (render only when `userId` is present).

---

## Error Handling

- Zod validation failure → return `{ ok: false, error }`, show inline form error
- Airtable API non-200 → return `{ ok: false, error: 'Failed to submit feedback' }`, show sonner error toast
- Network failure → same error toast
- No retry logic — if it fails, the user sees the toast and can try again manually

---

## Out of Scope

- Admin view inside Hoddle — team reads feedback directly in Airtable
- Feedback on unauthenticated pages from logged-out users — widget is hidden for guests
- Attachments or screenshots
- Rate limiting (Airtable's 5 req/sec is sufficient for feedback volume at this stage)
