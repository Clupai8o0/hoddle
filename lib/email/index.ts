import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM_EMAIL ?? "hello@hoddle.com.au";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  /** Reply-to address — defaults to FROM */
  replyTo?: string;
}

export type EmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function sendEmail(opts: SendEmailOptions): Promise<EmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      replyTo: opts.replyTo,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true, id: data!.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    return { ok: false, error: message };
  }
}
