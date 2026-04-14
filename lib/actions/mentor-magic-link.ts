"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

export async function sendMentorMagicLink(
  email: string,
  inviteToken: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") ?? "http";
  const siteUrl = `${proto}://${host}`;

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo: `${siteUrl}/auth/confirm?token=${encodeURIComponent(inviteToken)}`,
    },
  });

  if (error || !data?.properties?.action_link) {
    return { ok: false, error: error?.message ?? "Failed to generate sign-in link." };
  }

  const result = await sendEmail({
    to: email,
    subject: "Your Hoddle mentor sign-in link",
    html: mentorMagicLinkEmailHtml({ link: data.properties.action_link }),
  });

  if (!result.ok) {
    return { ok: false, error: `Could not send email: ${result.error}` };
  }

  return { ok: true };
}

function mentorMagicLinkEmailHtml({ link }: { link: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Sign in to Hoddle</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f7fa;font-family:'Be Vietnam Pro',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f7fa;padding:48px 24px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#001842;border-radius:12px;overflow:hidden;max-width:560px;width:100%;">
          <tr>
            <td style="padding:40px 48px 32px;">
              <p style="margin:0 0 32px;font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:20px;font-weight:700;color:#f5f7fa;letter-spacing:-0.01em;">
                Hoddle Melbourne
              </p>
              <h1 style="margin:0 0 16px;font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:28px;font-weight:700;color:#f5f7fa;line-height:1.2;">
                Complete your mentor signup.
              </h1>
              <p style="margin:0;font-size:16px;color:rgba(245,247,250,0.75);line-height:1.6;">
                Click the button below to verify your email and create your mentor account.
              </p>
            </td>
          </tr>
        </table>

        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;margin-top:32px;">
          <tr>
            <td style="padding:0 4px;">
              <a href="${link}" style="display:inline-block;background-color:#001842;color:#f5f7fa;font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:16px;font-weight:600;padding:16px 32px;border-radius:8px;text-decoration:none;">
                Create mentor account →
              </a>
              <p style="margin:40px 0 0;font-size:13px;color:#5a6275;line-height:1.5;">
                If you weren't expecting this, you can safely ignore it.
              </p>
              <p style="margin:8px 0 0;font-size:13px;color:#5a6275;">
                Or copy this URL into your browser:<br />
                <span style="color:#001842;word-break:break-all;">${link}</span>
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
