import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Calendar, CreditCard, AlertCircle } from "lucide-react";
import { formatCurrency, formatDate, formatTime, PAYMENT_STATUS_LABELS } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function BusinessPaymentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const business = await prisma.business.findUnique({
    where: { ownerId: session.user.id },
  });

  if (!business) {
    redirect("/dashboard/business/onboarding");
  }

  // Obtener pagos con relaciones
  const payments = await prisma.payment.findMany({
    where: {
      appointment: {
        businessId: business.id,
      },
    },
    include: {
      appointment: {
        include: {
          service: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Estadísticas
  const totalRevenue = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const pendingRevenue = payments
    .filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const monthlyRevenue = payments
    .filter((p) => p.status === "PAID" && p.createdAt >= startOfMonth)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const paidCount = payments.filter((p) => p.status === "PAID").length;
  const pendingCount = payments.filter((p) => p.status === "PENDING").length;
  const failedCount = payments.filter((p) => p.status === "FAILED").length;

  const stats = [
    { label: "Ingresos totales", value: formatCurrency(totalRevenue), icon: DollarSign, color: "text-green-600" },
    { label: "Ingresos del mes", value: formatCurrency(monthlyRevenue), icon: TrendingUp, color: "text-blue-600" },
    { label: "Pagos pendientes", value: formatCurrency(pendingRevenue), icon: Calendar, color: "text-yellow-600" },
    { label: "Pagos completados", value: paidCount.toString(), icon: CreditCard, color: "text-purple-600" },
  ];

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    PAID: "bg-green-100 text-green-800 border-green-200",
    FAILED: "bg-red-100 text-red-800 border-red-200",
    REFUNDED: "bg-gray-100 text-gray-800 border-gray-200",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pagos</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona los pagos y transacciones de tu negocio
        </p>
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

      {/* Alerta de Stripe */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-sm text-blue-900">
              Configuración de Stripe
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Para recibir pagos en línea, configura las variables
              <code className="bg-blue-100 px-1 rounded mx-1">STRIPE_SECRET_KEY</code>
              y
              <code className="bg-blue-100 px-1 rounded mx-1">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>
              en tu archivo .env
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Lista de pagos */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de pagos</CardTitle>
          <CardDescription>
            {payments.length} transacción{payments.length === 1 ? "" : "es"} en total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 font-semibold">No hay pagos aún</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Los pagos de tus reservas aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">
                        {payment.appointment?.service?.name || "Servicio"}
                      </p>
                      <Badge
                        variant="outline"
                        className={statusColors[payment.status]}
                      >
                        {PAYMENT_STATUS_LABELS[payment.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {payment.appointment?.clientName || "Cliente"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {payment.appointment && formatDate(payment.appointment.date)} •{" "}
                      {payment.appointment && formatTime(payment.appointment.startTime)}
                    </p>
                    {payment.stripePaymentId && (
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        {payment.stripePaymentId.substring(0, 20)}...
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">
                      {formatCurrency(Number(payment.amount), payment.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(payment.createdAt).toLocaleDateString("es-MX")}
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
