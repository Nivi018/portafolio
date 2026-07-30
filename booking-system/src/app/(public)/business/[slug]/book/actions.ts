"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isSlotAvailable } from "@/lib/availability";
import { createAppointmentSchema } from "@/lib/validators";
import { sendBookingConfirmation } from "@/lib/emails";

export type BookingResult = {
  success: boolean;
  error?: string;
  appointmentId?: string;
};

export async function createBookingAction(
  businessId: string,
  data: z.infer<typeof createAppointmentSchema>
): Promise<BookingResult> {
  try {
    const session = await auth();

    // Validar datos
    const validated = createAppointmentSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Datos inválidos",
      };
    }

    // Verificar que el negocio existe y está activo
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business || !business.active) {
      return { success: false, error: "Negocio no disponible" };
    }

    // Verificar que el servicio existe
    const service = await prisma.service.findUnique({
      where: { id: validated.data.serviceId },
    });

    if (!service || !service.active || service.businessId !== businessId) {
      return { success: false, error: "Servicio no disponible" };
    }

    // Verificar disponibilidad del slot
    const isAvailable = await isSlotAvailable(
      businessId,
      validated.data.serviceId,
      validated.data.date,
      validated.data.startTime
    );

    if (!isAvailable) {
      return {
        success: false,
        error: "Ese horario ya no está disponible. Por favor elige otro.",
      };
    }

    // Calcular hora de fin
    const [hours, minutes] = validated.data.startTime.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + service.duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    const endTime = `${endHours.toString().padStart(2, "0")}:${endMinutes
      .toString()
      .padStart(2, "0")}`;

    // Normalizar fecha
    const dateObj = new Date(validated.data.date + "T00:00:00");

    // Si el usuario está autenticado, usar su clientId
    // Si no, crear o buscar un user temporal con el email
    let clientId: string | null = null;

    if (session?.user?.id) {
      clientId = session.user.id;
    } else {
      // Buscar usuario existente por email o crear uno nuevo
      const existingUser = await prisma.user.findUnique({
        where: { email: validated.data.clientEmail },
      });

      if (existingUser) {
        clientId = existingUser.id;
      } else {
        const newUser = await prisma.user.create({
          data: {
            email: validated.data.clientEmail,
            name: validated.data.clientName,
            phone: validated.data.clientPhone,
            role: "CLIENT",
          },
        });
        clientId = newUser.id;
      }
    }

    // Crear la reserva
    const appointment = await prisma.appointment.create({
      data: {
        businessId,
        serviceId: validated.data.serviceId,
        clientId,
        clientName: validated.data.clientName,
        clientEmail: validated.data.clientEmail,
        clientPhone: validated.data.clientPhone,
        date: dateObj,
        startTime: validated.data.startTime,
        endTime,
        status: "PENDING",
        notes: validated.data.notes,
      },
      include: {
        service: true,
        business: true,
      },
    });

    // Si hay usuario autenticado y es el dueño, auto-confirmar
    if (session?.user) {
      // Enviar email de confirmación
      try {
        await sendBookingConfirmation({
          to: validated.data.clientEmail,
          clientName: validated.data.clientName,
          businessName: business.name,
          serviceName: service.name,
          date: dateObj,
          startTime: validated.data.startTime,
          endTime,
          notes: validated.data.notes,
        });
      } catch (emailError) {
        console.error("Error enviando email:", emailError);
        // No fallar la reserva si el email falla
      }
    }

    revalidatePath("/dashboard/business/appointments");
    revalidatePath("/dashboard/client");

    return {
      success: true,
      appointmentId: appointment.id,
    };
  } catch (error) {
    console.error("Error en createBookingAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al crear la reserva",
    };
  }
}
