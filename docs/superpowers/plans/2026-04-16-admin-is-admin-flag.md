# is_admin Boolean Flag — Architecture Upgrade Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow a user to be both a mentor and an admin simultaneously by replacing the `role = 'admin'` sentinel with an `is_admin boolean` capability flag on `profiles`.

**Architecture:** Add `is_admin boolean not null default false` to `profiles`. The `role` column continues to carry the user's journey type (`'student' | 'mentor'`). The unused `'admin'` enum value stays in Postgres (dropping enum values requires a full type recreation). Update the `is_admin()` SQL security-definer function and every TypeScript guard that currently checks `role === 'admin'`.

**Tech Stack:** Supabase Postgres migrations, Next.js App Router server actions, TypeScript strict mode, Tailwind CSS tokens.

---

### Task 1: Write and apply the Supabase migration

**Files:**
- Create: `supabase/migrations/20260416000001_profiles_is_admin.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/20260416000001_profiles_is_admin.sql

-- 1. Add is_admin capability flag
alter table public.profiles
  add column is_admin boolean not null default false;

-- 2. Backfill: existing admin-role users become is_admin = true
update public.profiles
  set is_admin = true
  where role = 'admin';

-- 3. Demote their role to 'student' (admins didn't have a journey role)
update public.profiles
  set role = 'student'
  where role = 'admin';

-- 4. Update the is_admin() security-definer function
--    (all RLS policies call this function, so no policy changes needed)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$;
```

- [ ] **Step 2: Apply the migration to the local database**

Run: `npx supabase db reset`

Expected: migration applied without errors, seed data reloaded.

- [ ] **Step 3: Verify the migration worked**

Run:
```sql
-- In Supabase Studio or psql:
select id, role, is_admin from profiles limit 10;
```

