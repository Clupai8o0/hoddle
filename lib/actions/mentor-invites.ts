"use server";

import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { inviteMentorSchema } from "@/lib/validation/mentor-invite";

const INVITE_EXPIRY_DAYS = 7;

// ---------------------------------------------------------------------------
// inviteMentor — admin creates a new mentor invite and sends email
// ---------------------------------------------------------------------------

export async function inviteMentor(
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = inviteMentorSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { email, note } = parsed.data;

  const supabase = await createClient();

  // Verify caller is admin
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

  // Check for an unexpired, unaccepted invite already in flight
  const now = new Date().toISOString();
  const { data: existing } = await supabase
    .from("mentor_invites")
    .select("id, accepted_at, expires_at")
    .eq("email", email)
    .is("accepted_at", null)
    .gt("expires_at", now)
    .maybeSingle();

  if (existing) {
    return {
      ok: false,
      error: "An active invite already exists for this email address.",
    };
  }

  const token = randomUUID();
  const expiresAt = new Date(
    Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { error: insertError } = await supabase.from("mentor_invites").insert({
    email,
    token,
    created_by: user.id,
    expires_at: expiresAt,
  });

  if (insertError) {
    return { ok: false, error: insertError.message };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const signupUrl = `${siteUrl}/mentor-signup/${token}`;

  const noteHtml = note
    ? `<p style="color:#635f56;font-size:15px;line-height:1.6;margin:24px 0 0;">${escapeHtml(note)}</p>`
    : "";

  const emailResult = await sendEmail({
    to: email,
    subject: "You've been invited to join Hoddle as a mentor",
    html: mentorInviteEmailHtml({ signupUrl, noteHtml, expiresAt }),
  });

  if (!emailResult.ok) {
    return { ok: false, error: `Invite created but email failed: ${emailResult.error}` };
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// verifyMentor — admin marks a mentor as verified
// ---------------------------------------------------------------------------

export async function verifyMentor(
  profileId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
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

  const admin = createAdminClient();
  const { error } = await admin
    .from("mentors")
    .update({ verified_at: new Date().toISOString() })
    .eq("profile_id", profileId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// unverifyMentor — admin revokes mentor verification
// ---------------------------------------------------------------------------

export async function unverifyMentor(
  profileId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
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

  const admin = createAdminClient();
  const { error } = await admin
    .from("mentors")
    .update({ verified_at: null })
    .eq("profile_id", profileId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// acceptMentorInvite — called after successful magic-link auth
// Sets profile.role = 'mentor', creates mentors row, marks invite accepted
// ---------------------------------------------------------------------------

export async function acceptMentorInvite(
  token: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  // Validate invite token
  const now = new Date().toISOString();
  const { data: invite } = await supabase
    .from("mentor_invites")
    .select("id, email, accepted_at, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!invite) return { ok: false, error: "Invalid invite link." };
  if (invite.accepted_at) return { ok: false, error: "This invite has already been used." };
  if (invite.expires_at < now) return { ok: false, error: "This invite has expired." };
  if (invite.email.toLowerCase() !== user.email?.toLowerCase()) {
    return { ok: false, error: "This invite was sent to a different email address." };
  }

  const admin = createAdminClient();

  // Set profile role to mentor
  const { error: profileError } = await admin
    .from("profiles")
    .update({ role: "mentor" })
    .eq("id", user.id);

  if (profileError) return { ok: false, error: profileError.message };

  // Generate initial slug from email username + random suffix
  const emailUsername = user.email!.split("@")[0]!.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  const slug = `${emailUsername}-${Date.now().toString(36)}`;

  // Create mentors row
  const { error: mentorError } = await admin.from("mentors").insert({
    profile_id: user.id,
    slug,
  });

  if (mentorError && mentorError.code !== "23505") {
    // 23505 = unique violation (mentor row already exists — idempotent)
    return { ok: false, error: mentorError.message };
  }

  // Mark invite as accepted
  const { error: acceptError } = await admin
    .from("mentor_invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  if (acceptError) return { ok: false, error: acceptError.message };

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function mentorInviteEmailHtml({
  signupUrl,
  noteHtml,
  expiresAt,
}: {
  signupUrl: string;
  noteHtml: string;
  expiresAt: string;
}): string {
  const expiryDate = new Date(expiresAt).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Mentor Invitation — Hoddle</title>
</head>
<body style="margin:0;padding:0;background-color:#fef8f1;font-family:'Be Vietnam Pro',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef8f1;padding:48px 24px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#001842;border-radius:12px;overflow:hidden;max-width:560px;width:100%;">
          <tr>
            <td style="padding:40px 48px 32px;">
              <p style="margin:0 0 32px;font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:20px;font-weight:700;color:#fef8f1;letter-spacing:-0.01em;">
                Hoddle Melbourne
              </p>
              <h1 style="margin:0 0 16px;font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:28px;font-weight:700;color:#fef8f1;line-height:1.2;">
                You're invited to mentor.
              </h1>
              <p style="margin:0;font-size:16px;color:rgba(254,248,241,0.75);line-height:1.6;">
                Hoddle connects first-year international students with mentors who have walked the same path. We'd love you to share your story.
              </p>
            </td>
          </tr>
        </table>

        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;margin-top:32px;">
          <tr>
            <td style="padding:0 4px;">
              ${noteHtml}
              <p style="font-size:15px;color:#2a2620;line-height:1.6;margin:${noteHtml ? "24px" : "0"} 0 32px;">
                Click the button below to create your mentor account. The link expires on <strong>${expiryDate}</strong>.
              </p>
              <a href="${signupUrl}" style="display:inline-block;background-color:#001842;color:#fef8f1;font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:16px;font-weight:600;padding:16px 32px;border-radius:8px;text-decoration:none;">
                Accept invitation →
              </a>
              <p style="margin:40px 0 0;font-size:13px;color:#635f56;line-height:1.5;">
                If you weren't expecting this, you can safely ignore it. This link can only be used once.
              </p>
              <p style="margin:8px 0 0;font-size:13px;color:#635f56;">
                Or copy this URL into your browser:<br />
                <span style="color:#001842;word-break:break-all;">${signupUrl}</span>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
