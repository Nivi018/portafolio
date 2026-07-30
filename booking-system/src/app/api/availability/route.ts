import { NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/availability";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const serviceId = searchParams.get("serviceId");
    const date = searchParams.get("date");

    if (!businessId || !serviceId || !date) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos" },
        { status: 400 }
      );
    }

    // Validar formato de fecha
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: "Formato de fecha inválido" },
        { status: 400 }
      );
    }

    // Validar que el servicio pertenece al negocio y está activo
    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        businessId,
        active: true,
      },
      select: { id: true, businessId: true, active: true },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Servicio no encontrado o no disponible" },
        { status: 404 }
      );
    }

    // Validar que el negocio está activo
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { active: true },
    });

    if (!business || !business.active) {
      return NextResponse.json(
        { error: "Negocio no disponible" },
        { status: 404 }
      );
    }

    const slots = await getAvailableSlots(businessId, serviceId, date);
    return NextResponse.json({ slots });
  } catch (error) {
    console.error("Error en /api/availability:", error);
    return NextResponse.json(
      { error: "Error al obtener disponibilidad" },
      { status: 500 }
    );
  }
}
