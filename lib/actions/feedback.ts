"use server";

import { createClient } from "@/lib/supabase/server";
import { feedbackSchema } from "@/lib/validation/feedback";

export async function submitFeedback(
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  // TODO: add rate limiting via checkRateLimit once a `feedback` DB table exists
  // (checkRateLimit requires a Supabase table to count rows — there is no feedback
  // table in the current schema, so DB-based rate limiting is not yet possible here)

  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const { category, message, pageUrl } = parsed.data;

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
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          Category: category,
          Message: message,
          "Page URL": pageUrl,
          "User ID": user.id,
          "User Email": user.email ?? "",
          "Submitted At": new Date().toISOString(),
        },
      }),
    });
  } catch {
    return { ok: false, error: "Failed to submit feedback." };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "<unreadable>");
    console.error(
      "Airtable feedback submission failed:",
      res.status,
      res.statusText,
      body,
    );
    return { ok: false, error: "Failed to submit feedback." };
  }

  return { ok: true };
}
