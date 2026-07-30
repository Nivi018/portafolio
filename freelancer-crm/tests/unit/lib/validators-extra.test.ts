import { describe, it, expect } from "vitest"
import {
  projectSchema,
  taskSchema,
  manualTimeEntrySchema,
  proposalSchema,
  invoiceSchema,
  invoiceTemplateSchema,
  organizationSchema,
  profileSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  inviteSchema,
} from "@/lib/validators"

describe("Additional Validators", () => {
  describe("manualTimeEntrySchema", () => {
    it("validates valid manual time entry", () => {
      const data = {
        description: "Worked on feature",
        projectId: "proj-1",
        taskId: null,
        date: "2024-01-15",
        hours: 2.5,
      }
      expect(() => manualTimeEntrySchema.parse(data)).not.toThrow()
    })

    it("rejects zero hours", () => {
      const data = {
        projectId: "proj-1",
        date: "2024-01-15",
        hours: 0,
      }
      expect(() => manualTimeEntrySchema.parse(data)).toThrow()
    })

    it("requires date and project", () => {
      const data = {
        hours: 2,
      }
      expect(() => manualTimeEntrySchema.parse(data)).toThrow()
    })
  })

  describe("proposalSchema", () => {
    it("validates a valid proposal", () => {
      const data = {
        title: "Website Redesign",
        content: "Full redesign proposal",
        status: "DRAFT" as const,
        validUntil: "2024-12-31",
        projectId: "proj-1",
        taxRate: 10,
        items: [
          { description: "Design", quantity: 1, unitPrice: 1000 },
          { description: "Development", quantity: 20, unitPrice: 50 },
        ],
      }
      expect(() => proposalSchema.parse(data)).not.toThrow()
    })

    it("requires at least one item", () => {
      const data = {
        title: "Empty proposal",
        status: "DRAFT" as const,
        projectId: "proj-1",
        taxRate: 0,
        items: [],
      }
      expect(() => proposalSchema.parse(data)).toThrow()
    })
  })

  describe("invoiceSchema", () => {
    it("validates a valid invoice", () => {
      const data = {
        projectId: "proj-1",
        status: "DRAFT" as const,
        dueDate: "2024-12-31",
        taxRate: 10,
        notes: "Net 30",
        items: [
          { description: "Service", quantity: 1, unitPrice: 500 },
        ],
      }
      expect(() => invoiceSchema.parse(data)).not.toThrow()
    })
  })

  describe("profileSchema", () => {
    it("validates a valid profile", () => {
      const data = {
        name: "John Doe",
        email: "john@example.com",
      }
      expect(() => profileSchema.parse(data)).not.toThrow()
    })
  })

  describe("organizationSchema", () => {
    it("validates organization data", () => {
      const data = { name: "My Org" }
      expect(() => organizationSchema.parse(data)).not.toThrow()
    })

    it("rejects empty name", () => {
      const data = { name: "" }
      expect(() => organizationSchema.parse(data)).toThrow()
    })
  })

  describe("inviteSchema", () => {
    it("validates a valid invite", () => {
      const data = { email: "user@example.com", role: "MEMBER" as const }
      expect(() => inviteSchema.parse(data)).not.toThrow()
    })

    it("rejects invalid email", () => {
      const data = { email: "invalid", role: "MEMBER" as const }
      expect(() => inviteSchema.parse(data)).toThrow()
    })
  })

  describe("forgotPasswordSchema", () => {
    it("validates a valid email", () => {
      const data = { email: "user@example.com" }
      expect(() => forgotPasswordSchema.parse(data)).not.toThrow()
    })
  })

  describe("resetPasswordSchema", () => {
    it("validates matching passwords", () => {
      const data = { password: "password123", confirmPassword: "password123" }
      expect(() => resetPasswordSchema.parse(data)).not.toThrow()
    })

    it("rejects non-matching passwords", () => {
      const data = { password: "password123", confirmPassword: "different" }
      expect(() => resetPasswordSchema.parse(data)).toThrow()
    })
  })

  describe("invoiceTemplateSchema", () => {
    it("validates a complete template", () => {
      const data = {
        companyName: "Acme Inc",
        companyAddress: "123 Main St",
        companyEmail: "billing@acme.com",
        companyPhone: "555-0100",
        taxRate: 10,
        notes: "Net 30",
      }
      expect(() => invoiceTemplateSchema.parse(data)).not.toThrow()
    })
  })
})
