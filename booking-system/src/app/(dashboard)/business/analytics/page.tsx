import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Calendar, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { AnalyticsCharts } from "./_components/AnalyticsCharts";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const business = await prisma.business.findUnique({
    where: { ownerId: session.user.id },
  });

  if (!business) {
    redirect("/dashboard/business/onboarding");
  }

  // Datos de los últimos 6 meses
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const appointments = await prisma.appointment.findMany({
    where: {
      businessId: business.id,
      date: { gte: sixMonthsAgo },
    },
    include: { service: true },
  });

  // Ingresos por mes
  const revenueByMonth: Record<string, number> = {};
  const appointmentsByMonth: Record<string, number> = {};
  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  appointments.forEach((apt) => {
    if (apt.status === "COMPLETED" || apt.status === "CONFIRMED") {
      const date = new Date(apt.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = `${monthNames[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;

      revenueByMonth[label] = (revenueByMonth[label] || 0) + Number(apt.service.price);
      appointmentsByMonth[label] = (appointmentsByMonth[label] || 0) + 1;
    }
  });

  // Top servicios
  const serviceCount: Record<string, { name: string; count: number; revenue: number }> = {};
  appointments.forEach((apt) => {
    const name = apt.service.name;
    if (!serviceCount[name]) {
      serviceCount[name] = { name, count: 0, revenue: 0 };
    }
    serviceCount[name].count++;
    serviceCount[name].revenue += Number(apt.service.price);
  });

  const topServices = Object.values(serviceCount)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Stats generales
  const totalRevenue = appointments
    .filter((a) => a.status === "COMPLETED")
    .reduce((sum, a) => sum + Number(a.service.price), 0);

  const totalAppointments = appointments.length;
  const completedAppointments = appointments.filter((a) => a.status === "COMPLETED").length;
  const cancelledAppointments = appointments.filter((a) => a.status === "CANCELLED").length;
  const uniqueClients = new Set(appointments.map((a) => a.clientId)).size;
  const completionRate = totalAppointments > 0
    ? ((completedAppointments / totalAppointments) * 100).toFixed(1)
    : "0";

  const stats = [
    { label: "Ingresos (6m)", value: formatCurrency(totalRevenue), icon: DollarSign, color: "text-green-600" },
    { label: "Reservas (6m)", value: totalAppointments.toString(), icon: Calendar, color: "text-blue-600" },
    { label: "Clientes únicos", value: uniqueClients.toString(), icon: Users, color: "text-purple-600" },
    { label: "Tasa completado", value: `${completionRate}%`, icon: TrendingUp, color: "text-yellow-600" },
  ];

  // Preparar datos para gráficos
  const chartData = Object.keys(revenueByMonth).map((label) => ({
    month: label,
    revenue: revenueByMonth[label],
    appointments: appointmentsByMonth[label],
  })).slice(-6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analíticas</h1>
        <p className="text-muted-foreground mt-1">
          Estadísticas y rendimiento de tu negocio
        </p>
      </div>

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

      <AnalyticsCharts data={chartData} topServices={topServices} cancelledCount={cancelledAppointments} />
    </div>
  );
}
