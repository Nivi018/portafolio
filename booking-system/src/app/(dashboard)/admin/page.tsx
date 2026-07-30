import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Calendar, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const session = await auth();

  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard/client");
  }

  const [totalBusinesses, totalUsers, totalAppointments, totalRevenue] =
    await Promise.all([
      prisma.business.count(),
      prisma.user.count(),
      prisma.appointment.count(),
      prisma.appointment.findMany({
        where: { status: "COMPLETED" },
        include: { service: true },
      }),
    ]);

  const revenue = totalRevenue.reduce(
    (sum, apt) => sum + Number(apt.service.price),
    0
  );

  const stats = [
    { label: "Negocios", value: totalBusinesses, icon: Building2, color: "text-blue-600" },
    { label: "Usuarios", value: totalUsers, icon: Users, color: "text-purple-600" },
    { label: "Reservas", value: totalAppointments, icon: Calendar, color: "text-green-600" },
    { label: "Ingresos totales", value: formatCurrency(revenue), icon: DollarSign, color: "text-yellow-600" },
  ];

  const recentBusinesses = await prisma.business.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { owner: true, _count: { select: { appointments: true } } },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Panel de administración</h1>
        <p className="text-muted-foreground mt-1">
          Vista general de la plataforma
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

      <Card>
        <CardHeader>
          <CardTitle>Negocios recientes</CardTitle>
          <CardDescription>Últimos negocios registrados</CardDescription>
        </CardHeader>
        <CardContent>
          {recentBusinesses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aún no hay negocios registrados
            </p>
          ) : (
            <div className="space-y-3">
              {recentBusinesses.map((business) => (
                <div
                  key={business.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{business.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {business.owner.name || business.owner.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {business._count.appointments} reservas
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
