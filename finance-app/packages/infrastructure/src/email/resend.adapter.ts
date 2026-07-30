import { Resend } from "resend"
import type { IEmailService, SendEmailData } from "@finance/domain"

/**
 * Email adapter implementing the domain IEmailService port with Resend.
 * When no API key is configured (local dev), emails are logged to the
 * console instead of being sent.
 */
export class ResendEmailService implements IEmailService {
  private readonly resend: Resend | null

  constructor(
    apiKey: string,
    private readonly from: string
  ) {
    this.resend = apiKey ? new Resend(apiKey) : null
  }

  async send(data: SendEmailData): Promise<void> {
    if (!this.resend) {
      console.log(`[EMAIL DEV] To: ${data.to} | Subject: ${data.subject}`)
      return
    }

    const { error } = await this.resend.emails.send({
      from: this.from,
      to: data.to,
      subject: data.subject,
      html: data.html,
    })

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`)
    }
  }
}
