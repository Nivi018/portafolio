export interface SendEmailData {
  to: string
  subject: string
  html: string
}

/**
 * Port: Email service (budget alerts, reports, etc.).
 * Implemented by the Resend adapter in the infrastructure layer.
 */
export interface IEmailService {
  send(data: SendEmailData): Promise<void>
}
