import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Toaster } from "@/components/ui/sonner";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { NotificationsBell } from "@/components/layout/notifications-bell";
import { CsatBanner } from "@/components/ratings/csat-banner";
import { SkipLink } from "@/components/layout/skip-link";
import { getActiveOrg } from "@/lib/org-context";
import {
  listNotifications,
  unreadNotificationCount,
} from "@/lib/queries/notifications";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; orgSlug: string }>;
}) {
  const { locale, orgSlug } = await params;
  setRequestLocale(locale);

  const { user, org, membership } = await getActiveOrg(orgSlug);

  const [unread, notifications] = await Promise.all([
    unreadNotificationCount(user.id),
    listNotifications(user.id),
  ]);

  return (
    <div
      className="flex flex-1 flex-col"
      data-user-id={user.id}
      data-org-slug={orgSlug}
    >
      <SkipLink />
      <CsatBanner orgId={org.id} userId={user.id} role={membership.role} />

      <header className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href={`/app/${orgSlug}/tickets`} className="font-semibold">
            {org.name}
          </Link>
          <nav className="text-muted-foreground flex items-center gap-4 text-sm">
            {membership.role === "CUSTOMER" ? (
              <>
                <Link
                  href={`/app/${orgSlug}/settings/profile`}
                  className="hover:text-foreground"
                >
                  Profile
                </Link>
                <Link
                  href={`/app/${orgSlug}/settings/notifications`}
                  className="hover:text-foreground"
                >
                  Notifications
                </Link>
                <Link
                  href={`/app/${orgSlug}/settings/profile`}
                  className="hover:text-foreground"
                >
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={`/app/${orgSlug}/tickets`}
                  className="hover:text-foreground"
                >
                  Tickets
                </Link>
                <Link
                  href={`/app/${orgSlug}/my-tickets`}
                  className="hover:text-foreground"
                >
                  Mine
                </Link>
                <Link
                  href={`/app/${orgSlug}/canned-responses`}
                  className="hover:text-foreground"
                >
                  Canned
                </Link>
                <Link
                  href={`/app/${orgSlug}/reports`}
                  className="hover:text-foreground"
                >
                  Reports
                </Link>
                <Link
                  href={`/app/${orgSlug}/activity`}
                  className="hover:text-foreground"
                >
                  Activity
                </Link>
                <Link
                  href={`/app/${orgSlug}/settings/members`}
                  className="hover:text-foreground"
                >
                  Members
                </Link>
                <Link
                  href={`/app/${orgSlug}/settings/profile`}
                  className="hover:text-foreground"
                >
                  Profile
                </Link>
                {membership.role === "ADMIN" ? (
                  <>
                    <Link
                      href={`/app/${orgSlug}/trash`}
                      className="hover:text-foreground"
                    >
                      Trash
                    </Link>
                    <Link
                      href={`/app/${orgSlug}/webhooks`}
                      className="hover:text-foreground"
                    >
                      Webhooks
                    </Link>
                    <Link
                      href={`/app/${orgSlug}/settings`}
                      className="hover:text-foreground"
                    >
                      Settings
                    </Link>
                    <Link
                      href={`/app/${orgSlug}/tags`}
                      className="hover:text-foreground"
                    >
                      Tags
                    </Link>
                  </>
                ) : null}
              </>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <NotificationsBell
            initialUnread={unread}
            initialItems={notifications.map((n) => ({
              ...n,
              createdAt: n.createdAt.toISOString(),
            }))}
          />
          <LocaleSwitcher />
          <span className="text-muted-foreground text-xs">
            {membership.role.toLowerCase()}
          </span>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="flex-1 p-6 outline-none">
        {children}
      </main>
      <Toaster />
    </div>
  );
}
