# Anonymous Forum Posts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow authenticated users to post forum threads and replies anonymously; their real identity is always stored server-side and stripped in the API layer before reaching the client.

**Architecture:** Add `is_anonymous boolean not null default false` to `forum_threads` and `forum_posts`. The server data-fetching layer nulls out the `profiles` join when `is_anonymous = true` and the viewer is not the author. Forms gain an "Post anonymously" checkbox hidden for mentors. Mentors are guarded server-side too.

**Tech Stack:** Next.js 15 App Router, Supabase Postgres, react-hook-form + zod, TypeScript strict, Tailwind CSS v4.

**Spec:** `docs/superpowers/specs/2026-04-17-anonymous-forum-posts-design.md`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `supabase/migrations/20260417000004_anonymous_forum_posts.sql` | Create | DB columns |
| `lib/supabase/database.types.ts` | Regenerate | Type sync after migration |
| `lib/validation/forum.ts` | Modify | Add `is_anonymous` to schemas |
| `lib/actions/forums.ts` | Modify | Pass flag; mentor guard |
| `app/(browse)/forums/[category]/[thread]/page.tsx` | Modify | Masking logic; `isMentor` fetch |
| `app/(browse)/forums/new/new-thread-form.tsx` | Modify | Anonymous checkbox |
| `app/(browse)/forums/new/page.tsx` | Modify | Fetch role, pass `isMentor` |
| `app/(browse)/forums/[category]/new/page.tsx` | Modify | Fetch role, pass `isMentor` |
| `app/(browse)/forums/[category]/[thread]/reply-form.tsx` | Modify | Anonymous checkbox |

---

## Task 1: Database migration

**Files:**
- Create: `supabase/migrations/20260417000004_anonymous_forum_posts.sql`

- [ ] **Step 1: Write the migration file**

Create `supabase/migrations/20260417000004_anonymous_forum_posts.sql` with:

```sql
-- Add anonymous posting to forums
alter table public.forum_threads
  add column if not exists is_anonymous boolean not null default false;

alter table public.forum_posts
  add column if not exists is_anonymous boolean not null default false;
```

- [ ] **Step 2: Apply the migration**

```bash
npx supabase db push
```

Expected: migration applies without error.

- [ ] **Step 3: Regenerate types**

```bash
npx supabase gen types typescript --local > lib/supabase/database.types.ts
```

Expected: `lib/supabase/database.types.ts` is updated. Verify `forum_threads` and `forum_posts` rows now include `is_anonymous: boolean` in the generated types.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260417000004_anonymous_forum_posts.sql lib/supabase/database.types.ts
git commit -m "feat: add is_anonymous column to forum_threads and forum_posts"
```

---

## Task 2: Update validation schemas

**Files:**
- Modify: `lib/validation/forum.ts`

- [ ] **Step 1: Add `is_anonymous` to both schemas**

Open `lib/validation/forum.ts`. The file currently looks like:

```ts
import { z } from "zod";

export const newThreadSchema = z.object({
  title: z
    .string()
    .min(10, "Title must be at least 10 characters")
    .max(200, "Title must be under 200 characters"),
  body: z
    .string()
    .min(20, "Body must be at least 20 characters")
    .max(10000, "Body must be under 10,000 characters"),
  category_slug: z.string().min(1, "Please select a category"),
});

export const newPostSchema = z.object({
  thread_id: z.string().uuid(),
  body: z
    .string()
    .min(1, "Reply cannot be empty")
    .max(5000, "Reply must be under 5,000 characters"),
  parent_post_id: z.string().uuid().optional(),
});
```

Replace with:

```ts
import { z } from "zod";

export const newThreadSchema = z.object({
  title: z
    .string()
    .min(10, "Title must be at least 10 characters")
    .max(200, "Title must be under 200 characters"),
  body: z
    .string()
    .min(20, "Body must be at least 20 characters")
    .max(10000, "Body must be under 10,000 characters"),
  category_slug: z.string().min(1, "Please select a category"),
  is_anonymous: z.boolean().default(false),
});

