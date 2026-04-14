import nodemailer from "nodemailer";

// Lazy-initialized so build-time module evaluation doesn't throw without env vars
let _transporter: nodemailer.Transporter | null = null;
function getTransporter(): nodemailer.Transporter {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // STARTTLS
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return _transporter;
}

const FROM = process.env.GMAIL_USER ?? "hoddle@gmail.com";

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
    const info = await getTransporter().sendMail({
      from: `Hoddle Melbourne <${FROM}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      replyTo: opts.replyTo ?? FROM,
    });

    return { ok: true, id: info.messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    return { ok: false, error: message };
  }
}
