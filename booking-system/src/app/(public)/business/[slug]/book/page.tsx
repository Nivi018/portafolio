import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { BookingFlow } from "./_components/BookingFlow";
import { formatCurrency, DAYS_LABELS_ES } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ service?: string }>;
}

export default async function BookPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { service: preselectedServiceId } = await searchParams;
  const session = await auth();

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

  if (business.services.length === 0) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold">No hay servicios disponibles</h1>
            <p className="text-muted-foreground mt-2">
              Este negocio aún no ha configurado servicios para reservar.
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold">Reservar en {business.name}</h1>
              <p className="text-muted-foreground mt-1">
                Completa los pasos para agendar tu cita
              </p>
            </div>
            <BookingFlow
              business={{
                id: business.id,
                name: business.name,
                slug: business.slug,
                services: business.services.map((s) => ({
                  id: s.id,
                  name: s.name,
                  description: s.description,
                  duration: s.duration,
                  price: Number(s.price),
                  currency: s.currency,
                })),
                businessHours: business.businessHours.map((h) => ({
                  dayOfWeek: h.dayOfWeek,
                  label: DAYS_LABELS_ES[h.dayOfWeek] || h.dayOfWeek,
                  openTime: h.openTime,
                  closeTime: h.closeTime,
                })),
              }}
              currentUser={session?.user ? {
                name: session.user.name || "",
                email: session.user.email || "",
                phone: null,
              } : null}
              preselectedServiceId={preselectedServiceId}
            />
          </div>
        </div>
      </main>
    </>
  );
}
