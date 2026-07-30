import { setRequestLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfileForm } from "@/components/settings/profile-form";
import { DeleteAccountSection } from "@/components/settings/delete-account-section";
import { TwoFactorSection } from "@/components/settings/two-factor-section";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) {
    return null; // Layout will redirect to /sign-in
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      preferredLocale: true,
      twoFactorEnabled: true,
    },
  });
  if (!user) {
    return null;
  }

  // 2FA is admin-only; check if the user is an admin in any org.
  const adminMembership = await db.membership.findFirst({
    where: { userId: session.user.id, role: "ADMIN" },
    select: { orgId: true },
  });
  const isAdmin = Boolean(adminMembership);

  const t = await getTranslations("Profile");

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </div>

      <ProfileForm
        defaultName={user.name ?? ""}
        defaultEmail={user.email}
        defaultLocale={(user.preferredLocale as "en" | "es") ?? "en"}
      />

      {isAdmin ? <TwoFactorSection enabled={user.twoFactorEnabled} /> : null}

      <DeleteAccountSection />
    </div>
  );
}
