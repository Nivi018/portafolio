import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ====================================
// Formateo de moneda
// ====================================
export function formatCurrency(
  amount: number | string,
  currency: string = "USD"
): string {
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(numericAmount);
}

// ====================================
// Formateo de fecha
// ====================================
export function formatDate(date: Date | string, locale: string = "es-MX"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

// ====================================
// Utilidades de tiempo
// ====================================
export function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(":").map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${newHours.toString().padStart(2, "0")}:${newMins
    .toString()
    .padStart(2, "0")}`;
}

export function calculateEndTime(
  startTime: string,
  durationMinutes: number
): string {
  return addMinutes(startTime, durationMinutes);
}

export function isTimeInRange(
  time: string,
  startTime: string,
  endTime: string
): boolean {
  return time >= startTime && time < endTime;
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}`;
}

// ====================================
// Generación de slots de tiempo
// ====================================
export function generateTimeSlots(
  openTime: string,
  closeTime: string,
  intervalMinutes: number,
  durationMinutes: number
): string[] {
  const slots: string[] = [];
  const startMinutes = timeToMinutes(openTime);
  const endMinutes = timeToMinutes(closeTime);

  for (
    let m = startMinutes;
    m + durationMinutes <= endMinutes;
    m += intervalMinutes
  ) {
    slots.push(minutesToTime(m));
  }

  return slots;
}

// ====================================
// Utilidades de slug
// ====================================
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ====================================
// Utilidades de día de la semana
// ====================================
export const DAYS_OF_WEEK = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

export const DAYS_LABELS_ES: Record<string, string> = {
  SUNDAY: "Domingo",
  MONDAY: "Lunes",
  TUESDAY: "Martes",
  WEDNESDAY: "Miércoles",
  THURSDAY: "Jueves",
  FRIDAY: "Viernes",
  SATURDAY: "Sábado",
};

export function getDayOfWeek(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return DAYS_OF_WEEK[d.getDay()];
}

// ====================================
// Utilidades de estado
// ====================================
export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  COMPLETED: "Completada",
  NO_SHOW: "No asistió",
};

export const APPOINTMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  CONFIRMED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
  COMPLETED: "bg-blue-100 text-blue-800 border-blue-200",
  NO_SHOW: "bg-gray-100 text-gray-800 border-gray-200",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  REFUNDED: "Reembolsado",
  FAILED: "Fallido",
};
