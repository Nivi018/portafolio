import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { AppointmentList } from "./_components/AppointmentList";

export const dynamic = "force-dynamic";

export default async function BusinessAppointmentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const business = await prisma.business.findUnique({
    where: { ownerId: session.user.id },
  });

  if (!business) {
    redirect("/dashboard/business/onboarding");
  }

  const appointments = await prisma.appointment.findMany({
    where: { businessId: business.id },
    include: {
      service: true,
      client: true,
    },
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reservas</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona todas las reservas de tu negocio
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas las reservas</CardTitle>
          <CardDescription>
            {appointments.length} reserva{appointments.length === 1 ? "" : "s"} en total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 font-semibold">No hay reservas aún</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Las reservas que recibas aparecerán aquí
              </p>
            </div>
          ) : (
            <AppointmentList
              appointments={appointments.map((apt) => ({
                id: apt.id,
                date: apt.date,
                startTime: apt.startTime,
                endTime: apt.endTime,
                status: apt.status,
                notes: apt.notes,
                clientName: apt.clientName || apt.client?.name || "Cliente",
                clientEmail: apt.clientEmail || apt.client?.email || "",
                clientPhone: apt.clientPhone || apt.client?.phone,
                service: {
                  name: apt.service.name,
                  duration: apt.service.duration,
                  price: Number(apt.service.price),
                },
              }))}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
