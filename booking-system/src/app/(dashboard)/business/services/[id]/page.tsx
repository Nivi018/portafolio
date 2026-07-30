import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { ServiceForm } from "../_components/ServiceForm";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditServicePage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const business = await prisma.business.findUnique({
    where: { ownerId: session.user.id },
  });

  if (!business) {
    redirect("/dashboard/business/onboarding");
  }

  const service = await prisma.service.findUnique({
    where: { id },
  });

  if (!service || service.businessId !== business.id) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <ServiceForm service={service} />
    </div>
  );
}
