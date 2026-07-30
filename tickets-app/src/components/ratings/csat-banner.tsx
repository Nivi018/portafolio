import { getTranslations } from "next-intl/server";
import { listPendingRatings } from "@/lib/queries/csat";
import { CsatBannerClient } from "@/components/ratings/csat-banner-client";

export async function CsatBanner({
  orgId,
  userId,
  role,
}: {
  orgId: string;
  userId: string;
  role: "ADMIN" | "AGENT" | "CUSTOMER";
}) {
  await getTranslations("Csat");

  if (role !== "CUSTOMER") return null;

  const pending = await listPendingRatings(orgId, userId, role);
  if (pending.length === 0) return null;

  const first = pending[0];
  const extra = pending.length - 1;

  return (
    <CsatBannerClient
      subject={first.subject}
      ticketId={first.ticketId}
      orgSlug={first.orgSlug}
      extra={extra}
    />
  );
}
