import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { ScheduleForm } from "./_components/ScheduleForm";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const business = await prisma.business.findUnique({
    where: { ownerId: session.user.id },
    include: {
      businessHours: {
        orderBy: { dayOfWeek: "asc" },
      },
    },
  });

  if (!business) {
    redirect("/dashboard/business/onboarding");
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Horarios</h1>
        <p className="text-muted-foreground mt-1">
          Configura los días y horarios en que atiendes a tus clientes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horario de atención
          </CardTitle>
          <CardDescription>
            Define cuándo estás disponible para recibir reservas. Los clientes
            solo podrán reservar en los días y horarios que configures.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScheduleForm
            initialSchedule={business.businessHours.map((h) => ({
              dayOfWeek: h.dayOfWeek,
              openTime: h.openTime,
              closeTime: h.closeTime,
              isActive: h.isActive,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
