import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Plus, Clock, DollarSign, Users, Edit, Power } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { DeleteServiceButton, ToggleActiveButton } from "./_components/ServiceActions";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const business = await prisma.business.findUnique({
    where: { ownerId: session.user.id },
    include: {
      services: {
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { appointments: true } },
        },
      },
    },
  });

  if (!business) {
    redirect("/dashboard/business/onboarding");
  }

  const activeServices = business.services.filter((s) => s.active);
  const inactiveServices = business.services.filter((s) => !s.active);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Servicios</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los servicios que ofreces a tus clientes
          </p>
        </div>
        <ButtonLink href="/dashboard/business/services/new">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo servicio
        </ButtonLink>
      </div>

      {business.services.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 font-semibold">No tienes servicios aún</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Crea tu primer servicio para empezar a recibir reservas
            </p>
            <ButtonLink href="/dashboard/business/services/new" className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Crear primer servicio
            </ButtonLink>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Servicios activos */}
          {activeServices.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">
                Activos ({activeServices.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeServices.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            </div>
          )}

          {/* Servicios inactivos */}
          {inactiveServices.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-muted-foreground">
                Inactivos ({inactiveServices.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {inactiveServices.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ServiceCard({ service }: { service: any }) {
  return (
    <Card className={!service.active ? "opacity-60" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{service.name}</CardTitle>
            {service.description && (
              <CardDescription className="line-clamp-2 mt-1">
                {service.description}
              </CardDescription>
            )}
          </div>
          <Badge variant={service.active ? "default" : "secondary"}>
            {service.active ? "Activo" : "Inactivo"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            {service.duration} min
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-3 w-3" />
            {service.maxBookingsPerSlot} por slot
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-2xl font-bold">
            {formatCurrency(Number(service.price), service.currency)}
          </p>
          <p className="text-xs text-muted-foreground">
            {service._count.appointments} reservas
          </p>
        </div>
        <div className="flex gap-2 pt-2">
          <ButtonLink
            href={`/dashboard/business/services/${service.id}`}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Edit className="mr-1 h-3 w-3" />
            Editar
          </ButtonLink>
          <ToggleActiveButton serviceId={service.id} isActive={service.active} />
          <DeleteServiceButton
            serviceId={service.id}
            serviceName={service.name}
            hasAppointments={service._count.appointments > 0}
          />
        </div>
      </CardContent>
    </Card>
  );
}
