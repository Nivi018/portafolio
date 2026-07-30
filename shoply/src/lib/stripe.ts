import Stripe from "stripe"

const secretKey = process.env.STRIPE_SECRET_KEY
if (!secretKey) {
  // In dev, allow placeholder; warn in console
  if (process.env.NODE_ENV !== "production") {
    console.warn("⚠ STRIPE_SECRET_KEY is not set. Stripe calls will fail.")
  }
}

export const stripe = new Stripe(secretKey ?? "sk_test_placeholder", {
  apiVersion: "2026-05-27.dahlia",
  appInfo: {
    name: "Shoply",
    version: "0.1.0",
  },
})

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? ""

export function getPublishableKey() {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
}
