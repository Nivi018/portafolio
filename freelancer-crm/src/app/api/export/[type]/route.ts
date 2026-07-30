import { NextRequest, NextResponse } from "next/server"
import Papa from "papaparse"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { type } = await params
    const orgId = session.user.orgId

    let csv = ""
    let filename = ""

    switch (type) {
      case "clients": {
        const clients = await prisma.client.findMany({
          where: { orgId },
          orderBy: { name: "asc" },
        })
        csv = Papa.unparse(
          clients.map((c) => ({
            Name: c.name,
            Email: c.email || "",
            Phone: c.phone || "",
            Company: c.company || "",
            Status: c.status,
            Address: c.address || "",
            Notes: c.notes || "",
            Created: formatDate(c.createdAt),
          }))
        )
        filename = `clients-${new Date().toISOString().split("T")[0]}.csv`
        break
      }

      case "projects": {
        const projects = await prisma.project.findMany({
          where: { orgId },
          orderBy: { createdAt: "desc" },
          include: {
            client: { select: { name: true } },
          },
        })
        csv = Papa.unparse(
          projects.map((p) => ({
            Name: p.name,
            Client: p.client.name,
            Status: p.status,
            Priority: p.priority,
            Budget: p.budget || "",
            HourlyRate: p.hourlyRate || "",
            StartDate: p.startDate ? formatDate(p.startDate) : "",
            Deadline: p.deadline ? formatDate(p.deadline) : "",
            Created: formatDate(p.createdAt),
          }))
        )
        filename = `projects-${new Date().toISOString().split("T")[0]}.csv`
        break
      }

      case "invoices": {
        const invoices = await prisma.invoice.findMany({
          where: { project: { orgId } },
          orderBy: { createdAt: "desc" },
          include: {
            project: {
              include: { client: { select: { name: true } } },
            },
          },
        })
        csv = Papa.unparse(
          invoices.map((i) => ({
            Number: i.number,
            Client: i.project.client.name,
            Project: i.project.name,
            Status: i.status,
            Subtotal: i.subtotal.toFixed(2),
            TaxRate: `${i.taxRate}%`,
            Tax: i.tax.toFixed(2),
            Total: i.total.toFixed(2),
            IssueDate: formatDate(i.issueDate),
            DueDate: formatDate(i.dueDate),
            PaidDate: i.paidDate ? formatDate(i.paidDate) : "",
          }))
        )
        filename = `invoices-${new Date().toISOString().split("T")[0]}.csv`
        break
      }

      case "proposals": {
        const proposals = await prisma.proposal.findMany({
          where: { project: { orgId } },
          orderBy: { createdAt: "desc" },
          include: {
            project: {
              include: { client: { select: { name: true } } },
            },
          },
        })
        csv = Papa.unparse(
          proposals.map((p) => ({
            Title: p.title,
            Client: p.project.client.name,
            Project: p.project.name,
            Status: p.status,
            Subtotal: p.subtotal.toFixed(2),
            TaxRate: `${p.taxRate}%`,
            Tax: p.tax.toFixed(2),
            Total: p.total.toFixed(2),
            ValidUntil: p.validUntil ? formatDate(p.validUntil) : "",
            Created: formatDate(p.createdAt),
          }))
        )
        filename = `proposals-${new Date().toISOString().split("T")[0]}.csv`
        break
      }

      case "time-entries": {
        const entries = await prisma.timeEntry.findMany({
          where: { project: { orgId } },
          orderBy: { startTime: "desc" },
          include: {
            project: { select: { name: true } },
            task: { select: { title: true } },
            user: { select: { name: true, email: true } },
          },
        })
        csv = Papa.unparse(
          entries.map((e) => ({
            Date: formatDate(e.startTime),
            User: e.user.name || e.user.email,
            Project: e.project.name,
            Task: e.task?.title || "",
            Description: e.description || "",
            DurationHours: e.duration ? (e.duration / 3600).toFixed(2) : "",
            IsRunning: e.isRunning ? "Yes" : "No",
          }))
        )
        filename = `time-entries-${new Date().toISOString().split("T")[0]}.csv`
        break
      }

      case "tasks": {
        const tasks = await prisma.task.findMany({
          where: { project: { orgId } },
          orderBy: { createdAt: "desc" },
          include: {
            project: { select: { name: true } },
            assignee: { select: { name: true, email: true } },
          },
        })
        csv = Papa.unparse(
          tasks.map((t) => ({
            Title: t.title,
            Project: t.project.name,
            Status: t.status,
            Priority: t.priority,
            Assignee: t.assignee?.name || t.assignee?.email || "Unassigned",
            DueDate: t.dueDate ? formatDate(t.dueDate) : "",
            EstimatedHours: t.estimatedHours || "",
            Created: formatDate(t.createdAt),
          }))
        )
        filename = `tasks-${new Date().toISOString().split("T")[0]}.csv`
        break
      }

      default:
        return NextResponse.json(
          { error: "Invalid export type. Use: clients, projects, invoices, proposals, time-entries, tasks" },
          { status: 400 }
        )
    }

    // Return CSV
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    )
  }
}
