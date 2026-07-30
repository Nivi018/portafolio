import { setRequestLocale, getTranslations } from "next-intl/server";
import { Status } from "@prisma/client";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, PriorityBadge } from "@/components/tickets/status-badge";
import { TicketControls } from "@/components/tickets/ticket-controls";
import { ReplyComposer } from "@/components/replies/reply-composer";
import { ReplyList } from "@/components/replies/reply-list";
import { RatingForm } from "@/components/ratings/rating-form";
import { RatingDisplay } from "@/components/ratings/rating-display";
import { TicketRealtimeListener } from "@/components/realtime/ticket-realtime-listener";
import { getActiveOrg } from "@/lib/org-context";
import { getTicket } from "@/lib/queries/tickets";
import { listTicketReplies } from "@/lib/queries/replies";
import { listOrgAgents } from "@/lib/queries/members";

function formatDateTime(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale === "es" ? "es" : "en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function displayName(
  user: { name: string | null; email: string } | null | undefined,
) {
  if (!user) return "—";
  return user.name ?? user.email;
}

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ locale: string; orgSlug: string; id: string }>;
}) {
  const { locale, orgSlug, id } = await params;
  setRequestLocale(locale);

  const { user, org, membership } = await getActiveOrg(orgSlug);
  const ticket = await getTicket(org.id, id, user.id, membership.role);
  const { items: replies, knownUsernames } = await listTicketReplies(
    ticket.id,
    user.id,
    membership.role,
  );

  const t = await getTranslations("Tickets.detail");
  const tReplies = await getTranslations("Replies");

  return (
    <div className="max-w-3xl space-y-6">
      <TicketRealtimeListener
        orgId={org.id}
        ticketId={ticket.id}
        currentUserId={user.id}
      />

      <div>
        <Link
          href={`/app/${orgSlug}/tickets`}
          className="text-muted-foreground text-sm hover:underline"
        >
          ← {t("backToList")}
        </Link>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {ticket.subject}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t("openedBy", {
            name: displayName(ticket.customer),
            date: formatDateTime(ticket.createdAt, locale),
          })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t("customer")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="font-medium">{displayName(ticket.customer)}</p>
            <p className="text-muted-foreground">{ticket.customer.email}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t("assignee")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {ticket.assignee ? (
              <>
                <p className="font-medium">{displayName(ticket.assignee)}</p>
                <p className="text-muted-foreground">{ticket.assignee.email}</p>
              </>
            ) : (
              <p className="text-muted-foreground">{t("unassigned")}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <TicketControls
        orgSlug={orgSlug}
        ticketId={ticket.id}
        currentStatus={ticket.status}
        currentPriority={ticket.priority}
        currentAssigneeId={ticket.assigneeId}
        role={membership.role}
        agents={
          membership.role === "CUSTOMER"
            ? []
            : (await listOrgAgents(org.id)).map((m) => m.user)
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {t("description")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">
          {tReplies("conversation")}
        </h2>
        <ReplyList
          replies={replies}
          role={membership.role}
          knownUsernames={new Set(knownUsernames)}
        />
        <Card>
          <CardContent className="p-4">
            <ReplyComposer
              orgSlug={orgSlug}
              ticketId={ticket.id}
              role={membership.role}
            />
          </CardContent>
        </Card>
      </div>

      {ticket.status === Status.RESOLVED && ticket.customerId === user.id ? (
        ticket.rating ? (
          <RatingDisplay
            score={ticket.rating.score}
            comment={ticket.rating.comment}
          />
        ) : (
          <RatingForm orgSlug={orgSlug} ticketId={ticket.id} />
        )
      ) : null}

      <div className="flex gap-2">
        <Link
          href={`/app/${orgSlug}/tickets`}
          className={buttonVariants({ variant: "outline" })}
        >
          {t("backToList")}
        </Link>
      </div>
    </div>
  );
}
