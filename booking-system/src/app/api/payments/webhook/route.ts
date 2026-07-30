import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  if (!isStripeConfigured() || !WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Stripe no está configurado" },
      { status: 503 }
    );
  }

  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Falta la firma" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch (error) {
    console.error("Error verificando webhook:", error);
    return NextResponse.json(
      { error: "Firma inválida" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSucceeded(paymentIntent);
        break;
      }
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent);
        break;
      }
      case "payment_intent.canceled": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentCanceled(paymentIntent);
        break;
      }
      default:
        console.log(`Evento no manejado: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error procesando webhook:", error);
    return NextResponse.json(
      { error: "Error al procesar webhook" },
      { status: 500 }
    );
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const payment = await prisma.payment.findUnique({
    where: { stripePaymentId: paymentIntent.id },
  });

  if (!payment) {
    console.error("Pago no encontrado:", paymentIntent.id);
    return;
  }

  // Actualizar pago
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "PAID",
      paymentMethod: paymentIntent.payment_method_types?.[0] || "card",
    },
  });

  // Actualizar cita
  if (payment.appointmentId) {
    await prisma.appointment.update({
      where: { id: payment.appointmentId },
      data: {
        paymentStatus: "PAID",
        paymentAmount: payment.amount,
        status: "CONFIRMED", // Auto-confirmar cuando se paga
      },
    });
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const payment = await prisma.payment.findUnique({
    where: { stripePaymentId: paymentIntent.id },
  });

  if (!payment) return;

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "FAILED" },
  });
}

async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  const payment = await prisma.payment.findUnique({
    where: { stripePaymentId: paymentIntent.id },
  });

  if (!payment) return;

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "REFUNDED" },
  });
}
