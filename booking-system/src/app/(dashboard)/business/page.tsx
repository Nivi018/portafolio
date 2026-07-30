import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Badge } from "@/components/ui/badge";
import { Calendar, Briefcase, DollarSign, Users, Plus, ArrowRight, Clock } from "lucide-react";
import { formatCurrency, formatDate, formatTime, APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_COLORS } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BusinessDashboard() {
  const session = await auth();

  if (!session?.user) return null;

  const business = await prisma.business.findUnique({
    where: { ownerId: session.user.id },
    include: {
      services: { where: { active: true } },
    },
  });

  if (!business) {
    redirect("/dashboard/business/onboarding");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [todayAppointments, monthAppointments, pendingCount, totalClients] =
    await Promise.all([
      prisma.appointment.findMany({
        where: {
          businessId: business.id,
          date: today,
          status: { in: ["PENDING", "CONFIRMED"] },
        },
        include: {
          service: true,
          client: true,
        },
        orderBy: { startTime: "asc" },
      }),
      prisma.appointment.findMany({
        where: {
          businessId: business.id,
          date: { gte: startOfMonth },
          status: "COMPLETED",
        },
        include: { service: true },
      }),
      prisma.appointment.count({
        where: {
          businessId: business.id,
          status: "PENDING",
        },
      }),
      prisma.appointment.findMany({
        where: { businessId: business.id },
        distinct: ["clientId"],
        select: { clientId: true },
      }),
    ]);

  const monthRevenue = monthAppointments.reduce(
    (sum, apt) => sum + Number(apt.service.price),
    0
  );

  const stats = [
    {
      label: "Reservas hoy",
      value: todayAppointments.length,
      icon: Calendar,
      color: "text-blue-600",
    },
    {
      label: "Pendientes",
      value: pendingCount,
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      label: "Ingresos del mes",
      value: formatCurrency(monthRevenue),
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      label: "Clientes totales",
      value: totalClients.length,
      icon: Users,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{business.name}</h1>
          <p className="text-muted-foreground mt-1">
            Panel de control de tu negocio
          </p>
        </div>
        <ButtonLink href="/businesses">
          Ver página pública
          <ArrowRight className="ml-2 h-4 w-4" />
        </ButtonLink>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full bg-muted ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Reservas de hoy</CardTitle>
              <CardDescription>
                {todayAppointments.length === 0
                  ? "No tienes reservas para hoy"
                  : `${todayAppointments.length} reserva${todayAppointments.length === 1 ? "" : "s"} agendada${todayAppointments.length === 1 ? "" : "s"}`}
              </CardDescription>
            </div>
            <ButtonLink href="/dashboard/business/appointments" variant="ghost" size="sm">
              Ver todas
              <ArrowRight className="ml-2 h-4 w-4" />
            </ButtonLink>
          </CardHeader>
          <CardContent>
            {todayAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground mt-2">
                  Tu día está libre
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <p className="text-sm font-bold">
                          {formatTime(apt.startTime)}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {apt.clientName || apt.client.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {apt.service.name}
                        </p>
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

        {/* Services */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Tus servicios</CardTitle>
              <CardDescription>
                {business.services.length} servicio{business.services.length === 1 ? "" : "s"} activo{business.services.length === 1 ? "" : "s"}
              </CardDescription>
            </div>
            <ButtonLink href="/dashboard/business/services/new" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo
            </ButtonLink>
          </CardHeader>
          <CardContent>
            {business.services.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground mt-2">
                  Aún no tienes servicios
                </p>
                <ButtonLink href="/dashboard/business/services/new" className="mt-3" size="sm">
                  Crear primer servicio
                </ButtonLink>
              </div>
            ) : (
              <div className="space-y-2">
                {business.services.slice(0, 4).map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium text-sm">{service.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {service.duration} min
                      </p>
                    </div>
                    <p className="font-semibold">
                      {formatCurrency(Number(service.price), service.currency)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