export const newPostSchema = z.object({
  thread_id: z.string().uuid(),
  body: z
    .string()
    .min(1, "Reply cannot be empty")
    .max(5000, "Reply must be under 5,000 characters"),
  parent_post_id: z.string().uuid().optional(),
  is_anonymous: z.boolean().default(false),
});

export const editPostSchema = z.object({
  id: z.string().uuid(),
  body: z
    .string()
    .min(1, "Post cannot be empty")
    .max(5000, "Post must be under 5,000 characters"),
});

export const reactionSchema = z.object({
  post_id: z.string().uuid(),
  reaction: z.enum(["heart", "thanks", "helpful"]),
});

export type NewThreadInput = z.infer<typeof newThreadSchema>;
export type NewPostInput = z.infer<typeof newPostSchema>;
export type EditPostInput = z.infer<typeof editPostSchema>;
export type ReactionInput = z.infer<typeof reactionSchema>;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/validation/forum.ts
git commit -m "feat: add is_anonymous field to forum thread and post schemas"
```

---

## Task 3: Update server actions

**Files:**
- Modify: `lib/actions/forums.ts`

- [ ] **Step 1: Update `createThread` to pass `is_anonymous` with mentor guard**

In `lib/actions/forums.ts`, find the `createThread` function. After the `userId` check:

```ts
  const userId = await getCurrentUserId(supabase);
  if (!userId) return { ok: false, error: "Not authenticated." };
