"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { buildNotificationEmail } from "@/lib/email/templates/notification-emails";
import { updateNotificationPreferencesSchema } from "@/lib/validation/notifications";
import { revalidatePath } from "next/cache";
import type { Database } from "@/lib/supabase/database.types";

type NotificationType = Database["public"]["Enums"]["notification_type"];

// ── Core notify helper ─────────────────────────────────────────────────────────

/**
 * Write a notification to the DB and optionally dispatch an email.
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
    // Supabase Json type requires explicit cast
    payload: payload as import("@/lib/supabase/database.types").Json,
  });

  if (error) {
    console.error("[notify] DB insert failed:", error.message);
    return;
  }

  // Check preferences — defaults: email on, in_app on, nothing muted
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("email_enabled, types_muted")
    .eq("profile_id", recipientId)
    .maybeSingle();

  const emailEnabled = prefs?.email_enabled ?? true;
  const typesMuted: string[] = (prefs?.types_muted as string[]) ?? [];

  if (!emailEnabled || typesMuted.includes(type)) return;

  // Fetch email + name
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
  const content = buildNotificationEmail(type, payload, recipientName);
  if (!content) return;

  await sendEmail({
    to: user.email,
    subject: content.subject,
    html: content.html,
  });
}

// ── Mark single notification read ─────────────────────────────────────────────

export async function markNotificationRead(
  notificationId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("recipient_id", user.id)
    .is("read_at", null);

  if (error) return { ok: false, error: "Failed to mark read." };

  revalidatePath("/inbox");
  return { ok: true };
}

// ── Mark all notifications read ───────────────────────────────────────────────

export async function markAllNotificationsRead(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", user.id)
    .is("read_at", null);

  if (error) return { ok: false, error: "Failed to mark all read." };

  revalidatePath("/inbox");
  return { ok: true };
}

// ── Update notification preferences ──────────────────────────────────────────

export async function updateNotificationPreferences(
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = updateNotificationPreferencesSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  const { error } = await supabase
    .from("notification_preferences")
    .upsert(
      {
        profile_id: user.id,
        email_enabled: parsed.data.email_enabled,
        in_app_enabled: parsed.data.in_app_enabled,
        types_muted: parsed.data.types_muted as NotificationType[],
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id" },
    );

  if (error) return { ok: false, error: "Failed to save preferences." };

  revalidatePath("/settings/notifications");
  return { ok: true };
}
