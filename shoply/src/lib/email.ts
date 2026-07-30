import { Resend } from "resend"
import { OrderConfirmationEmail } from "@/emails/order-confirmation"
import { OrderShippedEmail } from "@/emails/order-shipped"
import { WelcomeEmail } from "@/emails/welcome"
import type { OrderStatus } from "@/generated/prisma/enums"

const apiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.EMAIL_FROM ?? "Shoply <onboarding@resend.dev>"

let client: Resend | null = null

function getClient(): Resend | null {
  if (!apiKey) return null
  if (!client) client = new Resend(apiKey)
  return client
}

type EmailResult = { ok: boolean; error?: string; id?: string }

/**
 * Send a transactional email. If Resend is not configured (no API key),
 * logs the email to the console and returns success so the flow doesn't break.
 */
export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string
  subject: string
  react: React.ReactElement
}): Promise<EmailResult> {
  const resend = getClient()
  if (!resend) {
    console.log(`📧 [EMAIL STUB] To: ${to} | Subject: ${subject}`)
    return { ok: true, id: "stub" }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      react,
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true, id: data?.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Send failed" }
  }
}

type OrderItemForEmail = {
  productName: string
  variantName: string | null
  quantity: number
  price: number
}

type SendOrderConfirmationParams = {
  to: string
  customerName: string | null
  orderNumber: string
  orderId: string
  items: OrderItemForEmail[]
  subtotal: number
  discount: number
  shipping: number
  total: number
  shippingAddress: {
    fullName: string
    street: string
    city: string
    state: string
    zip: string
    country: string
  } | null
  appUrl: string
}

export async function sendOrderConfirmation(params: SendOrderConfirmationParams) {
  return sendEmail({
    to: params.to,
    subject: `Order ${params.orderNumber} confirmed`,
    react: OrderConfirmationEmail({
      customerName: params.customerName,
      orderNumber: params.orderNumber,
      orderId: params.orderId,
      items: params.items,
      subtotal: params.subtotal,
      discount: params.discount,
      shipping: params.shipping,
      total: params.total,
      shippingAddress: params.shippingAddress,
      appUrl: params.appUrl,
    }),
  })
}

type SendOrderShippedParams = {
  to: string
  customerName: string | null
  orderNumber: string
  orderId: string
  trackingNumber?: string
  carrier?: string
  appUrl: string
}

export async function sendOrderShipped(params: SendOrderShippedParams) {
  return sendEmail({
    to: params.to,
    subject: `Your order ${params.orderNumber} has shipped`,
    react: OrderShippedEmail({
      customerName: params.customerName,
      orderNumber: params.orderNumber,
      orderId: params.orderId,
      trackingNumber: params.trackingNumber,
      carrier: params.carrier,
      appUrl: params.appUrl,
    }),
  })
}

type SendWelcomeParams = {
  to: string
  name: string
  appUrl: string
}

export async function sendWelcome(params: SendWelcomeParams) {
  return sendEmail({
    to: params.to,
    subject: "Welcome to Shoply",
    react: WelcomeEmail({ name: params.name, appUrl: params.appUrl }),
  })
}

type OrderStatusEmailParams = {
  to: string
  customerName: string | null
  orderNumber: string
  orderId: string
  newStatus: OrderStatus
  appUrl: string
}

export async function sendOrderStatusUpdate(params: OrderStatusEmailParams) {
  // Only send for major transitions
  if (params.newStatus === "SHIPPED") {
    return sendOrderShipped({
      to: params.to,
      customerName: params.customerName,
      orderNumber: params.orderNumber,
      orderId: params.orderId,
      appUrl: params.appUrl,
    })
  }
  // For other statuses, could be implemented similarly
  return { ok: true, id: "skipped" }
}
