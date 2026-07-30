import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL ?? "noreply@tickets-app.com";

let resend: Resend | null = null;

export function getResend(): Resend | null {
  if (!apiKey) return null;
  if (!resend) resend = new Resend(apiKey);
  return resend;
}

export function isEmailConfigured(): boolean {
  return Boolean(apiKey);
}

export type SendEmailArgs = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail(args: SendEmailArgs): Promise<void> {
  const resend = getResend();
  if (!resend) {
    // Graceful degradation: log and skip in dev when no key is set.
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[email:dev] Would send to=${Array.isArray(args.to) ? args.to.join(",") : args.to} subject="${args.subject}"`,
      );
    }
    return;
  }

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
  });

  if (error) {
    console.error("[email] Resend error:", error);
  }
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export function getAppUrl(): string {
  return APP_URL;
}