```

Add a role fetch:

```ts
  const userId = await getCurrentUserId(supabase);
  if (!userId) return { ok: false, error: "Not authenticated." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  const isMentor = profile?.role === "mentor";
```

Then find the insert block:

```ts
  const { data: thread, error } = await supabase
    .from("forum_threads")
    .insert({
      title: parsed.data.title,
      body: parsed.data.body,
      category_slug: parsed.data.category_slug,
      author_id: userId,
      slug,
    })
```

Replace with:

```ts
  const { data: thread, error } = await supabase
    .from("forum_threads")
    .insert({
      title: parsed.data.title,
      body: parsed.data.body,
      category_slug: parsed.data.category_slug,
      author_id: userId,
      slug,
      is_anonymous: isMentor ? false : parsed.data.is_anonymous,
    })
```

- [ ] **Step 2: Update `createPost` to pass `is_anonymous` with mentor guard**

In `createPost`, find the rate limit block and the insert:

```ts
  const { error } = await supabase.from("forum_posts").insert({
    thread_id: parsed.data.thread_id,
    author_id: userId,
    body: parsed.data.body,
    parent_post_id: parsed.data.parent_post_id ?? null,
  });
```

Replace the entire `createPost` function body (after the `userId` check) by adding a role lookup before the thread lock check, and updating the insert. The full updated function:

```ts
export async function createPost(
  input: unknown,
  threadPath: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = newPostSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const supabase = await createClient();
  const userId = await getCurrentUserId(supabase);
  if (!userId) return { ok: false, error: "Not authenticated." };

  // Fetch role to enforce mentor cannot post anonymously
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  const isMentor = profile?.role === "mentor";

  const { data: thread } = await supabase
    .from("forum_threads")
    .select("locked")
    .eq("id", parsed.data.thread_id)
    .is("deleted_at", null)
    .single();

  if (!thread) return { ok: false, error: "Thread not found." };
  if (thread.locked) return { ok: false, error: "This thread is locked." };

  // Rate limit: max 10 posts per 10 minutes
  const limit = await checkRateLimit({
    supabase,
    table: "forum_posts",
    userColumn: "author_id",
    userId,
    windowMinutes: 10,
    maxCount: 10,
    label: "forum posts",
  });
  if (!limit.allowed) return { ok: false, error: limit.error };

  // Fetch thread for notification — need title, slug, category, and original author
  const { data: threadFull } = await supabase
    .from("forum_threads")
    .select("title, slug, category_slug, author_id")
    .eq("id", parsed.data.thread_id)
    .single();

  const { error } = await supabase.from("forum_posts").insert({
    thread_id: parsed.data.thread_id,
    author_id: userId,
    body: parsed.data.body,
    parent_post_id: parsed.data.parent_post_id ?? null,
    is_anonymous: isMentor ? false : parsed.data.is_anonymous,
  });

  if (error) return { ok: false, error: "Failed to post reply." };

  // Notify thread author if they didn't post this reply themselves
  if (threadFull && threadFull.author_id !== userId) {
    const { data: replierProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();

    void notify(threadFull.author_id, "forum_reply_to_your_thread", {
      thread_title: threadFull.title,
      thread_slug: threadFull.slug,
      category_slug: threadFull.category_slug,
      replier_name: replierProfile?.full_name ?? "Someone",
    });
  }

  revalidatePath(threadPath);

  return { ok: true };
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/actions/forums.ts
git commit -m "feat: pass is_anonymous in forum actions; enforce mentor cannot post anonymously"
```

---

## Task 4: Masking logic in thread page

**Files:**
- Modify: `app/(browse)/forums/[category]/[thread]/page.tsx`

- [ ] **Step 1: Add `is_anonymous` to `PostRow` type and extend with masking fields**

At the top of `page.tsx`, find the `PostRow` type:

```ts
type PostRow = {
  id: string;
  body: string;
  created_at: string;
  edited_at: string | null;
  parent_post_id: string | null;
  author_id: string;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
  forum_reactions: { reaction: "heart" | "thanks" | "helpful"; profile_id: string }[];
};
```

Replace with:

```ts
type PostRow = {
  id: string;
  body: string;
  created_at: string;
  edited_at: string | null;
  parent_post_id: string | null;
  author_id: string;
  is_anonymous: boolean;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
  forum_reactions: { reaction: "heart" | "thanks" | "helpful"; profile_id: string }[];
  // Set by masking logic — not from DB
  isAnonymous?: boolean;
};
```

- [ ] **Step 2: Add `is_anonymous` to the select queries**

Find the `forum_threads` select in `ThreadPage`:

```ts
    supabase
      .from("forum_threads")
      .select(
        `id, slug, title, body, category_slug, pinned, locked, created_at, last_activity_at,
         author_id,
         profiles!forum_threads_author_id_fkey(full_name, avatar_url)`,
      )
```

Replace with:

```ts
    supabase
      .from("forum_threads")
      .select(
        `id, slug, title, body, category_slug, pinned, locked, is_anonymous, created_at, last_activity_at,
         author_id,
         profiles!forum_threads_author_id_fkey(full_name, avatar_url)`,
      )
```

Find the `forum_posts` select:

```ts
  const { data: posts } = await supabase
    .from("forum_posts")
    .select(
      `id, body, created_at, edited_at, parent_post_id, author_id,
       profiles!forum_posts_author_id_fkey(full_name, avatar_url),
       forum_reactions(reaction, profile_id)`,
    )
```

Replace with:

```ts
  const { data: posts } = await supabase
    .from("forum_posts")
    .select(
      `id, body, created_at, edited_at, parent_post_id, author_id, is_anonymous,
       profiles!forum_posts_author_id_fkey(full_name, avatar_url),
       forum_reactions(reaction, profile_id)`,
    )
```

- [ ] **Step 3: Add role fetch and masking logic in the page component**

In the `ThreadPage` component, after the line:

```ts
  const {
    data: { user },
  } = await supabase.auth.getUser();
```

Add a role fetch:

```ts
  const { data: userProfile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };
  const isMentor = userProfile?.role === "mentor";
```

- [ ] **Step 4: Apply masking after posts are fetched**

Find this line in the page component:

```ts
  const typedPosts = (posts ?? []) as unknown as PostRow[];
```

Replace with:

```ts
  const rawPosts = (posts ?? []) as unknown as PostRow[];

  // Mask anonymous post author identity from non-owners
  const typedPosts = rawPosts.map((post) => ({
    ...post,
    isAnonymous: post.is_anonymous,
    profiles:
      post.is_anonymous && user?.id !== post.author_id ? null : post.profiles,
  }));
```

- [ ] **Step 5: Mask thread author for anonymous threads**

Find:

```ts
  const threadAuthor = threadData.profiles as {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
```

Replace with:

```ts
  const viewerIsThreadAuthor = user?.id === threadData.author_id;
  const threadAuthor =
    threadData.is_anonymous && !viewerIsThreadAuthor
      ? null
      : (threadData.profiles as {
          full_name: string | null;
          avatar_url: string | null;
        } | null);
  const isAnonymousThread = !!threadData.is_anonymous;
```

- [ ] **Step 6: Pass `isAnonymous`/`isOwn` to `AuthorByline` and `isMentor` to `ReplyForm`**

Find the `AuthorByline` usage:

```tsx
          <AuthorByline profile={threadAuthor} />
```

Replace with:

```tsx
          <AuthorByline
            profile={threadAuthor}
            isAnonymous={isAnonymousThread}
            isOwn={viewerIsThreadAuthor}
          />
```

Find the `ReplyForm` usage:

```tsx
      <ReplyForm
        threadId={threadData.id}
        threadPath={threadPath}
        locked={threadData.locked}
        isAuthenticated={!!user}
      />
```

Replace with:

```tsx
      <ReplyForm
        threadId={threadData.id}
        threadPath={threadPath}
        locked={threadData.locked}
        isAuthenticated={!!user}
        isMentor={isMentor}
      />
```

- [ ] **Step 7: Pass `isAnonymous` to `RegularPost` in the render loop**

Find the `RegularPost` usage inside `topLevel.map`:

```tsx
                ) : (
                  <RegularPost
                    post={post}
                    reactionCounts={reactionCounts}
                    currentUserId={user?.id}
                    threadPath={threadPath}
                    isOwn={isOwn}
                  />
                )}
```

Replace with:

```tsx
                ) : (
                  <RegularPost
                    post={post}
                    reactionCounts={reactionCounts}
                    currentUserId={user?.id}
                    threadPath={threadPath}
                    isOwn={isOwn}
                    isAnonymous={post.isAnonymous ?? false}
                  />
                )}
