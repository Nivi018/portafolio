export type {
  User,
  Organization,
  Client,
  Project,
  Task,
  TimeEntry,
  Proposal,
  ProposalItem,
  Invoice,
  InvoiceItem,
  Note,
  ActivityLog,
  UserRole,
  ClientStatus,
  ProjectStatus,
  TaskStatus,
  Priority,
  ProposalStatus,
  InvoiceStatus 
} from "@/generated/prisma/client"

export interface DashboardStats {
  totalRevenue: number
  monthlyRevenue: number
  activeProjects: number
  pendingTasks: number
  hoursThisWeek: number
  totalClients: number
  overdueInvoices: number
  activeTimers: number
}

export interface RevenueData {
  month: string
  revenue: number
}

export interface ProjectStatusData {
  status: string
  count: number
}

export interface ActivityItem {
  id: string
  action: string
  entity: string
  entityId: string
  metadata: string | null
  userName: string | null
  createdAt: Date
}
