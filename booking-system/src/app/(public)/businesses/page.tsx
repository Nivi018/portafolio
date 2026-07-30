import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { BusinessesList } from "./BusinessesList";

export const dynamic = "force-dynamic";

export default async function BusinessesPage() {
  const businesses = await prisma.business.findMany({
    where: { active: true },
    include: {
      services: {
        where: { active: true },
        orderBy: { price: "asc" },
        take: 1,
        select: { name: true, price: true, currency: true },
      },
      _count: { select: { appointments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Encuentra tu próximo servicio
            </h1>
            <p className="mt-2 text-muted-foreground">
              Explora los negocios disponibles y agenda tu cita
            </p>
          </div>

          <BusinessesList businesses={businesses} />
        </div>
      </main>
    </>
  );
}
