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
