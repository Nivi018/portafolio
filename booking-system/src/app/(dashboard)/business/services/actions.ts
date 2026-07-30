"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serviceSchema } from "@/lib/validators";

export type ActionResult = {
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

export async function createServiceAction(
  data: z.infer<typeof serviceSchema>
): Promise<ActionResult> {
  try {
    const business = await getBusinessByOwner();
    const validated = serviceSchema.safeParse(data);

    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Datos inválidos",
      };
    }

    await prisma.service.create({
      data: {
        businessId: business.id,
        name: validated.data.name,
        description: validated.data.description,
        duration: validated.data.duration,
        price: validated.data.price,
        currency: validated.data.currency,
        maxBookingsPerSlot: validated.data.maxBookingsPerSlot,
        active: validated.data.active,
      },
    });

    revalidatePath("/dashboard/business/services");
    return { success: true };
  } catch (error) {
    console.error("Error en createServiceAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al crear el servicio",
    };
  }
}

export async function updateServiceAction(
  serviceId: string,
  data: z.infer<typeof serviceSchema>
): Promise<ActionResult> {
  try {
    const business = await getBusinessByOwner();
    const validated = serviceSchema.safeParse(data);

    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Datos inválidos",
      };
    }

    // Verificar que el servicio pertenece al negocio
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service || service.businessId !== business.id) {
      return { success: false, error: "Servicio no encontrado" };
    }

    await prisma.service.update({
      where: { id: serviceId },
      data: {
        name: validated.data.name,
        description: validated.data.description,
        duration: validated.data.duration,
        price: validated.data.price,
        currency: validated.data.currency,
        maxBookingsPerSlot: validated.data.maxBookingsPerSlot,
        active: validated.data.active,
      },
    });

    revalidatePath("/dashboard/business/services");
    return { success: true };
  } catch (error) {
    console.error("Error en updateServiceAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al actualizar el servicio",
    };
  }
}

export async function deleteServiceAction(
  serviceId: string
): Promise<ActionResult> {
  try {
    const business = await getBusinessByOwner();

    // Verificar que el servicio pertenece al negocio
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service || service.businessId !== business.id) {
      return { success: false, error: "Servicio no encontrado" };
    }

    // Verificar que no tenga citas asociadas
    const appointmentCount = await prisma.appointment.count({
      where: { serviceId },
    });

    if (appointmentCount > 0) {
      // En lugar de eliminar, desactivar
      await prisma.service.update({
        where: { id: serviceId },
        data: { active: false },
      });
      return {
        success: true,
        error: "El servicio tiene citas asociadas, se desactivó en lugar de eliminarse",
      };
    }

    await prisma.service.delete({
      where: { id: serviceId },
    });

    revalidatePath("/dashboard/business/services");
    return { success: true };
  } catch (error) {
    console.error("Error en deleteServiceAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al eliminar el servicio",
    };
  }
}

export async function toggleServiceActiveAction(
  serviceId: string
): Promise<ActionResult> {
  try {
    const business = await getBusinessByOwner();

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service || service.businessId !== business.id) {
      return { success: false, error: "Servicio no encontrado" };
    }

    await prisma.service.update({
      where: { id: serviceId },
      data: { active: !service.active },
    });

    revalidatePath("/dashboard/business/services");
    return { success: true };
  } catch (error) {
    console.error("Error en toggleServiceActiveAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al cambiar el estado",
    };
  }
}
