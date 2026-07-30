import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Calendar, Clock, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatDate, formatTime, APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_COLORS } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ClientDashboard() {
  const session = await auth();

  if (!session?.user) return null;

  const [upcoming, completed, cancelled] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        clientId: session.user.id,
        status: { in: ["PENDING", "CONFIRMED"] },
        date: { gte: new Date() },
      },
      include: {
        service: true,
        business: true,
      },
      orderBy: { date: "asc" },
      take: 5,
    }),
    prisma.appointment.count({
      where: {
        clientId: session.user.id,
        status: "COMPLETED",
      },
    }),
    prisma.appointment.count({
      where: {
        clientId: session.user.id,
        status: "CANCELLED",
      },
    }),
  ]);

  const stats = [
    { label: "Próximas reservas", value: upcoming.length, icon: Calendar, color: "text-blue-600" },
    { label: "Completadas", value: completed, icon: CheckCircle, color: "text-green-600" },
    { label: "Canceladas", value: cancelled, icon: XCircle, color: "text-red-600" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Hola, {session.user.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Bienvenido a tu panel de reservas
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full bg-muted ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upcoming appointments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Próximas reservas</CardTitle>
            <CardDescription>
              Tus citas agendadas para los próximos días
            </CardDescription>
          </div>
          <ButtonLink href="/dashboard/client/appointments" variant="ghost" size="sm">
            Ver todas
            <ArrowRight className="ml-2 h-4 w-4" />
          </ButtonLink>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 font-semibold">No tienes reservas próximas</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Explora los negocios disponibles y agenda tu primera cita
              </p>
              <ButtonLink href="/businesses" className="mt-4">
                Explorar negocios
              </ButtonLink>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((apt) => (
                <div
                  key={apt.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{apt.service.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {apt.business.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(apt.date)} • {formatTime(apt.startTime)}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={APPOINTMENT_STATUS_COLORS[apt.status]}
                  >
                    {APPOINTMENT_STATUS_LABELS[apt.status]}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