```

Also update the nested replies `RegularPost` (inside the `postReplies.map`):

```tsx
                      <RegularPost
                        key={reply.id}
                        post={reply}
                        reactionCounts={replyReactions}
                        currentUserId={user?.id}
                        threadPath={threadPath}
                        isOwn={user?.id === reply.author_id}
                        compact
                      />
```

Replace with:

```tsx
                      <RegularPost
                        key={reply.id}
                        post={reply}
                        reactionCounts={replyReactions}
                        currentUserId={user?.id}
                        threadPath={threadPath}
                        isOwn={user?.id === reply.author_id}
                        compact
                        isAnonymous={reply.isAnonymous ?? false}
                      />
```

- [ ] **Step 8: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: errors about `AuthorByline`, `RegularPost`, `ReplyForm` missing new props. That's expected — those components are updated in the next tasks. Continue.

- [ ] **Step 9: Commit (partial — will finish compiling after component updates)**

```bash
git add app/\(browse\)/forums/\[category\]/\[thread\]/page.tsx
git commit -m "feat: add identity masking for anonymous forum posts in thread page"
```

---

## Task 5: Update `AuthorByline` component

**Files:**
- Modify: `app/(browse)/forums/[category]/[thread]/page.tsx` (the `AuthorByline` sub-component at the bottom of the same file)

- [ ] **Step 1: Update `AuthorByline` props and rendering**

Find the `AuthorByline` function:

```tsx
function AuthorByline({
  profile,
}: {
  profile: { full_name: string | null; avatar_url: string | null } | null;
}) {
  const initials = (profile?.full_name ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-4">
      {profile?.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.avatar_url}
          alt={profile.full_name ?? ""}
          className="w-12 h-12 rounded-full object-cover"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center font-display font-bold text-on-surface-variant">
          {initials}
        </div>
      )}
      <div>
        <p className="font-display font-bold text-on-surface">
          {profile?.full_name ?? "Unknown"}
        </p>
      </div>
    </div>
  );
}
```

Replace with:

```tsx
function AuthorByline({
  profile,
  isAnonymous = false,
  isOwn = false,
}: {
  profile: { full_name: string | null; avatar_url: string | null } | null;
  isAnonymous?: boolean;
  isOwn?: boolean;
}) {
  if (isAnonymous) {
    return (
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center font-display font-bold text-on-surface-variant">
          A
        </div>
        <div>
          <p className="font-display font-bold text-on-surface">
            {isOwn ? "Anonymous (you)" : "Anonymous"}
          </p>
        </div>
      </div>
    );
  }

  const initials = (profile?.full_name ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-4">
      {profile?.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.avatar_url}
          alt={profile.full_name ?? ""}
          className="w-12 h-12 rounded-full object-cover"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center font-display font-bold text-on-surface-variant">
          {initials}
        </div>
      )}
      <div>
        <p className="font-display font-bold text-on-surface">
          {profile?.full_name ?? "Unknown"}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update `PostProps` type and `RegularPost` component**

