import { z } from "zod";

// ====================================
// Auth validators
// ====================================
export const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[0-9]/, "Debe contener al menos un número"),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// ====================================
// Business validators
// ====================================
export const businessSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
});

export type BusinessInput = z.infer<typeof businessSchema>;

// ====================================
// Service validators
// ====================================
export const serviceSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  duration: z
    .number()
    .int()
    .min(5, "La duración mínima es 5 minutos")
    .max(480, "La duración máxima es 8 horas"),
  price: z.number().min(0, "El precio no puede ser negativo"),
  currency: z.string().default("USD"),
  maxBookingsPerSlot: z.number().int().min(1).default(1),
  active: z.boolean().default(true),
});

export type ServiceInput = z.infer<typeof serviceSchema>;

// ====================================
// Business hours validators
// ====================================
export const businessHoursSchema = z.object({
  dayOfWeek: z.enum([
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ]),
  openTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Hora inválida"),
  closeTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Hora inválida"),
  isActive: z.boolean().default(true),
});

export type BusinessHoursInput = z.infer<typeof businessHoursSchema>;

// ====================================
// Appointment validators
// ====================================
export const createAppointmentSchema = z.object({
  serviceId: z.string().min(1, "Selecciona un servicio"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")
    .refine((date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const inputDate = new Date(date + "T00:00:00");
      return inputDate >= today;
    }, "La fecha no puede ser en el pasado"),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Hora inválida"),
  clientName: z.string().min(2, "El nombre es requerido"),
  clientEmail: z.string().email("Email inválido"),
  clientPhone: z.string().optional(),
  notes: z.string().optional(),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "CANCELLED",
    "COMPLETED",
    "NO_SHOW",
  ]),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentStatusInput = z.infer<
  typeof updateAppointmentStatusSchema
>;

// ====================================
// Blocked date validators
// ====================================
export const blockedDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  reason: z.string().optional(),
});

export type BlockedDateInput = z.infer<typeof blockedDateSchema>;

// ====================================
// Profile validators
// ====================================
export const profileSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  phone: z.string().optional(),
  image: z.string().url().optional().or(z.literal("")),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Contraseña actual requerida"),
    newPassword: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
      .regex(/[0-9]/, "Debe contener al menos un número"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