Expected: `is_admin` column exists, former `role = 'admin'` rows now have `is_admin = true` and `role = 'student'`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260416000001_profiles_is_admin.sql
git commit -m "feat(db): add is_admin boolean flag to profiles, update is_admin() function"
```

---

### Task 2: Regenerate TypeScript database types

**Files:**
- Modify: `lib/supabase/database.types.ts`

- [ ] **Step 1: Regenerate types from the updated schema**

Run: `npx supabase gen types typescript --local > lib/supabase/database.types.ts`

Expected: command exits 0, file is updated.

- [ ] **Step 2: Verify the profiles Row now includes is_admin**

Open `lib/supabase/database.types.ts` and confirm the `profiles` section now looks like:

```typescript
profiles: {
  Row: {
    avatar_url: string | null
    country_of_origin: string | null
    created_at: string
    full_name: string | null
    id: string
    is_admin: boolean        // ← new
    onboarded_at: string | null
    role: Database["public"]["Enums"]["user_role"]
    university: string | null
    updated_at: string
    year_of_study: number | null
  }
  Insert: {
    // ...
    is_admin?: boolean       // ← new (has db default)
    // ...
  }
  Update: {
    // ...
    is_admin?: boolean       // ← new
    // ...
  }
```

If `supabase gen types` is unavailable, make these edits manually — add `is_admin: boolean` to `Row`, `is_admin?: boolean` to `Insert`, `is_admin?: boolean` to `Update` in the `profiles` block.

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/database.types.ts
git commit -m "chore(types): regenerate database types with is_admin boolean on profiles"
```

---

### Task 3: Update the admin layout guard

**Files:**
- Modify: `app/(admin)/layout.tsx`

- [ ] **Step 1: Replace the role check with is_admin**

Current code at `app/(admin)/layout.tsx:18-25`:
```typescript
const { data: profile } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", user.id)
  .single();

if (profile?.role !== "admin") {
  redirect("/dashboard");
}
```

Replace with:
```typescript
const { data: profile } = await supabase
  .from("profiles")
  .select("is_admin")
  .eq("id", user.id)
  .single();

if (!profile?.is_admin) {
  redirect("/dashboard");
}
```

- [ ] **Step 2: Check TypeScript compiles cleanly**

Run: `npx tsc --noEmit`

Expected: no errors in `app/(admin)/layout.tsx`.

- [ ] **Step 3: Commit**

```bash
git add app/(admin)/layout.tsx
git commit -m "feat(admin): guard admin layout with is_admin flag instead of role"
```

---

### Task 4: Update requireAdmin() in admin-mentors server action

**Files:**
- Modify: `lib/actions/admin-mentors.ts`

- [ ] **Step 1: Update the requireAdmin helper**

Current code at `lib/actions/admin-mentors.ts:17-36`:
```typescript
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
```

Replace with:
```typescript
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
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return { ok: false, error: "Insufficient permissions." };
  }
  return { ok: true, userId: user.id };
}
```

- [ ] **Step 2: Compile check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/actions/admin-mentors.ts
git commit -m "feat(actions): update requireAdmin to check is_admin flag"
```

---

### Task 5: Update admin checks in mentor-invites server action

**Files:**
- Modify: `lib/actions/mentor-invites.ts`

There are three separate inline admin checks (lines ~33-41, ~104-112, ~138-146), each with this pattern:

```typescript
const { data: profile } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", user.id)
  .single();

if (profile?.role !== "admin") {
  return { ok: false, error: "Insufficient permissions." };
}
```

- [ ] **Step 1: Update all three occurrences**

For each of the three blocks, replace `.select("role")` with `.select("is_admin")` and `profile?.role !== "admin"` with `!profile?.is_admin`.

After the change, all three blocks look like:
```typescript
const { data: profile } = await supabase
  .from("profiles")
  .select("is_admin")
  .eq("id", user.id)
  .single();

if (!profile?.is_admin) {
  return { ok: false, error: "Insufficient permissions." };
}
```

- [ ] **Step 2: Compile check**

Run: `npx tsc --noEmit`

Expected: no errors in `lib/actions/mentor-invites.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/actions/mentor-invites.ts
git commit -m "feat(actions): update mentor-invites admin checks to use is_admin flag"
```

---

### Task 6: Update admin check in success-stories server action

**Files:**
- Modify: `lib/actions/success-stories.ts`

- [ ] **Step 1: Find and update the admin check**

Current code around line 103-110:
```typescript
const { data: profile } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", user.id)
  .single();

if (profile?.role !== "admin") {
  return { ok: false, error: "Not authorised." };
}
```

Replace with:
```typescript
const { data: profile } = await supabase
  .from("profiles")
  .select("is_admin")
  .eq("id", user.id)
  .single();

if (!profile?.is_admin) {
  return { ok: false, error: "Not authorised." };
}
```

- [ ] **Step 2: Full compile check across the whole project**

Run: `npx tsc --noEmit`

Expected: zero errors. If there are errors, they will be in files that still reference `role` to check for `"admin"` — fix each one by applying the same `is_admin` substitution.

- [ ] **Step 3: Scan for any remaining role=admin checks**

Run:
```bash
grep -rn "role.*admin\|admin.*role" app/ lib/ --include="*.ts" --include="*.tsx"
```

Expected: no matches (the `'admin'` enum value is now unused in application code).

- [ ] **Step 4: Commit**

```bash
git add lib/actions/success-stories.ts
git commit -m "feat(actions): update success-stories admin check to use is_admin flag"
```

---

### Task 7: Smoke test — verify admin access still works end-to-end

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

Expected: starts without errors.

- [ ] **Step 2: Confirm an admin-flagged user can access /admin**

In Supabase Studio, ensure at least one profile has `is_admin = true`. Log in as that user (or use the existing seed admin if the seed sets `is_admin`). Navigate to `/admin`.

Expected: admin dashboard loads, no redirect to `/dashboard`.

- [ ] **Step 3: Confirm a mentor-only user cannot access /admin**

Log in as a user with `role = 'mentor'` and `is_admin = false`. Navigate to `/admin`.

Expected: redirected to `/dashboard`.

- [ ] **Step 4: Confirm a mentor-admin can access both /mentor and /admin**

Update one test mentor profile in Supabase Studio: set `is_admin = true`. Log in as that user.
- Navigate to `/mentor` → Expected: mentor dashboard loads.
- Navigate to `/admin` → Expected: admin dashboard loads.

- [ ] **Step 5: Update seed file if needed**

Open `supabase/seed.sql`. If it inserts a profile with `role = 'admin'`, update it:
```sql
-- Before:
insert into public.profiles (id, role) values ('<uuid>', 'admin');

-- After:
insert into public.profiles (id, role, is_admin) values ('<uuid>', 'student', true);
```

If the seed already handles this correctly (e.g., via `db reset` rerunning the migration backfill), skip this step.

- [ ] **Step 6: Final commit**

```bash
git add supabase/seed.sql   # only if modified
git commit -m "chore(seed): update admin seed profile to use is_admin flag"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ Users can be mentor AND admin simultaneously (`role = 'mentor'`, `is_admin = true`)
- ✅ All admin guards updated (layout, admin-mentors, mentor-invites, success-stories)
- ✅ RLS policies updated via `is_admin()` function rewrite (no individual policy changes needed)
- ✅ TypeScript types reflect new column
- ✅ Existing mentor-only checks (`role === 'mentor'`) unchanged — not affected

**Scope not included (correct):**
- The `'admin'` enum value is NOT dropped — Postgres requires recreating the entire type to remove an enum value, which would require recreating all dependent columns. Leaving the unused value is safe.
- No `createMentorFromAdmin` changes needed — it correctly sets `role = 'mentor'` (not `is_admin`).
- No `acceptMentorInvite` changes needed — it sets `role = 'mentor'`, which is still correct.