Find the `PostProps` type:

```tsx
type PostProps = {
  post: PostRow;
  reactionCounts: { reaction: "heart" | "thanks" | "helpful"; count: number; userReacted: boolean }[];
  currentUserId: string | undefined;
  threadPath: string;
  isOwn: boolean;
  compact?: boolean;
};
```

Replace with:

```tsx
type PostProps = {
  post: PostRow;
  reactionCounts: { reaction: "heart" | "thanks" | "helpful"; count: number; userReacted: boolean }[];
  currentUserId: string | undefined;
  threadPath: string;
  isOwn: boolean;
  compact?: boolean;
  isAnonymous?: boolean;
};
```

Find the `RegularPost` function signature and avatar/name block:

```tsx
function RegularPost({
  post,
  reactionCounts,
  currentUserId,
  threadPath,
  isOwn,
  compact = false,
}: PostProps) {
  const profile = post.profiles as {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  const initials = (profile?.full_name ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`flex gap-4 p-6 bg-surface-container-low rounded-2xl ${compact ? "p-4" : ""}`}
    >
      {profile?.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.avatar_url}
          alt={profile.full_name ?? ""}
          className={`${compact ? "w-8 h-8" : "w-10 h-10"} rounded-full object-cover shrink-0`}
        />
      ) : (
        <div
          className={`${compact ? "w-8 h-8" : "w-10 h-10"} rounded-full bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-on-surface-variant shrink-0`}
        >
          {initials}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-2">
          <span className="font-display font-bold text-on-surface text-sm">
            {profile?.full_name ?? "Unknown"}
          </span>
```

Replace with:

