import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ServiceForm } from "../_components/ServiceForm";

export const dynamic = "force-dynamic";

export default async function NewServicePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const business = await prisma.business.findUnique({
    where: { ownerId: session.user.id },
  });

  if (!business) {
    redirect("/dashboard/business/onboarding");
  }

  return (
    <div className="max-w-2xl mx-auto">
      <ServiceForm />
    </div>
  );
}
