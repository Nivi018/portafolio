import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL is not set")
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Starting seed...\n")

  // Clean existing data
  console.log("🧹 Cleaning existing data...")
  await prisma.activityLog.deleteMany()
  await prisma.invoiceItem.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.proposalItem.deleteMany()
  await prisma.proposal.deleteMany()
  await prisma.timeEntry.deleteMany()
  await prisma.task.deleteMany()
  await prisma.note.deleteMany()
  await prisma.project.deleteMany()
  await prisma.client.deleteMany()
  await prisma.passwordResetToken.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()
  await prisma.organization.deleteMany()

  // 1. Create Organization
  console.log("🏢 Creating organization...")
  const organization = await prisma.organization.create({
    data: {
      name: "Freelance Studio",
      slug: "freelance-studio",
    },
  })

  // 2. Create Users
  console.log("👥 Creating users...")
  const hashedPassword = await bcrypt.hash("password123", 12)

  const owner = await prisma.user.create({
    data: {
      name: "Jose Ivan Diaz",
      email: "jose@freelancestudio.com",
      hashedPassword,
      role: "OWNER",
      orgId: organization.id,
    },
  })

  const admin = await prisma.user.create({
    data: {
      name: "Maria Garcia",
      email: "maria@freelancestudio.com",
      hashedPassword,
      role: "ADMIN",
      orgId: organization.id,
    },
  })

  const member = await prisma.user.create({
    data: {
      name: "Carlos Lopez",
      email: "carlos@freelancestudio.com",
      hashedPassword,
      role: "MEMBER",
      orgId: organization.id,
    },
  })

  const member2 = await prisma.user.create({
    data: {
      name: "Ana Martinez",
      email: "ana@freelancestudio.com",
      hashedPassword,
      role: "MEMBER",
      orgId: organization.id,
    },
  })

  const userIds = [owner.id, admin.id, member.id, member2.id]

  // 3. Create Clients
  console.log("🤝 Creating clients...")
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        name: "TechCorp Solutions",
        email: "contact@techcorp.com",
        phone: "+1 (555) 123-4567",
        company: "TechCorp Solutions Inc.",
        address: "123 Innovation Drive, San Francisco, CA 94105",
        notes: "Long-term client. Prefers email communication. Always pays on time.",
        status: "ACTIVE",
        orgId: organization.id,
      },
    }),
    prisma.client.create({
      data: {
        name: "Creative Agency",
        email: "hello@creativeagency.com",
        phone: "+1 (555) 234-5678",
        company: "Creative Agency LLC",
        address: "456 Design Street, New York, NY 10001",
        notes: "Design agency. Needs frequent updates and mockups.",
        status: "ACTIVE",
        orgId: organization.id,
      },
    }),
    prisma.client.create({
      data: {
        name: "StartupHub",
        email: "founders@startuphub.io",
        phone: "+1 (555) 345-6789",
        company: "StartupHub Inc.",
        address: "789 Venture Blvd, Austin, TX 78701",
        notes: "Fast-growing startup. Looking for ongoing development work.",
        status: "ACTIVE",
        orgId: organization.id,
      },
    }),
    prisma.client.create({
      data: {
        name: "E-commerce Plus",
        email: "support@ecomplus.com",
        phone: "+1 (555) 456-7890",
        company: "E-commerce Plus",
        address: "321 Commerce Ave, Seattle, WA 98101",
        notes: "Online retailer. Needs Shopify integrations.",
        status: "ACTIVE",
        orgId: organization.id,
      },
    }),
    prisma.client.create({
      data: {
        name: "HealthTech Innovations",
        email: "info@healthtech.com",
        phone: "+1 (555) 567-8901",
        company: "HealthTech Innovations",
        address: "555 Medical Center, Boston, MA 02115",
        notes: "Healthcare startup. HIPAA compliance required.",
        status: "LEAD",
        orgId: organization.id,
      },
    }),
    prisma.client.create({
      data: {
        name: "EduLearn Platform",
        email: "team@edulearn.com",
        phone: "+1 (555) 678-9012",
        company: "EduLearn",
        address: "888 Education Way, Chicago, IL 60601",
        notes: "Online learning platform. Interested in LMS development.",
        status: "LEAD",
        orgId: organization.id,
      },
    }),
    prisma.client.create({
      data: {
        name: "Local Restaurant Group",
        email: "manager@localrestaurant.com",
        phone: "+1 (555) 789-0123",
        company: "Local Restaurant Group",
        address: "99 Food Street, Portland, OR 97201",
        notes: "Restaurant chain. Need online ordering system.",
        status: "INACTIVE",
        orgId: organization.id,
      },
    }),
  ])

  // 4. Create Notes for clients
  console.log("📝 Creating client notes...")
  await prisma.note.createMany({
    data: [
      {
        content: "Initial meeting was very positive. They want a complete redesign of their dashboard. Budget approved.",
        clientId: clients[0].id,
      },
      {
        content: "Discussed the new e-commerce module. They want it integrated with their existing inventory system.",
        clientId: clients[0].id,
      },
      {
        content: "Sent the first proposal. Waiting for feedback on the design mockups.",
        clientId: clients[1].id,
      },
      {
        content: "Lead from a referral. They mentioned they need a complete platform overhaul.",
        clientId: clients[4].id,
      },
    ],
  })

  // 5. Create Projects
  console.log("📁 Creating projects...")
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        name: "Dashboard Redesign",
        description: "Complete redesign of the analytics dashboard with new UI/UX, real-time data, and improved performance.",
        status: "IN_PROGRESS",
        priority: "HIGH",
        budget: 15000,
        hourlyRate: 100,
        startDate: new Date("2024-01-15"),
        deadline: new Date("2024-03-30"),
        clientId: clients[0].id,
        orgId: organization.id,
      },
    }),
    prisma.project.create({
      data: {
        name: "Brand Identity Package",
        description: "Logo, color palette, typography, brand guidelines, and marketing materials.",
        status: "COMPLETED",
        priority: "MEDIUM",
        budget: 5000,
        hourlyRate: 75,
        startDate: new Date("2023-11-01"),
        deadline: new Date("2023-12-15"),
        clientId: clients[1].id,
        orgId: organization.id,
      },
    }),
    prisma.project.create({
      data: {
        name: "MVP Web App",
        description: "Build minimum viable product for the startup's platform. React, Node.js, PostgreSQL.",
        status: "IN_PROGRESS",
        priority: "URGENT",
        budget: 25000,
        hourlyRate: 120,
        startDate: new Date("2024-02-01"),
        deadline: new Date("2024-05-30"),
        clientId: clients[2].id,
        orgId: organization.id,
      },
    }),
    prisma.project.create({
      data: {
        name: "Shopify Integration",
        description: "Custom Shopify app for inventory synchronization with their ERP system.",
        status: "REVIEW",
        priority: "HIGH",
        budget: 8000,
        hourlyRate: 90,
        startDate: new Date("2024-01-20"),
        deadline: new Date("2024-03-15"),
        clientId: clients[3].id,
        orgId: organization.id,
      },
    }),
    prisma.project.create({
      data: {
        name: "Healthcare Portal",
        description: "HIPAA-compliant patient portal with appointment scheduling and telemedicine features.",
        status: "PLANNING",
        priority: "HIGH",
        budget: 30000,
        hourlyRate: 150,
        startDate: new Date("2024-04-01"),
        deadline: new Date("2024-08-30"),
        clientId: clients[4].id,
        orgId: organization.id,
      },
    }),
    prisma.project.create({
      data: {
        name: "LMS Platform",
        description: "Learning management system with video courses, quizzes, and progress tracking.",
        status: "PLANNING",
        priority: "MEDIUM",
        budget: 18000,
        hourlyRate: 100,
        startDate: new Date("2024-05-01"),
        deadline: new Date("2024-09-30"),
        clientId: clients[5].id,
        orgId: organization.id,
      },
    }),
    prisma.project.create({
      data: {
        name: "Online Ordering System",
        description: "Custom online ordering and delivery management system for restaurant chain.",
        status: "CANCELLED",
        priority: "LOW",
        budget: 12000,
        hourlyRate: 85,
        startDate: new Date("2023-10-01"),
        deadline: new Date("2024-01-15"),
        clientId: clients[6].id,
        orgId: organization.id,
      },
    }),
    prisma.project.create({
      data: {
        name: "Mobile App Development",
        description: "iOS and Android app for TechCorp's customer engagement platform.",
        status: "IN_PROGRESS",
        priority: "URGENT",
        budget: 35000,
        hourlyRate: 130,
        startDate: new Date("2024-02-15"),
        deadline: new Date("2024-07-15"),
        clientId: clients[0].id,
        orgId: organization.id,
      },
    }),
  ])

  // 6. Create Tasks
  console.log("✅ Creating tasks...")
  const taskData = [
    { title: "Design wireframes", project: 0, status: "DONE", priority: "HIGH", dueDays: -30, estimatedHours: 8, assignee: 0 },
    { title: "Create high-fidelity mockups", project: 0, status: "DONE", priority: "HIGH", dueDays: -20, estimatedHours: 12, assignee: 1 },
    { title: "Set up React project with TypeScript", project: 0, status: "DONE", priority: "MEDIUM", dueDays: -15, estimatedHours: 4, assignee: 2 },
    { title: "Implement authentication system", project: 0, status: "IN_PROGRESS", priority: "HIGH", dueDays: 2, estimatedHours: 16, assignee: 2 },
    { title: "Build dashboard layout", project: 0, status: "IN_PROGRESS", priority: "HIGH", dueDays: 5, estimatedHours: 20, assignee: 0 },
    { title: "Integrate Chart.js for analytics", project: 0, status: "TODO", priority: "MEDIUM", dueDays: 10, estimatedHours: 8, assignee: 2 },
    { title: "Responsive design testing", project: 0, status: "TODO", priority: "MEDIUM", dueDays: 15, estimatedHours: 6, assignee: 1 },
    { title: "Performance optimization", project: 0, status: "TODO", priority: "LOW", dueDays: 20, estimatedHours: 8, assignee: 0 },
    { title: "Research and moodboard", project: 1, status: "DONE", priority: "MEDIUM", dueDays: -60, estimatedHours: 6, assignee: 1 },
    { title: "Logo concepts", project: 1, status: "DONE", priority: "HIGH", dueDays: -50, estimatedHours: 12, assignee: 1 },
    { title: "Color palette and typography", project: 1, status: "DONE", priority: "MEDIUM", dueDays: -45, estimatedHours: 4, assignee: 1 },
    { title: "Brand guidelines document", project: 1, status: "DONE", priority: "MEDIUM", dueDays: -40, estimatedHours: 8, assignee: 1 },
    { title: "Business card design", project: 1, status: "DONE", priority: "LOW", dueDays: -35, estimatedHours: 4, assignee: 1 },
    { title: "Project setup and architecture", project: 2, status: "DONE", priority: "URGENT", dueDays: -25, estimatedHours: 12, assignee: 0 },
    { title: "Database schema design", project: 2, status: "DONE", priority: "URGENT", dueDays: -20, estimatedHours: 8, assignee: 0 },
    { title: "User authentication API", project: 2, status: "IN_PROGRESS", priority: "URGENT", dueDays: 1, estimatedHours: 16, assignee: 2 },
    { title: "Frontend routing setup", project: 2, status: "IN_PROGRESS", priority: "HIGH", dueDays: 3, estimatedHours: 10, assignee: 1 },
    { title: "Core UI components", project: 2, status: "TODO", priority: "HIGH", dueDays: 7, estimatedHours: 20, assignee: 1 },
    { title: "Payment integration", project: 2, status: "TODO", priority: "HIGH", dueDays: 14, estimatedHours: 16, assignee: 0 },
    { title: "Email notifications", project: 2, status: "TODO", priority: "MEDIUM", dueDays: 18, estimatedHours: 8, assignee: 2 },
    { title: "Admin dashboard", project: 2, status: "TODO", priority: "MEDIUM", dueDays: 25, estimatedHours: 20, assignee: 1 },
    { title: "Testing and QA", project: 2, status: "TODO", priority: "HIGH", dueDays: 45, estimatedHours: 30, assignee: 0 },
    { title: "Deployment to production", project: 2, status: "TODO", priority: "URGENT", dueDays: 55, estimatedHours: 8, assignee: 0 },
    { title: "Shopify API research", project: 3, status: "DONE", priority: "HIGH", dueDays: -10, estimatedHours: 6, assignee: 2 },
    { title: "Authentication setup", project: 3, status: "DONE", priority: "HIGH", dueDays: -5, estimatedHours: 8, assignee: 2 },
    { title: "Webhook handlers", project: 3, status: "IN_PROGRESS", priority: "HIGH", dueDays: 2, estimatedHours: 12, assignee: 2 },
    { title: "Inventory sync logic", project: 3, status: "IN_PROGRESS", priority: "HIGH", dueDays: 5, estimatedHours: 16, assignee: 0 },
    { title: "Admin interface", project: 3, status: "TODO", priority: "MEDIUM", dueDays: 10, estimatedHours: 12, assignee: 1 },
    { title: "Compliance requirements gathering", project: 4, status: "TODO", priority: "HIGH", dueDays: 14, estimatedHours: 16, assignee: 0 },
    { title: "Patient data schema", project: 4, status: "TODO", priority: "HIGH", dueDays: 20, estimatedHours: 12, assignee: 0 },
    { title: "Appointment scheduling system", project: 4, status: "TODO", priority: "MEDIUM", dueDays: 45, estimatedHours: 24, assignee: 1 },
    { title: "Content structure planning", project: 5, status: "TODO", priority: "MEDIUM", dueDays: 20, estimatedHours: 8, assignee: 1 },
    { title: "Video streaming setup", project: 5, status: "TODO", priority: "MEDIUM", dueDays: 40, estimatedHours: 20, assignee: 0 },
    { title: "React Native setup", project: 7, status: "IN_PROGRESS", priority: "URGENT", dueDays: 1, estimatedHours: 8, assignee: 2 },
    { title: "Navigation structure", project: 7, status: "TODO", priority: "HIGH", dueDays: 7, estimatedHours: 12, assignee: 2 },
    { title: "API integration", project: 7, status: "TODO", priority: "HIGH", dueDays: 21, estimatedHours: 24, assignee: 0 },
    { title: "Push notifications", project: 7, status: "TODO", priority: "MEDIUM", dueDays: 45, estimatedHours: 12, assignee: 1 },
  ]

  for (const task of taskData) {
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + task.dueDays)
    await prisma.task.create({
      data: {
        title: task.title,
        status: task.status as any,
        priority: task.priority as any,
        dueDate,
        estimatedHours: task.estimatedHours,
        projectId: projects[task.project].id,
        assigneeId: userIds[task.assignee],
      },
    })
  }

  // 7. Create Time Entries
  console.log("⏱️  Creating time entries...")
  const timeEntries: any[] = []
  const now = new Date()
  const descriptions = [
    "Working on feature implementation", "Code review and refactoring", "Meeting with client",
    "Bug fixing", "Documentation update", "Testing and QA", "Database optimization",
    "UI design adjustments", "API integration", "Performance improvements",
  ]

  for (let day = 14; day >= 0; day--) {
    const date = new Date(now)
    date.setDate(date.getDate() - day)
    const entriesPerDay = Math.floor(Math.random() * 3) + 2

    for (let i = 0; i < entriesPerDay; i++) {
      const project = projects[Math.floor(Math.random() * projects.length)]
      const userId = userIds[Math.floor(Math.random() * userIds.length)]
      const startHour = 9 + i * 2
      const startTime = new Date(date)
      startTime.setHours(startHour, Math.floor(Math.random() * 60), 0, 0)
      const duration = (Math.floor(Math.random() * 120) + 30) * 60
      const endTime = new Date(startTime.getTime() + duration * 1000)
      timeEntries.push({
        description: descriptions[Math.floor(Math.random() * 10)],
        startTime,
        endTime,
        duration,
        isRunning: false,
        projectId: project.id,
        userId,
      })
    }
  }

  timeEntries.push({
    description: "Currently working on dashboard",
    startTime: new Date(now.getTime() - 30 * 60 * 1000),
    endTime: null,
    duration: null,
    isRunning: true,
    projectId: projects[0].id,
    userId: owner.id,
  })

  await prisma.timeEntry.createMany({ data: timeEntries })

  // 8. Create Proposals
  console.log("📄 Creating proposals...")
  await prisma.proposal.create({
    data: {
      title: "Dashboard Redesign - Phase 2",
      content: "Phase 2 of the dashboard redesign project. Includes advanced analytics, real-time data updates, and mobile responsive design.",
      status: "SENT",
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      subtotal: 12000,
      taxRate: 10,
      tax: 1200,
      total: 13200,
      projectId: projects[0].id,
      items: { create: [
        { description: "Advanced analytics module", quantity: 1, unitPrice: 5000 },
        { description: "Real-time data integration", quantity: 1, unitPrice: 4000 },
        { description: "Mobile responsive design", quantity: 1, unitPrice: 3000 },
      ] },
    },
  })

  await prisma.proposal.create({
    data: {
      title: "Brand Refresh 2024",
      content: "Modern brand refresh including updated logo, color system, and design tokens.",
      status: "ACCEPTED",
      validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      subtotal: 8000,
      taxRate: 10,
      tax: 800,
      total: 8800,
      projectId: projects[1].id,
      items: { create: [
        { description: "Logo redesign", quantity: 1, unitPrice: 3000 },
        { description: "Design system creation", quantity: 1, unitPrice: 3000 },
        { description: "Brand guidelines update", quantity: 1, unitPrice: 2000 },
      ] },
    },
  })

  await prisma.proposal.create({
    data: {
      title: "Healthcare Portal - Initial Proposal",
      content: "Complete HIPAA-compliant patient portal with telemedicine capabilities.",
      status: "DRAFT",
      validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      subtotal: 28000,
      taxRate: 10,
      tax: 2800,
      total: 30800,
      projectId: projects[4].id,
      items: { create: [
        { description: "Patient portal development", quantity: 1, unitPrice: 15000 },
        { description: "Telemedicine integration", quantity: 1, unitPrice: 8000 },
        { description: "HIPAA compliance setup", quantity: 1, unitPrice: 5000 },
      ] },
    },
  })

  await prisma.proposal.create({
    data: {
      title: "E-commerce Maintenance",
      content: "Monthly maintenance and support for the e-commerce platform.",
      status: "REJECTED",
      validUntil: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      subtotal: 2000,
      taxRate: 10,
      tax: 200,
      total: 2200,
      projectId: projects[3].id,
      items: { create: [
        { description: "Monthly maintenance", quantity: 1, unitPrice: 1500 },
        { description: "Bug fixes (up to 10 hours)", quantity: 5, unitPrice: 100 },
      ] },
    },
  })

  // 9. Create Invoices
  console.log("💰 Creating invoices...")
  await prisma.invoice.create({
    data: {
      number: "INV-2024-001",
      status: "PAID",
      issueDate: new Date("2024-01-15"),
      dueDate: new Date("2024-02-15"),
      paidDate: new Date("2024-02-10"),
      subtotal: 5000,
      taxRate: 10,
      tax: 500,
      total: 5500,
      notes: "Thank you for your business! Payment received.",
      projectId: projects[1].id,
      items: { create: [
        { description: "Logo design", quantity: 1, unitPrice: 2000 },
        { description: "Brand guidelines", quantity: 1, unitPrice: 2000 },
        { description: "Business card design", quantity: 1, unitPrice: 1000 },
      ] },
    },
  })

  await prisma.invoice.create({
    data: {
      number: "INV-2024-002",
      status: "SENT",
      issueDate: new Date("2024-02-01"),
      dueDate: new Date("2024-03-01"),
      subtotal: 3000,
      taxRate: 10,
      tax: 300,
      total: 3300,
      notes: "Net 30. Please remit payment by the due date.",
      projectId: projects[0].id,
      items: { create: [
        { description: "Initial design concepts", quantity: 1, unitPrice: 1500 },
        { description: "Wireframes and prototypes", quantity: 1, unitPrice: 1500 },
      ] },
    },
  })

  await prisma.invoice.create({
    data: {
      number: "INV-2024-003",
      status: "OVERDUE",
      issueDate: new Date("2024-01-01"),
      dueDate: new Date("2024-01-31"),
      subtotal: 4000,
      taxRate: 10,
      tax: 400,
      total: 4400,
      notes: "Payment is overdue. Please contact us if you have any questions.",
      projectId: projects[3].id,
      items: { create: [
        { description: "Shopify app development - Phase 1", quantity: 1, unitPrice: 4000 },
      ] },
    },
  })

  await prisma.invoice.create({
    data: {
      number: "INV-2024-004",
      status: "DRAFT",
      issueDate: new Date("2024-02-20"),
      dueDate: new Date("2024-03-20"),
      subtotal: 6000,
      taxRate: 10,
      tax: 600,
      total: 6600,
      notes: "Milestone 2 completion - Dashboard development.",
      projectId: projects[0].id,
      items: { create: [
        { description: "Frontend development - 40 hours", quantity: 40, unitPrice: 100 },
        { description: "Backend API integration", quantity: 20, unitPrice: 100 },
      ] },
    },
  })

  await prisma.invoice.create({
    data: {
      number: "INV-2024-005",
      status: "PAID",
      issueDate: new Date("2024-01-05"),
      dueDate: new Date("2024-02-05"),
      paidDate: new Date("2024-01-28"),
      subtotal: 7500,
      taxRate: 10,
      tax: 750,
      total: 8250,
      projectId: projects[2].id,
      items: { create: [
        { description: "Project setup and architecture", quantity: 1, unitPrice: 3000 },
        { description: "Database design and setup", quantity: 1, unitPrice: 2500 },
        { description: "Initial API development", quantity: 20, unitPrice: 100 },
      ] },
    },
  })

  await prisma.invoice.create({
    data: {
      number: "INV-2024-006",
      status: "CANCELLED",
      issueDate: new Date("2023-12-01"),
      dueDate: new Date("2023-12-31"),
      subtotal: 2500,
      taxRate: 10,
      tax: 250,
      total: 2750,
      notes: "Project was cancelled. This invoice has been voided.",
      projectId: projects[6].id,
      items: { create: [
        { description: "Online ordering system - Initial work", quantity: 1, unitPrice: 2500 },
      ] },
    },
  })

  // 10. Create Activity Logs
  console.log("📊 Creating activity logs...")
  const activities = [
    { action: "created", entity: "client", user: 0, hoursAgo: 2 },
    { action: "updated", entity: "project", user: 0, hoursAgo: 5 },
    { action: "created", entity: "task", user: 1, hoursAgo: 8 },
    { action: "completed", entity: "task", user: 2, hoursAgo: 12 },
    { action: "sent", entity: "proposal", user: 0, hoursAgo: 24 },
    { action: "created", entity: "invoice", user: 0, hoursAgo: 30 },
    { action: "updated", entity: "client", user: 1, hoursAgo: 48 },
    { action: "created", entity: "project", user: 0, hoursAgo: 72 },
    { action: "invoiced", entity: "client", user: 0, hoursAgo: 96 },
    { action: "proposed", entity: "client", user: 1, hoursAgo: 120 },
  ]

  for (const activity of activities) {
    await prisma.activityLog.create({
      data: {
        action: activity.action,
        entity: activity.entity,
        entityId: "seed-id",
        metadata: JSON.stringify({ name: `${activity.entity} example` }),
        userId: userIds[activity.user],
        orgId: organization.id,
        createdAt: new Date(now.getTime() - activity.hoursAgo * 60 * 60 * 1000),
      },
    })
  }

  console.log("\n✅ Seed completed successfully!\n")
  console.log("📊 Summary:")
  console.log(`  - Organization: 1`)
  console.log(`  - Users: 4 (1 OWNER, 1 ADMIN, 2 MEMBER)`)
  console.log(`  - Clients: ${clients.length}`)
  console.log(`  - Projects: ${projects.length}`)
  console.log(`  - Tasks: ${taskData.length}`)
  console.log(`  - Time Entries: ${timeEntries.length}`)
  console.log(`  - Proposals: 4`)
  console.log(`  - Invoices: 6`)
  console.log(`  - Activity Logs: ${activities.length}`)
  console.log("\n🔑 Login credentials:")
  console.log("  Email: jose@freelancestudio.com")
  console.log("  Password: password123\n")
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); })
