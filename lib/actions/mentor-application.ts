"use server";

import { sendEmail } from "@/lib/email";
import { mentorApplicationSchema } from "@/lib/validation/mentor-application";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function applicationEmailHtml(data: {
  full_name: string;
  email: string;
  university: string;
  field_of_study: string;
  country_of_origin: string;
  years_in_melbourne?: string;
  motivation: string;
  linkedin_url?: string;
}): string {
  const row = (label: string, value: string) =>
    value
      ? `<tr>
           <td style="padding:10px 0;font-family:'Be Vietnam Pro',system-ui,sans-serif;font-size:13px;font-weight:600;color:#5a6275;text-transform:uppercase;letter-spacing:0.1em;width:180px;vertical-align:top;">${label}</td>
           <td style="padding:10px 0;font-family:'Be Vietnam Pro',system-ui,sans-serif;font-size:15px;color:#1a2035;line-height:1.6;">${escapeHtml(value)}</td>
         </tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>New Mentor Application — Hoddle</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f7fa;font-family:'Be Vietnam Pro',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f7fa;padding:48px 24px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background-color:#001842;border-radius:12px 12px 0 0;padding:32px 40px;">
              <p style="margin:0 0 6px;font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:20px;font-weight:700;color:#f5f7fa;letter-spacing:-0.01em;">Hoddle Melbourne</p>
              <p style="margin:0;font-size:13px;color:rgba(245,247,250,0.6);">New mentor application</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;border-radius:0 0 12px 12px;padding:36px 40px;">
              <h1 style="margin:0 0 24px;font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:22px;font-weight:700;color:#1a2035;">
                ${escapeHtml(data.full_name)} wants to mentor.
              </h1>
              <table cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid #e5e9f0;">
                <tbody>
                  ${row("Email", data.email)}
                  ${row("University", data.university)}
                  ${row("Field / Role", data.field_of_study)}
                  ${row("Country of origin", data.country_of_origin)}
                  ${data.years_in_melbourne ? row("Time in Melbourne", data.years_in_melbourne) : ""}
                  ${data.linkedin_url ? row("LinkedIn / Web", data.linkedin_url) : ""}
                </tbody>
              </table>
              <div style="margin-top:28px;padding:20px 24px;background-color:#f5f7fa;border-radius:10px;">
                <p style="margin:0 0 10px;font-family:'Be Vietnam Pro',system-ui,sans-serif;font-size:12px;font-weight:600;color:#5a6275;text-transform:uppercase;letter-spacing:0.1em;">Their motivation</p>
                <p style="margin:0;font-family:'Be Vietnam Pro',system-ui,sans-serif;font-size:15px;color:#1a2035;line-height:1.7;">${escapeHtml(data.motivation)}</p>
              </div>
              <p style="margin:32px 0 0;font-family:'Be Vietnam Pro',system-ui,sans-serif;font-size:13px;color:#5a6275;">
                To invite them, go to the Admin dashboard → Mentor invites and use the email above.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 0;text-align:center;">
              <p style="margin:0;font-family:'Be Vietnam Pro',system-ui,sans-serif;font-size:12px;color:#9ca3af;">Hoddle Melbourne · Connecting international students with mentors</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// submitMentorApplication — public, no auth required
// Validates the application and emails it to admin for review.
// ---------------------------------------------------------------------------

export async function submitMentorApplication(
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = mentorApplicationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const data = parsed.data;

  const adminEmail =
    process.env.ADMIN_EMAIL ??
    process.env.RESEND_FROM_EMAIL ??
    process.env.GMAIL_USER;
  if (!adminEmail) {
    console.error(
      "submitMentorApplication: no admin email configured — set ADMIN_EMAIL in environment.",
    );
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  const result = await sendEmail({
    to: adminEmail,
    subject: `New mentor application from ${data.full_name}`,
    html: applicationEmailHtml(data),
    replyTo: data.email,
  });

  if (!result.ok) {
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  return { ok: true };
}
