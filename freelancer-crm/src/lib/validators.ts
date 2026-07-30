import { z } from "zod"

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  organizationName: z.string().min(2, "Organization name must be at least 2 characters"),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Client schemas
export const clientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  company: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE", "LEAD"]),
})

// Project schemas
export const projectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional().or(z.literal("")),
  status: z.enum(["PLANNING", "IN_PROGRESS", "REVIEW", "COMPLETED", "CANCELLED"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  budget: z.coerce.number().min(0).optional().nullable(),
  hourlyRate: z.coerce.number().min(0).optional().nullable(),
  startDate: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
  clientId: z.string().min(1, "Client is required"),
})

// Task schemas
export const taskSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional().or(z.literal("")),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  dueDate: z.string().optional().nullable(),
  estimatedHours: z.coerce.number().min(0).optional().nullable(),
  projectId: z.string().min(1, "Project is required"),
  assigneeId: z.string().optional().nullable(),
})

// Time entry schemas
export const timeEntrySchema = z.object({
  description: z.string().optional().or(z.literal("")),
  projectId: z.string().min(1, "Project is required"),
  taskId: z.string().optional().nullable(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().optional().nullable(),
})

export const manualTimeEntrySchema = z.object({
  description: z.string().optional().or(z.literal("")),
  projectId: z.string().min(1, "Project is required"),
  taskId: z.string().optional().nullable(),
  date: z.string().min(1, "Date is required"),
  hours: z.coerce.number().min(0.1, "Hours must be at least 0.1"),
})

// Proposal schemas
export const proposalItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().min(0.1, "Quantity must be at least 0.1"),
  unitPrice: z.coerce.number().min(0, "Price must be positive"),
})

export const proposalSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  content: z.string().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"]),
  validUntil: z.string().optional().nullable(),
  projectId: z.string().min(1, "Project is required"),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  items: z.array(proposalItemSchema).min(1, "At least one item is required"),
})

// Invoice schemas
export const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().min(0.1, "Quantity must be at least 0.1"),
  unitPrice: z.coerce.number().min(0, "Price must be positive"),
})

export const invoiceSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]),
  dueDate: z.string().min(1, "Due date is required"),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  notes: z.string().optional().or(z.literal("")),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
})

// Team schemas
export const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["ADMIN", "MEMBER"]),
})

// Settings schemas
export const organizationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  logo: z.string().optional().or(z.literal("")),
})

export const invoiceTemplateSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  companyAddress: z.string().optional().or(z.literal("")),
  companyEmail: z.string().email().optional().or(z.literal("")),
  companyPhone: z.string().optional().or(z.literal("")),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  notes: z.string().optional().or(z.literal("")),
  logo: z.string().optional().or(z.literal("")),
})

export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
})

// Types
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ClientInput = z.infer<typeof clientSchema>
export type ProjectInput = z.infer<typeof projectSchema>
export type TaskInput = z.infer<typeof taskSchema>
export type TimeEntryInput = z.infer<typeof timeEntrySchema>
export type ManualTimeEntryInput = z.infer<typeof manualTimeEntrySchema>
export type ProposalInput = z.infer<typeof proposalSchema>
export type InvoiceInput = z.infer<typeof invoiceSchema>
export type InviteInput = z.infer<typeof inviteSchema>