```tsx
function RegularPost({
  post,
  reactionCounts,
  currentUserId,
  threadPath,
  isOwn,
  compact = false,
  isAnonymous = false,
}: PostProps) {
  const profile = post.profiles as {
    full_name: string | null;
    avatar_url: string | null;
  } | null;

  const displayName = isAnonymous
    ? isOwn
      ? "Anonymous (you)"
      : "Anonymous"
    : (profile?.full_name ?? "Unknown");

  const initials = isAnonymous
    ? "A"
    : (profile?.full_name ?? "?")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

  return (
    <div
      className={`flex gap-4 p-6 bg-surface-container-low rounded-2xl ${compact ? "p-4" : ""}`}
    >
      {!isAnonymous && profile?.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.avatar_url}
          alt={profile.full_name ?? ""}
          className={`${compact ? "w-8 h-8" : "w-10 h-10"} rounded-full object-cover shrink-0`}
        />
      ) : (
        <div
          className={`${compact ? "w-8 h-8" : "w-10 h-10"} rounded-full bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-on-surface-variant shrink-0`}
        >
          {initials}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-2">
          <span className="font-display font-bold text-on-surface text-sm">
            {displayName}
          </span>
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: remaining errors only for `ReplyForm` and `NewThreadForm` missing new props — those are fixed in the next tasks.

- [ ] **Step 4: Commit**

```bash
git add app/\(browse\)/forums/\[category\]/\[thread\]/page.tsx
git commit -m "feat: display Anonymous label for anonymous forum posts and threads"
```

---

## Task 6: Update `ReplyForm` with anonymous checkbox

**Files:**
- Modify: `app/(browse)/forums/[category]/[thread]/reply-form.tsx`

- [ ] **Step 1: Rewrite `ReplyForm` with `isMentor` prop and anonymous checkbox**

Replace the entire file content with:

```tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { newPostSchema, type NewPostInput } from "@/lib/validation/forum";
import { createPost } from "@/lib/actions/forums";

interface ReplyFormProps {
  threadId: string;
  threadPath: string;
  locked: boolean;
  isAuthenticated: boolean;
  isMentor: boolean;
}

