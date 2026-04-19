import type { Database } from "@/lib/supabase/database.types";

type NotificationType = Database["public"]["Enums"]["notification_type"];

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://hoddle-jet.vercel.app";

function emailShell(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr>
          <td style="background:#001842;border-radius:16px 16px 0 0;padding:28px 36px;">
            <p style="margin:0;font-family:'Plus Jakarta Sans',sans-serif;font-size:22px;font-weight:800;color:#f5f7fa;letter-spacing:-0.02em;">Hoddle</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f5f7fa;padding:36px 36px 28px;border-radius:0 0 16px 16px;box-shadow:0 12px 40px rgba(0,24,66,0.08);">
            ${body}
            <p style="margin:28px 0 0;font-family:'Be Vietnam Pro',sans-serif;font-size:13px;color:#9ca3af;line-height:1.6;">
              You're receiving this from Hoddle Melbourne.
              <a href="${BASE_URL}/settings/notifications" style="color:#001842;">Manage notification preferences</a>.
            </p>
          </td>
        </tr>
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

function ctaButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;margin:24px 0 0;padding:14px 28px;background:#001842;color:#f5f7fa;font-family:'Plus Jakarta Sans',sans-serif;font-size:15px;font-weight:700;border-radius:10px;text-decoration:none;">${label}</a>`;
}

export interface NotificationEmailContent {
  subject: string;
  html: string;
}

