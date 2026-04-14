interface SessionReminderData {
  attendeeName: string;
  sessionTitle: string;
  mentorName: string;
  scheduledAt: string; // ISO string
  durationMinutes: number;
  meetingUrl: string | null;
}

function formatAEDT(iso: string): string {
  return new Date(iso).toLocaleString("en-AU", {
    timeZone: "Australia/Melbourne",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function sessionReminderHtml(data: SessionReminderData): string {
  const dateStr = formatAEDT(data.scheduledAt);
  const meetingSection = data.meetingUrl
    ? `
    <div style="background:#f0f4ff;border-radius:12px;padding:20px 24px;margin:24px 0;">
      <p style="margin:0 0 8px;font-family:'Be Vietnam Pro',sans-serif;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Join link</p>
      <a href="${data.meetingUrl}" style="font-family:'Plus Jakarta Sans',sans-serif;font-size:16px;color:#001842;font-weight:700;word-break:break-all;">${data.meetingUrl}</a>
    </div>`
    : `<p style="font-family:'Be Vietnam Pro',sans-serif;font-size:14px;color:#6b7280;margin:24px 0;">The mentor will share the meeting link shortly before the session starts.</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#001842;border-radius:16px 16px 0 0;padding:28px 36px;">
            <p style="margin:0;font-family:'Plus Jakarta Sans',sans-serif;font-size:22px;font-weight:800;color:#f5f7fa;letter-spacing:-0.02em;">Hoddle</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#f5f7fa;padding:36px 36px 28px;border-radius:0 0 16px 16px;box-shadow:0 12px 40px rgba(0,24,66,0.08);">
            <p style="margin:0 0 8px;font-family:'Be Vietnam Pro',sans-serif;font-size:12px;color:#2d6a4f;text-transform:uppercase;letter-spacing:0.12em;font-weight:700;">Session reminder</p>
            <h1 style="margin:0 0 8px;font-family:'Plus Jakarta Sans',sans-serif;font-size:24px;font-weight:800;color:#1a2035;line-height:1.2;">Your session is tomorrow</h1>
            <p style="margin:0 0 28px;font-family:'Be Vietnam Pro',sans-serif;font-size:16px;color:#6b7280;">Hi ${data.attendeeName}, just a reminder about your upcoming Q&amp;A with ${data.mentorName}.</p>

            <!-- Session card -->
            <div style="border:1.5px solid #dbe0ea;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
              <p style="margin:0 0 6px;font-family:'Plus Jakarta Sans',sans-serif;font-size:18px;font-weight:700;color:#1a2035;">${data.sessionTitle}</p>
              <p style="margin:0 0 4px;font-family:'Be Vietnam Pro',sans-serif;font-size:14px;color:#6b7280;">with <strong style="color:#1a2035;">${data.mentorName}</strong></p>
              <p style="margin:8px 0 0;font-family:'Be Vietnam Pro',sans-serif;font-size:14px;color:#001842;font-weight:600;">${dateStr} · ${data.durationMinutes} min</p>
            </div>

            ${meetingSection}

            <p style="margin:28px 0 0;font-family:'Be Vietnam Pro',sans-serif;font-size:13px;color:#9ca3af;line-height:1.6;">You're receiving this because you registered for a Hoddle live session. <a href="#" style="color:#001842;">Manage notification preferences</a>.</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 0;text-align:center;">
            <p style="margin:0;font-family:'Be Vietnam Pro',sans-serif;font-size:12px;color:#9ca3af;">Hoddle Melbourne · Connecting international students with mentors</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
