import { setRequestLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NotificationPrefsForm } from "@/components/settings/notification-prefs-form";

export default async function NotificationPrefsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      notifyEmailReplies: true,
      notifyEmailMentions: true,
      notifyEmailStatus: true,
      notifyEmailCsat: true,
      notifyEmailAssign: true,
    },
  });
  if (!user) {
    return null;
  }

  const t = await getTranslations("NotificationPrefs");

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </div>

      <NotificationPrefsForm
        defaults={{
          notifyEmailReplies: user.notifyEmailReplies,
          notifyEmailMentions: user.notifyEmailMentions,
          notifyEmailStatus: user.notifyEmailStatus,
          notifyEmailCsat: user.notifyEmailCsat,
          notifyEmailAssign: user.notifyEmailAssign,
        }}
      />
    </div>
  );
}
