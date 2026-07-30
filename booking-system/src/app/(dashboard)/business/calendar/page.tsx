import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Calendar } from "lucide-react";
import { BusinessCalendar } from "./_components/BusinessCalendar";

export const dynamic = "force-dynamic";

export default async function BusinessCalendarPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const business = await prisma.business.findUnique({
    where: { ownerId: session.user.id },
  });

  if (!business) {
    redirect("/dashboard/business/onboarding");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendario</h1>
        <p className="text-muted-foreground mt-1">
          Vista visual de todas tus reservas
        </p>
      </div>

      <BusinessCalendar businessId={business.id} />
    </div>
  );
}
