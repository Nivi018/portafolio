import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.warn(
    "⚠️ STRIPE_SECRET_KEY no está configurada. Los pagos no funcionarán."
  );
}

export const stripe = new Stripe(STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2026-05-27.dahlia",
  typescript: true,
});

export function isStripeConfigured(): boolean {
  return !!STRIPE_SECRET_KEY && STRIPE_SECRET_KEY !== "sk_test_placeholder";
}
