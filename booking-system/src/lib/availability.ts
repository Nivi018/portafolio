import { prisma } from "@/lib/prisma";
import {
  generateTimeSlots,
  isTimeInRange,
  calculateEndTime,
  getDayOfWeek,
  timeToMinutes,
  minutesToTime,
} from "@/lib/utils";
import type { Service } from "@prisma/client";

export interface AvailableSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

/**
 * Obtiene los slots disponibles para un servicio en una fecha específica
 */
export async function getAvailableSlots(
  businessId: string,
  serviceId: string,
  date: Date | string
): Promise<AvailableSlot[]> {
  // 1. Obtener el servicio
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!service || !service.active) {
    return [];
  }

  // 2. Verificar si la fecha está bloqueada
  const normalizedDate =
    typeof date === "string" ? new Date(date + "T00:00:00") : date;
  const dateOnly = new Date(
    normalizedDate.getFullYear(),
    normalizedDate.getMonth(),
    normalizedDate.getDate()
  );

  const blockedDate = await prisma.blockedDate.findUnique({
    where: {
      businessId_date: {
        businessId,
        date: dateOnly,
      },
    },
  });

  if (blockedDate) {
    return [];
  }

  // 3. Obtener horarios del negocio para ese día
  const dayOfWeek = getDayOfWeek(dateOnly);
  const businessHours = await prisma.businessHours.findUnique({
    where: {
      businessId_dayOfWeek: {
        businessId,
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

  if (!businessHours || !businessHours.isActive) {
    return [];
  }

  // 4. Generar slots cada 15 minutos dentro del horario
  const allSlots = generateTimeSlots(
    businessHours.openTime,
    businessHours.closeTime,
    15, // intervalo entre slots
    service.duration
  );

  // 5. Obtener reservas existentes para esa fecha
  const existingAppointments = await prisma.appointment.findMany({
    where: {
      businessId,
      date: dateOnly,
      status: {
        in: ["PENDING", "CONFIRMED"],
      },
    },
    select: {
      startTime: true,
      endTime: true,
      serviceId: true,
    },
  });

  // 6. Verificar disponibilidad de cada slot
  const now = new Date();
  const isToday = dateOnly.toDateString() === now.toDateString();
  const currentTime = `${now
    .getHours()
    .toString()
    .padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;

  const slots: AvailableSlot[] = allSlots.map((startTime) => {
    const endTime = calculateEndTime(startTime, service.duration);

    // No permitir reservas en el pasado
    if (isToday && startTime <= currentTime) {
      return { startTime, endTime, available: false };
    }

    // Verificar si el slot no se solapa con reservas existentes
    const isOverlapping = existingAppointments.some((apt) => {
      return startTime < apt.endTime && endTime > apt.startTime;
    });

    // Contar reservas que caen exactamente en este slot
    const sameSlotCount = existingAppointments.filter(
      (apt) => apt.startTime === startTime && apt.serviceId === serviceId
    ).length;

    const hasCapacity = sameSlotCount < service.maxBookingsPerSlot;

    return {
      startTime,
      endTime,
      available: !isOverlapping && hasCapacity,
    };
  });

  return slots;
}

/**
 * Verifica si un slot específico está disponible
 */
export async function isSlotAvailable(
  businessId: string,
  serviceId: string,
  date: Date | string,
  startTime: string,
  excludeAppointmentId?: string
): Promise<boolean> {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!service || !service.active) {
    return false;
  }

  const endTime = calculateEndTime(startTime, service.duration);

  const normalizedDate =
    typeof date === "string" ? new Date(date + "T00:00:00") : date;
  const dateOnly = new Date(
    normalizedDate.getFullYear(),
    normalizedDate.getMonth(),
    normalizedDate.getDate()
  );

  // Verificar fecha bloqueada
  const blockedDate = await prisma.blockedDate.findUnique({
    where: {
      businessId_date: {
        businessId,
        date: dateOnly,
      },
    },
  });

  if (blockedDate) {
    return false;
  }

  // Verificar horario del negocio
  const dayOfWeek = getDayOfWeek(dateOnly);
  const businessHours = await prisma.businessHours.findUnique({
    where: {
      businessId_dayOfWeek: {
        businessId,
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

  if (!businessHours || !businessHours.isActive) {
    return false;
  }

  if (
    !isTimeInRange(startTime, businessHours.openTime, businessHours.closeTime) ||
    !isTimeInRange(endTime, businessHours.openTime, businessHours.closeTime)
  ) {
    return false;
  }

  // Verificar reservas existentes
  const conflictingAppointments = await prisma.appointment.findMany({
    where: {
      businessId,
      date: dateOnly,
      status: {
        in: ["PENDING", "CONFIRMED"],
      },
      ...(excludeAppointmentId && { id: { not: excludeAppointmentId } }),
    },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      serviceId: true,
    },
  });

  // Verificar solapamiento
  for (const apt of conflictingAppointments) {
    if (startTime < apt.endTime && endTime > apt.startTime) {
      return false;
    }
  }

  // Verificar capacidad
  const sameSlotCount = conflictingAppointments.filter(
    (apt) => apt.startTime === startTime && apt.serviceId === serviceId
  ).length;

  return sameSlotCount < service.maxBookingsPerSlot;
}

/**
 * Obtiene los próximos slots disponibles (para vista rápida)
 */
export async function getNextAvailableSlots(
  businessId: string,
  serviceId: string,
  daysAhead: number = 7,
  slotsPerDay: number = 5
): Promise<{ date: string; slots: string[] }[]> {
  const result: { date: string; slots: string[] }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const dateStr = date.toISOString().split("T")[0];
    const slots = await getAvailableSlots(businessId, serviceId, date);
    const availableSlots = slots
      .filter((s) => s.available)
      .slice(0, slotsPerDay)
      .map((s) => s.startTime);

    if (availableSlots.length > 0) {
      result.push({ date: dateStr, slots: availableSlots });
    }
  }

  return result;
}
