# Anonymous Forum Questions & Answers — Design Spec
_Date: 2026-04-17_

## Overview

Allow authenticated users to post forum threads and replies anonymously. Their real identity is always stored server-side for moderation; it is never exposed to other users in the UI. Mentors cannot post anonymously. The feature mirrors the existing `session_questions.anonymous` pattern already in the codebase.

---

## 1. Database

**Migration — add `is_anonymous` to forum tables:**

```sql
alter table forum_threads add column is_anonymous boolean not null default false;
alter table forum_posts   add column is_anonymous boolean not null default false;
```

- `author_id` remains non-nullable on both tables. The real identity is always persisted for moderation purposes.
- No RLS changes. Identity masking is handled in the application layer.
- Regenerate types after migration: `npx supabase gen types typescript --local > lib/supabase/database.types.ts`

---

## 2. Validation (`lib/validation/forum.ts`)

Add `is_anonymous: z.boolean().default(false)` to:
- `newThreadSchema`
- `newPostSchema`

Export updated `NewThreadInput` and `NewPostInput` types.

---

## 3. Server Actions (`lib/actions/forums.ts`)

**`createThread`:** pass `is_anonymous: parsed.data.is_anonymous` to the Supabase insert.

**`createPost`:** pass `is_anonymous` to the insert, but enforce mentor guard:
```ts
// Mentors cannot post anonymously
const isAnonymous = isMentor ? false : parsed.data.is_anonymous;
```
Fetch the posting user's role from `profiles` before the insert to perform this check.

Notification logic is unaffected — `author_id` is always available server-side; the replier's real name is used for the notification payload sent to the thread author.

---

## 4. Data-fetching layer (`app/(browse)/forums/[category]/[thread]/page.tsx`)

After fetching thread and posts data, apply identity masking before passing to components:

**For the thread author (used in `AuthorByline`):**
```ts
const viewerIsThreadAuthor = user?.id === threadData.author_id;
const maskedThreadProfiles = threadData.is_anonymous && !viewerIsThreadAuthor
  ? null
  : threadData.profiles;
const isAnonymousThread = threadData.is_anonymous;
```

The `PostRow` type gains `is_anonymous: boolean`.

**For each post:**
```ts
const maskedPosts = typedPosts.map(post => ({
  ...post,
  isAnonymous: post.is_anonymous,
  profiles: post.is_anonymous && user?.id !== post.author_id ? null : post.profiles,
}));
```

The `isOwn` check (`user?.id === post.author_id`) is computed before masking and is unaffected.

---

## 5. UI — Forms

### `NewThreadForm`
- Add `is_anonymous` boolean field (default `false`) to `react-hook-form`
- Add `isMentor: boolean` prop
- Render a checkbox below the body textarea, before the submit buttons:
  - Label: *"Post anonymously — your name won't be shown to other students"*
  - Hidden when `isMentor` is true

**Pages that render `NewThreadForm`** (`app/(browse)/forums/new/page.tsx` and `app/(browse)/forums/[category]/new/page.tsx`) must fetch the user's role and pass it down:
```ts
const { data: profile } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", user.id)
  .single();
const isMentor = profile?.role === "mentor";
```

### `ReplyForm`
- Add `is_anonymous` boolean field (default `false`)
- Add `isMentor: boolean` prop
- Render a small checkbox inline in the sticky bar, to the left of the send button
- Hidden when `isMentor` is true

**Thread page** (`app/(browse)/forums/[category]/[thread]/page.tsx`) must also fetch and pass `isMentor` to `ReplyForm` using the same `profiles.role` query.

---

## 6. UI — Display

### `AuthorByline` (thread header)
Receives a new `isAnonymous: boolean` and `isOwn: boolean` prop:
- `isAnonymous && !isOwn` → show generic placeholder avatar + name "Anonymous"
- `isAnonymous && isOwn` → show generic placeholder avatar + name "Anonymous (you)"
- Otherwise → existing behaviour

### `RegularPost`
Receives `isAnonymous: boolean` (already derivable from the masked post object):
- `isAnonymous && !isOwn` → avatar placeholder + "Anonymous"
- `isAnonymous && isOwn` → avatar placeholder + "Anonymous (you)"

### `MentorPost`
No changes. Mentors cannot post anonymously.

### Avatar placeholder for anonymous posts
Use a `div` with the same sizing classes as the existing initials fallback, but show a generic user silhouette or the letter "A" — no initials derived from a real name.

---

## 7. Constraints & edge cases

- **Edit/delete ownership:** unaffected — `author_id` is always present server-side; `isOwn` is computed before masking.
- **Reactions:** unaffected — reactions are on `forum_posts.id`, not tied to author identity.
- **Notifications:** the `forum_reply_to_your_thread` notification still fires and uses the replier's real name. The anonymous thread author receives the notification normally (their identity is known server-side).
- **Mentor guard:** enforced both client-side (checkbox hidden) and server-side (action forces `is_anonymous = false` if poster is a mentor).
- **No admin reveal UI in this scope** — admin can query `author_id` directly from the database. A UI reveal feature is Phase 3 (`admin_actions` audit log already supports `'reveal_anonymous_author'`).

---

## 8. Files touched

| File | Change |
|---|---|
| `supabase/migrations/YYYYMMDD_anonymous_forum_posts.sql` | New migration |
| `lib/supabase/database.types.ts` | Regenerated |
| `lib/validation/forum.ts` | Add `is_anonymous` to thread + post schemas |
| `lib/actions/forums.ts` | Pass `is_anonymous`; mentor guard in `createPost` |
| `app/(browse)/forums/[category]/[thread]/page.tsx` | Masking logic; pass `isAnonymous`/`isOwn` to components |
| `app/(browse)/forums/new/new-thread-form.tsx` | Anonymous checkbox; `isMentor` prop |
| `app/(browse)/forums/[category]/[thread]/reply-form.tsx` | Anonymous checkbox; `isMentor` prop |
