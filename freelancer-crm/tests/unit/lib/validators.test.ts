import { describe, it, expect } from 'vitest'
import {
  loginSchema,
  registerSchema,
  clientSchema,
  projectSchema,
  taskSchema,
  proposalItemSchema,
  invoiceItemSchema,
} from '@/lib/validators'

describe('Validators', () => {
  describe('loginSchema', () => {
    it('validates valid login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      }
      expect(() => loginSchema.parse(validData)).not.toThrow()
    })

    it('rejects invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      }
      expect(() => loginSchema.parse(invalidData)).toThrow()
    })

    it('rejects short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '12345',
      }
      expect(() => loginSchema.parse(invalidData)).toThrow()
    })
  })

  describe('registerSchema', () => {
    it('validates valid registration data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        organizationName: 'My Company',
      }
      expect(() => registerSchema.parse(validData)).not.toThrow()
    })

    it('rejects short name', () => {
      const invalidData = {
        name: 'J',
        email: 'john@example.com',
        password: 'password123',
        organizationName: 'My Company',
      }
      expect(() => registerSchema.parse(invalidData)).toThrow()
    })

    it('rejects short organization name', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        organizationName: 'M',
      }
      expect(() => registerSchema.parse(invalidData)).toThrow()
    })
  })

  describe('clientSchema', () => {
    it('validates valid client data', () => {
      const validData = {
        name: 'Client Name',
        email: 'client@example.com',
        phone: '+1234567890',
        company: 'Client Corp',
        address: '123 Main St',
        notes: 'Some notes',
        status: 'ACTIVE' as const,
      }
      expect(() => clientSchema.parse(validData)).not.toThrow()
    })

    it('validates client with minimal data', () => {
      const minimalData = {
        name: 'Client Name',
        status: 'ACTIVE' as const,
      }
      expect(() => clientSchema.parse(minimalData)).not.toThrow()
    })

    it('rejects invalid status', () => {
      const invalidData = {
        name: 'Client Name',
        status: 'INVALID',
      }
      expect(() => clientSchema.parse(invalidData)).toThrow()
    })

    it('allows empty email', () => {
      const data = {
        name: 'Client Name',
        email: '',
        status: 'ACTIVE' as const,
      }
      expect(() => clientSchema.parse(data)).not.toThrow()
    })
  })

  describe('projectSchema', () => {
    it('validates valid project data', () => {
      const validData = {
        name: 'Project Name',
        description: 'Project description',
        status: 'PLANNING' as const,
        priority: 'MEDIUM' as const,
        budget: 10000,
        hourlyRate: 100,
        startDate: '2024-01-01',
        deadline: '2024-12-31',
        clientId: 'client-123',
      }
      expect(() => projectSchema.parse(validData)).not.toThrow()
    })

    it('rejects missing client', () => {
      const invalidData = {
        name: 'Project Name',
        status: 'PLANNING' as const,
        priority: 'MEDIUM' as const,
        clientId: '',
      }
      expect(() => projectSchema.parse(invalidData)).toThrow()
    })
  })

  describe('taskSchema', () => {
    it('validates valid task data', () => {
      const validData = {
        title: 'Task Title',
        description: 'Task description',
        status: 'TODO' as const,
        priority: 'HIGH' as const,
        dueDate: '2024-12-31',
        estimatedHours: 5,
        projectId: 'project-123',
        assigneeId: 'user-123',
      }
      expect(() => taskSchema.parse(validData)).not.toThrow()
    })

    it('rejects missing project', () => {
      const invalidData = {
        title: 'Task Title',
        status: 'TODO' as const,
        priority: 'MEDIUM' as const,
        projectId: '',
      }
      expect(() => taskSchema.parse(invalidData)).toThrow()
    })
  })

  describe('proposalItemSchema', () => {
    it('validates valid item', () => {
      const validItem = {
        description: 'Service',
        quantity: 2,
        unitPrice: 100,
      }
      expect(() => proposalItemSchema.parse(validItem)).not.toThrow()
    })

    it('rejects zero quantity', () => {
      const invalidItem = {
        description: 'Service',
        quantity: 0,
        unitPrice: 100,
      }
      expect(() => proposalItemSchema.parse(invalidItem)).toThrow()
    })

    it('rejects negative price', () => {
      const invalidItem = {
        description: 'Service',
        quantity: 1,
        unitPrice: -100,
      }
      expect(() => proposalItemSchema.parse(invalidItem)).toThrow()
    })
  })

  describe('invoiceItemSchema', () => {
    it('validates valid item', () => {
      const validItem = {
        description: 'Product',
        quantity: 3,
        unitPrice: 50,
      }
      expect(() => invoiceItemSchema.parse(validItem)).not.toThrow()
    })
  })
})
