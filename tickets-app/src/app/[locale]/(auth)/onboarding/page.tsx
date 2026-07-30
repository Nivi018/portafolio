import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { OnboardingForm } from "@/components/auth/onboarding-form";

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const firstMembership = await db.membership.findFirst({
    where: { userId: session.user.id },
    include: { org: true },
    orderBy: { joinedAt: "asc" },
  });

  if (firstMembership) {
    redirect(`/app/${firstMembership.org.slug}`);
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <OnboardingForm />
    </main>
  );
}
