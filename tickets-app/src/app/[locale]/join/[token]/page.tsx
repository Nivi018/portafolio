import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { JoinButton } from "@/components/settings/join-button";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Join");

  const session = await auth();
  if (!session?.user?.id) {
    redirect(
      `/sign-in?callbackUrl=${encodeURIComponent(`/${locale}/join/${token}`)}`,
    );
  }

  const invite = await db.membership.findUnique({
    where: { inviteToken: token },
    include: {
      org: { select: { name: true, slug: true } },
      user: { select: { email: true, name: true } },
    },
  });

  if (!invite) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="max-w-md space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("invalidTitle")}
          </h1>
          <p className="text-muted-foreground text-sm">{t("invalid")}</p>
        </div>
      </main>
    );
  }

  const isCurrentUser = invite.userId === session.user.id;

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("subtitle", {
              org: invite.org.name,
              inviter: invite.user.name ?? invite.user.email,
            })}
          </p>
        </div>

        {!isCurrentUser && session.user.email !== invite.user.email ? (
          <div className="bg-card rounded-lg border p-3 text-sm">
            <p className="text-muted-foreground">
              {t("wrongAccount", {
                expected: invite.user.email,
                current: session.user.email ?? "",
              })}
            </p>
          </div>
        ) : (
          <JoinButton token={token} />
        )}
      </div>
    </main>
  );
}
