import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Calendar, Clock, MapPin, Phone, Mail, Globe } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { formatCurrency, DAYS_LABELS_ES } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BusinessPublicPage({ params }: PageProps) {
  const { slug } = await params;

  const business = await prisma.business.findUnique({
    where: { slug, active: true },
    include: {
      services: {
        where: { active: true },
        orderBy: { price: "asc" },
      },
      businessHours: {
        where: { isActive: true },
        orderBy: { dayOfWeek: "asc" },
      },
    },
  });

  if (!business) {
    notFound();
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-muted/30">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-purple-500/10 border-b">
          <div className="container mx-auto px-4 py-12">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {business.logo ? (
                <img
                  src={business.logo}
                  alt={business.name}
                  className="h-24 w-24 rounded-2xl object-cover border-4 border-background shadow-lg"
                />
              ) : (
                <div className="h-24 w-24 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-3xl font-bold shadow-lg">
                  {business.name[0]}
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  {business.name}
                </h1>
                {business.description && (
                  <p className="mt-2 text-muted-foreground max-w-2xl">
                    {business.description}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {business.address && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {business.address}
                    </div>
                  )}
                  {business.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {business.phone}
                    </div>
                  )}
                  {business.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {business.email}
                    </div>
                  )}
                  {business.website && (
                    <div className="flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      <a
                        href={business.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary"
                      >
                        Sitio web
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Services */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-2xl font-bold">Nuestros servicios</h2>
              {business.services.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">
                      Este negocio aún no tiene servicios disponibles
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {business.services.map((service) => (
                    <Card key={service.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{service.name}</h3>
                            {service.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {service.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {service.duration} min
                              </div>
                            </div>
                          </div>
                          <p className="text-lg font-bold">
                            {formatCurrency(
                              Number(service.price),
                              service.currency
                            )}
                          </p>
                        </div>
                        <ButtonLink
                          href={`/business/${business.slug}/book?service=${service.id}`}
                          className="w-full mt-4"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          Reservar
                        </ButtonLink>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-3">Horarios de atención</h3>
                  {business.businessHours.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No hay horarios configurados
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {business.businessHours.map((hours) => (
                        <div
                          key={hours.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="font-medium">
                            {DAYS_LABELS_ES[hours.dayOfWeek]}
                          </span>
                          <span className="text-muted-foreground">
                            {hours.openTime} - {hours.closeTime}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
