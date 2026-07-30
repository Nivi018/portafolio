"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendCancellationEmail } from "@/lib/emails";

const updateStatusSchema = z.object({
  appointmentId: z.string(),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]),
});

export type AppointmentActionResult = {
  success: boolean;
  error?: string;
};

async function getBusinessByOwner() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("No autorizado");
  }

  const business = await prisma.business.findUnique({
    where: { ownerId: session.user.id },
  });

  if (!business) {
    throw new Error("No tienes un negocio registrado");
  }

  return business;
}

export async function updateAppointmentStatusAction(
  data: z.infer<typeof updateStatusSchema>
): Promise<AppointmentActionResult> {
  try {
    const business = await getBusinessByOwner();
    const validated = updateStatusSchema.safeParse(data);

    if (!validated.success) {
      return { success: false, error: "Datos inválidos" };
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: validated.data.appointmentId },
      include: { service: true, business: true },
    });

    if (!appointment || appointment.businessId !== business.id) {
      return { success: false, error: "Reserva no encontrada" };
    }

    await prisma.appointment.update({
      where: { id: validated.data.appointmentId },
      data: { status: validated.data.status },
    });

    // Si se cancela, enviar email
    if (validated.data.status === "CANCELLED" && appointment.clientEmail) {
      try {
        await sendCancellationEmail({
          to: appointment.clientEmail,
          clientName: appointment.clientName || "Cliente",
          businessName: business.name,
          serviceName: appointment.service.name,
          date: appointment.date,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
        });
      } catch (error) {
        console.error("Error enviando email de cancelación:", error);
      }
    }

    revalidatePath("/dashboard/business/appointments");
    return { success: true };
  } catch (error) {
    console.error("Error en updateAppointmentStatusAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al actualizar la reserva",
    };
  }
}

export async function cancelMyAppointmentAction(
  appointmentId: string
): Promise<AppointmentActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { service: true, business: true },
    });

    if (!appointment) {
      return { success: false, error: "Reserva no encontrada" };
    }

    // Verificar que la reserva pertenece al usuario
    if (appointment.clientId && appointment.clientId !== session.user.id) {
      return { success: false, error: "No tienes permiso para cancelar esta reserva" };
    }

    // Solo permitir cancelar reservas pendientes o confirmadas
    if (!["PENDING", "CONFIRMED"].includes(appointment.status)) {
      return { success: false, error: "Esta reserva no se puede cancelar" };
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "CANCELLED" },
    });

    // Enviar email de cancelación al cliente
    if (appointment.clientEmail) {
      try {
        await sendCancellationEmail({
          to: appointment.clientEmail,
          clientName: appointment.clientName || "Cliente",
          businessName: appointment.business.name,
          serviceName: appointment.service.name,
          date: appointment.date,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
        });
      } catch (emailError) {
        console.error("Error enviando email de cancelación:", emailError);
      }
    }

    revalidatePath("/dashboard/client/appointments");
    revalidatePath("/dashboard/business/appointments");
    return { success: true };
  } catch (error) {
    console.error("Error en cancelMyAppointmentAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al cancelar la reserva",
    };
  }
}