export function ReplyForm({ threadId, threadPath, locked, isAuthenticated, isMentor }: ReplyFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm<NewPostInput>({
    resolver: zodResolver(newPostSchema),
    defaultValues: { thread_id: threadId, body: "", is_anonymous: false },
  });

  const bodyValue = watch("body");

  async function onSubmit(data: NewPostInput) {
    setServerError(null);
    const result = await createPost(data, threadPath);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    reset({ thread_id: threadId, body: "", is_anonymous: false });
  }

  if (locked) {
    return (
      <div className="fixed bottom-0 left-0 w-full bg-surface/95 backdrop-blur-md border-t border-surface-variant/20 px-6 py-4 z-40">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm text-on-surface-variant font-body text-center py-2">
            This thread is locked.
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="fixed bottom-0 left-0 w-full bg-surface/95 backdrop-blur-md border-t border-surface-variant/20 px-6 py-4 z-40">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <p className="font-body text-sm text-on-surface-variant">
            Join the discussion — sign in to reply.
          </p>
          <a
            href="/login"
            className="font-body text-sm font-semibold text-primary hover:underline shrink-0"
          >
            Sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 w-full bg-surface/95 backdrop-blur-md border-t border-surface-variant/20 px-6 py-4 z-40">
      <div className="max-w-3xl mx-auto">
        {serverError && (
          <p className="text-xs text-error font-body mb-2">{serverError}</p>
        )}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex items-end gap-4"
        >
          <input type="hidden" {...register("thread_id")} />
          <div className="flex-1 relative">
            <textarea
              {...register("body")}
              rows={1}
              placeholder="Share your experience or ask a follow-up…"
              className="w-full bg-surface-container-high rounded-2xl px-6 py-4 font-body text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none min-h-[56px] border-0"
            />
            {bodyValue.length > 4000 && (
              <span className="absolute bottom-2 right-4 text-[10px] text-on-surface-variant font-body">
                {bodyValue.length}/5,000
              </span>
            )}
          </div>

          {!isMentor && (
            <label className="flex items-center gap-2 shrink-0 cursor-pointer select-none mb-1">
              <input
                type="checkbox"
                {...register("is_anonymous")}
                className="w-4 h-4 rounded accent-primary"
              />
              <span className="font-body text-xs text-on-surface-variant whitespace-nowrap">
                Post anonymously
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={isSubmitting || bodyValue.trim().length === 0}
            aria-label="Send reply"
            className="bg-primary text-on-primary w-14 h-14 rounded-2xl flex items-center justify-center shadow-ambient hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none shrink-0"
          >
            <Send strokeWidth={1.5} className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors (or only `NewThreadForm` prop error if that task isn't done yet).

- [ ] **Step 3: Commit**

```bash
git add app/\(browse\)/forums/\[category\]/\[thread\]/reply-form.tsx
git commit -m "feat: add anonymous checkbox to forum reply form"
```

---

## Task 7: Update `NewThreadForm` with anonymous checkbox

**Files:**
- Modify: `app/(browse)/forums/new/new-thread-form.tsx`

- [ ] **Step 1: Add `isMentor` prop and anonymous checkbox**

Replace the entire file content with:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { newThreadSchema, type NewThreadInput } from "@/lib/validation/forum";
import { createThread } from "@/lib/actions/forums";
import { Button } from "@/components/ui/button";

type CategoryOption = { slug: string; name: string };

interface NewThreadFormProps {
  categories: CategoryOption[];
  defaultCategory?: string;
  isMentor: boolean;
}

export function NewThreadForm({
  categories,
  defaultCategory,
  isMentor,
}: NewThreadFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<NewThreadInput>({
    resolver: zodResolver(newThreadSchema),
    defaultValues: {
      category_slug: defaultCategory ?? "",
      title: "",
      body: "",
      is_anonymous: false,
    },
  });

  const bodyValue = watch("body");
  const titleValue = watch("title");

  async function onSubmit(data: NewThreadInput) {
    setServerError(null);
    const result = await createThread(data);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    router.push(`/forums/${result.category}/${result.slug}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Category */}
      <div className="space-y-2">
        <label
          htmlFor="category_slug"
          className="block font-body text-sm font-semibold text-on-surface"
        >
          Category <span className="text-error">*</span>
        </label>
        <select
          id="category_slug"
          {...register("category_slug")}
          className="w-full bg-surface-container-low rounded-xl px-4 py-3 font-body text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 border-0"
        >
          <option value="">Select a category…</option>
          {categories.map((cat) => (
            <option key={cat.slug} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
        {errors.category_slug && (
          <p className="text-sm text-error font-body">
            {errors.category_slug.message}
          </p>
        )}
      </div>

      {/* Title */}
      <div className="space-y-2">
        <div className="flex items-end justify-between">
          <label
            htmlFor="title"
            className="block font-body text-sm font-semibold text-on-surface"
          >
            Title <span className="text-error">*</span>
          </label>
          <span className="text-xs text-on-surface-variant font-body">
            {titleValue.length}/200
          </span>
        </div>
        <input
          id="title"
          type="text"
          placeholder="What do you want to ask or discuss?"
          {...register("title")}
          className="w-full bg-surface-container-low rounded-xl px-4 py-3 font-body text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 border-0"
        />
        {errors.title && (
          <p className="text-sm text-error font-body">{errors.title.message}</p>
        )}
      </div>

      {/* Body */}
      <div className="space-y-2">
        <div className="flex items-end justify-between">
          <label
            htmlFor="body"
            className="block font-body text-sm font-semibold text-on-surface"
          >
            Details <span className="text-error">*</span>
          </label>
          <span className="text-xs text-on-surface-variant font-body">
            {bodyValue.length}/10,000
          </span>
        </div>
        <textarea
          id="body"
          rows={8}
          placeholder="Share the full context — the more detail you give, the better the community can help."
          {...register("body")}
          className="w-full bg-surface-container-low rounded-xl px-4 py-3 font-body text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 border-0 resize-none"
        />
        {errors.body && (
          <p className="text-sm text-error font-body">{errors.body.message}</p>
        )}
      </div>

      {/* Anonymous option */}
      {!isMentor && (
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            {...register("is_anonymous")}
            className="w-4 h-4 rounded accent-primary mt-0.5"
          />
          <span className="font-body text-sm text-on-surface-variant">
            Post anonymously — your name won&apos;t be shown to other students
          </span>
        </label>
      )}

      {serverError && (
        <p className="text-sm text-error font-body bg-error/10 px-4 py-3 rounded-xl">
          {serverError}
        </p>
      )}

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isSubmitting} size="lg">
          {isSubmitting ? "Posting…" : "Post discussion"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(browse\)/forums/new/new-thread-form.tsx
git commit -m "feat: add anonymous checkbox to new thread form"
```

---

## Task 8: Pass `isMentor` from new thread pages

**Files:**
- Modify: `app/(browse)/forums/new/page.tsx`
- Modify: `app/(browse)/forums/[category]/new/page.tsx`

- [ ] **Step 1: Update `app/(browse)/forums/new/page.tsx`**

Find the existing profile/user check block:

```tsx
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
```

Add a role fetch immediately after:

```tsx
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const isMentor = userProfile?.role === "mentor";
```

Then find:

```tsx
      <NewThreadForm categories={categories ?? []} />
```

Replace with:

```tsx
      <NewThreadForm categories={categories ?? []} isMentor={isMentor} />
```

- [ ] **Step 2: Update `app/(browse)/forums/[category]/new/page.tsx`**

Find the existing user check:

```tsx
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
```

Add a role fetch immediately after:

```tsx
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const isMentor = userProfile?.role === "mentor";
```

Then find:

```tsx
      <NewThreadForm
        categories={categories ?? []}
        defaultCategory={category}
      />
```

Replace with:

```tsx
      <NewThreadForm
        categories={categories ?? []}
        defaultCategory={category}
        isMentor={isMentor}
      />
```

- [ ] **Step 3: Verify full TypeScript compile**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add app/\(browse\)/forums/new/page.tsx app/\(browse\)/forums/\[category\]/new/page.tsx
git commit -m "feat: pass isMentor to NewThreadForm from new-thread pages"
```

---

## Task 9: Verify end-to-end in the browser

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test as a student — posting an anonymous thread**
  1. Sign in as a student
  2. Go to `/forums/new`
  3. Confirm the "Post anonymously" checkbox is visible
  4. Check the box and submit a new thread
  5. On the thread page, confirm the header shows "Anonymous" (not your name)
  6. Sign out, sign in as a different student
  7. Reload the thread — confirm the author shows as "Anonymous" (no "(you)" label)

- [ ] **Step 3: Test as the original student author**
  1. Sign back in as the student who posted the anonymous thread
  2. Reload the thread — confirm the author shows as "Anonymous (you)"
  3. Confirm edit/delete controls still appear (ownership is unaffected)

- [ ] **Step 4: Test anonymous reply**
  1. On any thread, check "Post anonymously" in the reply bar and submit
  2. Confirm the reply shows "Anonymous (you)" for you and "Anonymous" for others

- [ ] **Step 5: Test as a mentor**
  1. Sign in as a verified mentor
  2. Go to `/forums/new` — confirm "Post anonymously" checkbox is **not** visible
  3. Go to a thread — confirm the reply bar has **no** anonymous checkbox
  4. As a bonus server-side check: using a REST client or Supabase dashboard, confirm that if a mentor submits `is_anonymous: true` directly, the stored value is `false`

- [ ] **Step 6: Test non-anonymous thread (regression)**
  1. Post a normal (non-anonymous) thread as a student
  2. Confirm your real name is displayed correctly

---

## Task 10: Final commit and changelog

- [ ] **Step 1: Update `todo.md`**

Move any relevant task to `## Shipped` in `todo.md`.

- [ ] **Step 2: Update `docs/changelog.md`**

Add under `## [Unreleased]`:

```markdown
### Added
- Anonymous posting option for forum threads and replies (students only; mentors always post identified)
```

- [ ] **Step 3: Commit**

```bash
git add todo.md docs/changelog.md
git commit -m "docs: log anonymous forum posts feature in changelog"
```
