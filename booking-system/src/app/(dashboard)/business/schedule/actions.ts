"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const scheduleInputSchema = z.object({
  dayOfWeek: z.enum([
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ]),
  openTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  closeTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  isActive: z.boolean().default(true),
});

export type ScheduleInput = z.infer<typeof scheduleInputSchema>;
export type ScheduleActionResult = {
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

export async function updateScheduleAction(
  schedule: ScheduleInput[]
): Promise<ScheduleActionResult> {
  try {
    const business = await getBusinessByOwner();

    // Validar todo el array
    const validated = z.array(scheduleInputSchema).safeParse(schedule);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Datos inválidos",
      };
    }

    // Validar que openTime < closeTime
    for (const day of validated.data) {
      if (day.openTime >= day.closeTime) {
        return {
          success: false,
          error: `La hora de apertura debe ser menor a la de cierre (${day.dayOfWeek})`,
        };
      }
    }

    // Eliminar horarios existentes y crear los nuevos
    await prisma.$transaction([
      prisma.businessHours.deleteMany({
        where: { businessId: business.id },
      }),
      ...validated.data.map((day) =>
        prisma.businessHours.create({
          data: {
            businessId: business.id,
            dayOfWeek: day.dayOfWeek,
            openTime: day.openTime,
            closeTime: day.closeTime,
            isActive: day.isActive,
          },
        })
      ),
    ]);

    revalidatePath("/dashboard/business/schedule");
    return { success: true };
  } catch (error) {
    console.error("Error en updateScheduleAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al guardar horarios",
    };
  }
}

export async function toggleDayAction(
  dayOfWeek: string
): Promise<ScheduleActionResult> {
  try {
    const business = await getBusinessByOwner();

    const existing = await prisma.businessHours.findUnique({
      where: {
        businessId_dayOfWeek: {
          businessId: business.id,
          dayOfWeek: dayOfWeek as
            | "SUNDAY"
            | "MONDAY"
            | "TUESDAY"
            | "WEDNESDAY"
            | "THURSDAY"
            | "FRIDAY"
            | "SATURDAY",
        },
      },
    });

    if (existing) {
      await prisma.businessHours.update({
        where: { id: existing.id },
        data: { isActive: !existing.isActive },
      });
    }

    revalidatePath("/dashboard/business/schedule");
    return { success: true };
  } catch (error) {
    console.error("Error en toggleDayAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al cambiar el día",
    };
  }
}
