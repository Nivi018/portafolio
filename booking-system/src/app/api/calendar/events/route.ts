import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const business = await prisma.business.findUnique({
      where: { ownerId: session.user.id },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const where: any = { businessId: business.id };
    if (start && end) {
      where.date = {
        gte: new Date(start),
        lte: new Date(end),
      };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        service: true,
        client: true,
      },
    });

    // Formatear para FullCalendar
    const events = appointments.map((apt) => {
      const dateStr = apt.date.toISOString().split("T")[0];
      const colors: Record<string, string> = {
        PENDING: "#fbbf24",
        CONFIRMED: "#10b981",
        CANCELLED: "#ef4444",
        COMPLETED: "#3b82f6",
        NO_SHOW: "#6b7280",
      };

      return {
        id: apt.id,
        title: `${apt.startTime} - ${apt.clientName || apt.client?.name || "Cliente"}`,
        start: `${dateStr}T${apt.startTime}:00`,
        end: `${dateStr}T${apt.endTime}:00`,
        backgroundColor: colors[apt.status] || "#6b7280",
        borderColor: colors[apt.status] || "#6b7280",
        extendedProps: {
          status: apt.status,
          service: apt.service.name,
          clientName: apt.clientName || apt.client?.name,
          clientEmail: apt.clientEmail || apt.client?.email,
          clientPhone: apt.clientPhone || apt.client?.phone,
          notes: apt.notes,
        },
      };
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error en /api/calendar/events:", error);
    return NextResponse.json(
      { error: "Error al obtener eventos" },
      { status: 500 }
    );
  }
}
