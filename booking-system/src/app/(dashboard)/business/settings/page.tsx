import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, CalendarOff } from "lucide-react";
import { BusinessSettingsForm } from "./_components/BusinessSettingsForm";
import { BlockedDatesList } from "./_components/BlockedDatesList";

export const dynamic = "force-dynamic";

export default async function BusinessSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const business = await prisma.business.findUnique({
    where: { ownerId: session.user.id },
    include: {
      blockedDates: {
        orderBy: { date: "asc" },
      },
    },
  });

  if (!business) {
    redirect("/dashboard/business/onboarding");
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona la información de tu negocio
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">
            <Building2 className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="blocked">
            <CalendarOff className="h-4 w-4 mr-2" />
            Fechas bloqueadas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Información del negocio</CardTitle>
              <CardDescription>
                Actualiza los datos públicos de tu negocio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BusinessSettingsForm
                business={{
                  name: business.name,
                  description: business.description,
                  address: business.address,
                  phone: business.phone,
                  email: business.email,
                  website: business.website,
                }}
                slug={business.slug}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blocked">
          <Card>
            <CardHeader>
              <CardTitle>Fechas bloqueadas</CardTitle>
              <CardDescription>
                Bloquea días específicos (vacaciones, feriados) para que no se
                puedan hacer reservas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BlockedDatesList
                blockedDates={business.blockedDates.map((b) => ({
                  id: b.id,
                  date: b.date,
                  reason: b.reason,
                }))}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
