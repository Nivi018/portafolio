import { NextResponse } from "next/server";
import { z } from "zod";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

const createIntentSchema = z.object({
  appointmentId: z.string(),
});

export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe no está configurado" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const validated = createIntentSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: validated.data.appointmentId },
      include: { service: true, business: true },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Reserva no encontrada" },
        { status: 404 }
      );
    }

    // Verificar si ya tiene un PaymentIntent
    if (appointment.paymentId) {
      const existingPayment = await prisma.payment.findUnique({
        where: { id: appointment.paymentId },
      });

      if (existingPayment?.stripePaymentId) {
        // Retornar el client secret existente
        const paymentIntent = await stripe.paymentIntents.retrieve(
          existingPayment.stripePaymentId
        );
        return NextResponse.json({
          clientSecret: paymentIntent.client_secret,
          paymentId: existingPayment.id,
        });
      }
    }

    // Crear nuevo PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(appointment.service.price) * 100), // Stripe usa centavos
      currency: appointment.service.currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        appointmentId: appointment.id,
        businessId: appointment.businessId,
        serviceName: appointment.service.name,
      },
    });

    // Crear registro de pago
    const payment = await prisma.payment.create({
      data: {
        appointmentId: appointment.id,
        stripePaymentId: paymentIntent.id,
        amount: appointment.service.price,
        currency: appointment.service.currency,
        status: "PENDING",
      },
    });

    // Actualizar la cita con el paymentId
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { paymentId: payment.id },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment.id,
    });
  } catch (error) {
    console.error("Error en /api/payments/create-intent:", error);
    return NextResponse.json(
      { error: "Error al crear el pago" },
      { status: 500 }
    );
  }
}