export function buildNotificationEmail(
  // `new_chat_message` is not yet in the DB enum — widened to string until migration ships
  type: NotificationType | (string & Record<never, never>),
  payload: Record<string, unknown>,
  recipientName: string,
): NotificationEmailContent | null {
  const firstName = recipientName.split(" ")[0] ?? "there";

  switch (type) {
    case "forum_reply_to_your_thread": {
      const threadTitle = String(payload.thread_title ?? "your thread");
      const replierName = String(payload.replier_name ?? "Someone");
      const threadUrl = payload.category_slug && payload.thread_slug
        ? `${BASE_URL}/forums/${payload.category_slug}/${payload.thread_slug}`
        : `${BASE_URL}/forums`;
      return {
        subject: `${replierName} replied to your thread on Hoddle`,
        html: emailShell(`
          <p style="margin:0 0 8px;font-family:'Be Vietnam Pro',sans-serif;font-size:12px;color:#2d6a4f;text-transform:uppercase;letter-spacing:0.12em;font-weight:700;">Forum reply</p>
          <h1 style="margin:0 0 16px;font-family:'Plus Jakarta Sans',sans-serif;font-size:24px;font-weight:800;color:#1a2035;line-height:1.2;">Someone replied to your thread</h1>
          <p style="margin:0 0 0;font-family:'Be Vietnam Pro',sans-serif;font-size:16px;color:#6b7280;line-height:1.6;">Hi ${firstName}, <strong style="color:#1a2035;">${replierName}</strong> replied to your thread <strong style="color:#1a2035;">"${threadTitle}"</strong> in the Hoddle community forum.</p>
          ${ctaButton(threadUrl, "View thread")}
        `),
      };
    }

    case "success_story_approved": {
      const storyTitle = String(payload.story_title ?? "Your story");
      const storyUrl = payload.story_slug
        ? `${BASE_URL}/stories/${payload.story_slug}`
        : `${BASE_URL}/stories`;
      return {
        subject: `Your story has been published on Hoddle`,
        html: emailShell(`
          <p style="margin:0 0 8px;font-family:'Be Vietnam Pro',sans-serif;font-size:12px;color:#2d6a4f;text-transform:uppercase;letter-spacing:0.12em;font-weight:700;">Story approved</p>
          <h1 style="margin:0 0 16px;font-family:'Plus Jakarta Sans',sans-serif;font-size:24px;font-weight:800;color:#1a2035;line-height:1.2;">Your story is live!</h1>
          <p style="margin:0;font-family:'Be Vietnam Pro',sans-serif;font-size:16px;color:#6b7280;line-height:1.6;">Hi ${firstName}, your story <strong style="color:#1a2035;">"${storyTitle}"</strong> has been approved and is now published on Hoddle for the whole community to read.</p>
          ${ctaButton(storyUrl, "View your story")}
        `),
      };
    }

    case "mentor_replied_to_your_question": {
      const sessionTitle = String(payload.session_title ?? "a session");
      const mentorName = String(payload.mentor_name ?? "Your mentor");
      const sessionUrl = payload.session_id
        ? `${BASE_URL}/sessions/${payload.session_id}`
        : `${BASE_URL}/sessions`;
      return {
        subject: `${mentorName} answered your question on Hoddle`,
        html: emailShell(`
          <p style="margin:0 0 8px;font-family:'Be Vietnam Pro',sans-serif;font-size:12px;color:#2d6a4f;text-transform:uppercase;letter-spacing:0.12em;font-weight:700;">Question answered</p>
          <h1 style="margin:0 0 16px;font-family:'Plus Jakarta Sans',sans-serif;font-size:24px;font-weight:800;color:#1a2035;line-height:1.2;">Your question was answered</h1>
          <p style="margin:0;font-family:'Be Vietnam Pro',sans-serif;font-size:16px;color:#6b7280;line-height:1.6;">Hi ${firstName}, <strong style="color:#1a2035;">${mentorName}</strong> answered your question for the session <strong style="color:#1a2035;">"${sessionTitle}"</strong>.</p>
          ${ctaButton(sessionUrl, "View session")}
        `),
      };
    }

    case "new_content_from_mentor_you_follow": {
      const contentTitle = String(payload.content_title ?? "New content");
      const mentorName = String(payload.mentor_name ?? "A mentor you follow");
      const contentUrl = payload.content_slug
        ? `${BASE_URL}/content/${payload.content_slug}`
        : `${BASE_URL}/content`;
      return {
        subject: `${mentorName} published new content on Hoddle`,
        html: emailShell(`
          <p style="margin:0 0 8px;font-family:'Be Vietnam Pro',sans-serif;font-size:12px;color:#2d6a4f;text-transform:uppercase;letter-spacing:0.12em;font-weight:700;">New content</p>
          <h1 style="margin:0 0 16px;font-family:'Plus Jakarta Sans',sans-serif;font-size:24px;font-weight:800;color:#1a2035;line-height:1.2;">New article from someone you follow</h1>
          <p style="margin:0;font-family:'Be Vietnam Pro',sans-serif;font-size:16px;color:#6b7280;line-height:1.6;">Hi ${firstName}, <strong style="color:#1a2035;">${mentorName}</strong> just published <strong style="color:#1a2035;">"${contentTitle}"</strong> in the Hoddle content library.</p>
          ${ctaButton(contentUrl, "Read now")}
        `),
      };
    }

    case "session_reminder_24h": {
      const sessionTitle = String(payload.session_title ?? "Your session");
      const sessionUrl = payload.session_id
        ? `${BASE_URL}/sessions/${payload.session_id}`
        : `${BASE_URL}/sessions`;
      return {
        subject: `Reminder: "${sessionTitle}" is tomorrow`,
        html: emailShell(`
          <p style="margin:0 0 8px;font-family:'Be Vietnam Pro',sans-serif;font-size:12px;color:#2d6a4f;text-transform:uppercase;letter-spacing:0.12em;font-weight:700;">Session tomorrow</p>
          <h1 style="margin:0 0 16px;font-family:'Plus Jakarta Sans',sans-serif;font-size:24px;font-weight:800;color:#1a2035;line-height:1.2;">Your session is tomorrow</h1>
          <p style="margin:0;font-family:'Be Vietnam Pro',sans-serif;font-size:16px;color:#6b7280;line-height:1.6;">Hi ${firstName}, just a reminder that <strong style="color:#1a2035;">"${sessionTitle}"</strong> is coming up tomorrow.</p>
          ${ctaButton(sessionUrl, "View session")}
        `),
      };
    }

    case "session_starting_soon": {
      const sessionTitle = String(payload.session_title ?? "Your session");
      const meetingUrl = payload.meeting_url ? String(payload.meeting_url) : null;
      const sessionUrl = payload.session_id
        ? `${BASE_URL}/sessions/${payload.session_id}`
        : `${BASE_URL}/sessions`;
      const joinSection = meetingUrl
        ? `<div style="background:#f0f4ff;border-radius:12px;padding:20px 24px;margin:24px 0;"><p style="margin:0 0 8px;font-family:'Be Vietnam Pro',sans-serif;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Join link</p><a href="${meetingUrl}" style="font-family:'Plus Jakarta Sans',sans-serif;font-size:16px;color:#001842;font-weight:700;word-break:break-all;">${meetingUrl}</a></div>`
        : `${ctaButton(sessionUrl, "View session")}`;
      return {
        subject: `Starting soon: "${sessionTitle}"`,
        html: emailShell(`
          <p style="margin:0 0 8px;font-family:'Be Vietnam Pro',sans-serif;font-size:12px;color:#2d6a4f;text-transform:uppercase;letter-spacing:0.12em;font-weight:700;">Starting in 15 minutes</p>
          <h1 style="margin:0 0 16px;font-family:'Plus Jakarta Sans',sans-serif;font-size:24px;font-weight:800;color:#1a2035;line-height:1.2;">Your session starts soon</h1>
          <p style="margin:0;font-family:'Be Vietnam Pro',sans-serif;font-size:16px;color:#6b7280;line-height:1.6;">Hi ${firstName}, <strong style="color:#1a2035;">"${sessionTitle}"</strong> starts in about 15 minutes.</p>
          ${joinSection}
        `),
      };
    }

    case "new_chat_message": {
      const senderName = String(payload.sender_name ?? "Someone");
      const preview = String(payload.message_preview ?? "");
      const conversationUrl = payload.conversation_id
        ? `${BASE_URL}/messages/${String(payload.conversation_id)}`
        : `${BASE_URL}/messages`;
      return {
        subject: `${senderName} sent you a message on Hoddle`,
        html: emailShell(`
          <p style="margin:0 0 8px;font-family:'Be Vietnam Pro',sans-serif;font-size:12px;color:#2d6a4f;text-transform:uppercase;letter-spacing:0.12em;font-weight:700;">New message</p>
          <h1 style="margin:0 0 16px;font-family:'Plus Jakarta Sans',sans-serif;font-size:24px;font-weight:800;color:#1a2035;line-height:1.2;">You have a new message</h1>
          <p style="margin:0 0 0;font-family:'Be Vietnam Pro',sans-serif;font-size:16px;color:#6b7280;line-height:1.6;">Hi ${firstName}, <strong style="color:#1a2035;">${senderName}</strong> sent you a message:</p>
          <div style="background:#eef1f6;border-radius:12px;padding:16px 20px;margin:16px 0;">
            <p style="margin:0;font-family:'Be Vietnam Pro',sans-serif;font-size:15px;color:#1a2035;line-height:1.6;font-style:italic;">&ldquo;${preview}${preview.length >= 120 ? "..." : ""}&rdquo;</p>
          </div>
          ${ctaButton(conversationUrl, "Reply now")}
        `),
      };
    }

    default:
      return null;
  }
}
