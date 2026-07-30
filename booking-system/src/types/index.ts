import type { Role, AppointmentStatus, PaymentStatus } from "@prisma/client";

export type UserRole = Role;
export type AppointmentStatusType = AppointmentStatus;
export type PaymentStatusType = PaymentStatus;

export interface DashboardStats {
  totalAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalRevenue: number;
  thisMonthRevenue: number;
  totalClients: number;
  totalServices: number;
}

export interface ServiceWithCount extends Service {
  _count: {
    appointments: number;
  };
}

export interface AppointmentWithRelations {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes: string | null;
  clientName: string | null;
  clientEmail: string | null;
  clientPhone: string | null;
  createdAt: Date;
  service: {
    id: string;
    name: string;
    duration: number;
    price: import("@prisma/client").Prisma.Decimal;
  };
  client: {
    id: string;
    name: string | null;
    email: string;
  };
}

// Re-export Prisma types
import type { Service } from "@prisma/client";
