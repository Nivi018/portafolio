import { Resend } from "resend"

const resendApiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@freelancercrm.com"
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

const resend = resendApiKey ? new Resend(resendApiKey) : null

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
  }>
}

export async function sendEmail({ to, subject, html, attachments }: SendEmailOptions) {
  if (!resend) {
    console.warn("RESEND_API_KEY is not set. Email not sent:", { to, subject })
    return { success: false, error: "Email service not configured" }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      attachments: attachments?.map((att) => ({
        filename: att.filename,
        content: typeof att.content === "string" ? Buffer.from(att.content) : att.content,
      })),
    })

    if (error) {
      console.error("Resend error:", error)
      return { success: false, error: error.message }
    }

    return { success: true, id: data?.id }
  } catch (error) {
    console.error("Send email error:", error)
    return { success: false, error: "Failed to send email" }
  }
}

export function getInvoiceEmailTemplate({
  clientName,
  invoiceNumber,
  total,
  dueDate,
  organizationName,
  invoiceUrl,
}: {
  clientName: string
  invoiceNumber: string
  total: string
  dueDate: string
  organizationName: string
  invoiceUrl: string
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { border-bottom: 1px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 20px; }
          .logo { color: #2563eb; font-size: 24px; font-weight: bold; }
          .invoice-number { color: #64748b; font-size: 14px; margin-top: 4px; }
          .content { color: #334155; line-height: 1.6; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 20px 0; }
          .details { background: #f1f5f9; padding: 16px; border-radius: 6px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
          .total { font-size: 20px; font-weight: bold; color: #1e293b; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">${organizationName}</div>
            <div class="invoice-number">Invoice ${invoiceNumber}</div>
          </div>
          <div class="content">
            <p>Hi ${clientName},</p>
            <p>Please find attached your invoice <strong>${invoiceNumber}</strong> for <span class="total">${total}</span>.</p>
            <p>This invoice is due on <strong>${dueDate}</strong>.</p>
            <p>You can view and pay your invoice online by clicking the button below:</p>
            <a href="${invoiceUrl}" class="button">View Invoice</a>
            <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
            <p>Thank you for your business!</p>
          </div>
          <div class="footer">
            Sent by ${organizationName} via FreelancerCRM
          </div>
        </div>
      </body>
    </html>
  `
}

export function getProposalEmailTemplate({
  clientName,
  proposalTitle,
  total,
  validUntil,
  organizationName,
  proposalUrl,
}: {
  clientName: string
  proposalTitle: string
  total: string
  validUntil: string
  organizationName: string
  proposalUrl: string
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { border-bottom: 1px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 20px; }
          .logo { color: #2563eb; font-size: 24px; font-weight: bold; }
          .proposal-title { color: #64748b; font-size: 14px; margin-top: 4px; }
          .content { color: #334155; line-height: 1.6; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 20px 0; }
          .details { background: #f1f5f9; padding: 16px; border-radius: 6px; margin: 20px 0; }
          .total { font-size: 20px; font-weight: bold; color: #1e293b; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">${organizationName}</div>
            <div class="proposal-title">Proposal: ${proposalTitle}</div>
          </div>
          <div class="content">
            <p>Hi ${clientName},</p>
            <p>We're pleased to present our proposal <strong>${proposalTitle}</strong> for <span class="total">${total}</span>.</p>
            <p>This proposal is valid until <strong>${validUntil}</strong>.</p>
            <p>Please review the details by clicking the button below:</p>
            <a href="${proposalUrl}" class="button">View Proposal</a>
            <p>We look forward to working with you!</p>
          </div>
          <div class="footer">
            Sent by ${organizationName} via FreelancerCRM
          </div>
        </div>
      </body>
    </html>
  `
}

export function getInvitationEmailTemplate({
  inviterName,
  organizationName,
  inviteUrl,
}: {
  inviterName: string
  organizationName: string
  inviteUrl: string
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { border-bottom: 1px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 20px; }
          .logo { color: #2563eb; font-size: 24px; font-weight: bold; }
          .content { color: #334155; line-height: 1.6; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 20px 0; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">${organizationName}</div>
          </div>
          <div class="content">
            <p>Hi there!</p>
            <p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on FreelancerCRM.</p>
            <p>Click the button below to accept the invitation:</p>
            <a href="${inviteUrl}" class="button">Accept Invitation</a>
            <p>If you don't have an account, you'll be prompted to create one.</p>
          </div>
          <div class="footer">
            This invitation was sent via FreelancerCRM
          </div>
        </div>
      </body>
    </html>
  `
}

export function getPasswordResetEmailTemplate({
  userName,
  resetUrl,
}: {
  userName: string
  resetUrl: string
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { border-bottom: 1px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 20px; }
          .logo { color: #2563eb; font-size: 24px; font-weight: bold; }
          .content { color: #334155; line-height: 1.6; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 20px 0; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">FreelancerCRM</div>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>We received a request to reset your password. Click the button below to set a new password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            Sent by FreelancerCRM
          </div>
        </div>
      </body>
    </html>
  `
}

export { appUrl }
