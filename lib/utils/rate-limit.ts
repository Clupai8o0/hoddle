import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type AppSupabase = SupabaseClient<Database>;

interface RateLimitOptions {
  /** Supabase client (authenticated, cookie-based) */
  supabase: AppSupabase;
  /** Table to count recent rows in */
  table: keyof Database["public"]["Tables"];
  /** Column that stores the author/submitter profile id */
  userColumn: string;
  userId: string;
  /** Rolling window in minutes */
  windowMinutes: number;
  /** Max allowed inserts within the window */
  maxCount: number;
  /** Human-facing label for error messages (e.g. "forum posts") */
  label?: string;
}

/**
 * Counts rows by this user in the given time window.
 * Returns `{ allowed: false, error }` if the limit is hit.
 *
 * Uses a DB row-count approach — no external KV needed.
 */
export async function checkRateLimit({
  supabase,
  table,
  userColumn,
  userId,
  windowMinutes,
  maxCount,
  label = "submissions",
}: RateLimitOptions): Promise<{ allowed: true } | { allowed: false; error: string }> {
  const windowStart = new Date(
    Date.now() - windowMinutes * 60 * 1000,
  ).toISOString();

  const { count, error } = await (supabase.from(table) as ReturnType<AppSupabase["from"]>)
    .select("*", { count: "exact", head: true })
    .eq(userColumn, userId)
    .gte("created_at", windowStart);

  if (error) {
    // Fail open — don't block the user if the count query errors
    return { allowed: true };
  }

  if ((count ?? 0) >= maxCount) {
    return {
      allowed: false,
      error: `You've made too many ${label} recently. Please wait a few minutes and try again.`,
    };
  }

  return { allowed: true };
}
