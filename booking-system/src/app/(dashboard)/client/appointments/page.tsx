import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";
import { Calendar } from "lucide-react";
import { MyAppointmentsList } from "./_components/MyAppointmentsList";

export const dynamic = "force-dynamic";

export default async function MyAppointmentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Buscar reservas por userId o por email (para reservas sin login)
  const appointments = await prisma.appointment.findMany({
    where: {
      OR: [
        { clientId: session.user.id },
        { clientEmail: session.user.email! },
      ],
    },
    include: {
      service: true,
      business: true,
    },
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mis reservas</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona todas tus citas agendadas
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de reservas</CardTitle>
          <CardDescription>
            {appointments.length} reserva{appointments.length === 1 ? "" : "s"} en total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 font-semibold">No tienes reservas aún</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Explora los negocios y agenda tu primera cita
              </p>
              <ButtonLink href="/businesses" className="mt-4">
                Explorar negocios
              </ButtonLink>
            </div>
          ) : (
            <MyAppointmentsList
              appointments={appointments.map((apt) => ({
                id: apt.id,
                date: apt.date,
                startTime: apt.startTime,
                endTime: apt.endTime,
                status: apt.status,
                notes: apt.notes,
                service: {
                  name: apt.service.name,
                  duration: apt.service.duration,
                  price: Number(apt.service.price),
                },
                business: {
                  name: apt.business.name,
                  slug: apt.business.slug,
                },
              }))}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
