import "./send";

const BRAND_COLOR = "#0ea5e9";

function layout({
  title,
  body,
  ctaUrl,
  ctaLabel,
}: {
  title: string;
  body: string;
  ctaUrl?: string;
  ctaLabel?: string;
}): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
            <tr>
              <td>
                <h1 style="margin:0 0 16px 0;font-size:20px;font-weight:600;color:#0f172a;">${title}</h1>
                <div style="font-size:15px;line-height:1.6;color:#334155;">${body}</div>
                ${
                  ctaUrl && ctaLabel
                    ? `<p style="margin:24px 0 0 0;"><a href="${ctaUrl}" style="display:inline-block;background:${BRAND_COLOR};color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:500;font-size:14px;">${ctaLabel}</a></p>`
                    : ""
                }
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0 0;font-size:12px;color:#94a3b8;">Powered by Tickets App</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export type OrgInviteEmailArgs = {
  orgName: string;
  inviterName: string;
  inviteUrl: string;
  locale: "en" | "es";
};

export function renderOrgInviteEmail(args: OrgInviteEmailArgs): {
  subject: string;
  html: string;
  text: string;
} {
  const t = args.locale === "es" ? TEXTS.es : TEXTS.en;
  const subject = t.inviteSubject({ org: args.orgName });
  const body = t.inviteBody({
    org: args.orgName,
    inviter: args.inviterName,
    cta: `<a href="${args.inviteUrl}" style="color:${BRAND_COLOR};">${args.inviteUrl}</a>`,
  });
  return {
    subject,
    html: layout({
      title: t.inviteTitle,
      body,
      ctaUrl: args.inviteUrl,
      ctaLabel: t.inviteCta,
    }),
    text: t.inviteText({
      org: args.orgName,
      inviter: args.inviterName,
      url: args.inviteUrl,
    }),
  };
}

export type ReplyEmailArgs = {
  orgName: string;
  ticketSubject: string;
  authorName: string;
  replyBody: string;
  ticketUrl: string;
  isInternal: boolean;
  locale: "en" | "es";
};

export function renderReplyEmail(args: ReplyEmailArgs): {
  subject: string;
  html: string;
  text: string;
} {
  const t = args.locale === "es" ? TEXTS.es : TEXTS.en;
  const isInternal = args.isInternal;
  const subject = t.replySubject({
    org: args.orgName,
    subject: args.ticketSubject,
  });
  const body = t.replyBody({
    author: args.authorName,
    body: escapeHtml(args.replyBody),
    internal: isInternal
      ? `<p style="margin:16px 0;padding:12px;background:#fef9c3;border-radius:6px;color:#713f12;font-size:13px;">⚠️ ${t.internalNote}</p>`
      : "",
  });
  return {
    subject,
    html: layout({
      title: t.replyTitle,
      body,
      ctaUrl: args.ticketUrl,
      ctaLabel: t.viewTicket,
    }),
    text: t.replyText({
      author: args.authorName,
      body: args.replyBody,
      url: args.ticketUrl,
    }),
  };
}

export type AssignedEmailArgs = {
  orgName: string;
  ticketSubject: string;
  assigneeName: string;
  ticketUrl: string;
  locale: "en" | "es";
};

export function renderAssignedEmail(args: AssignedEmailArgs): {
  subject: string;
  html: string;
  text: string;
} {
  const t = args.locale === "es" ? TEXTS.es : TEXTS.en;
  const subject = t.assignedSubject({ subject: args.ticketSubject });
  const body = t.assignedBody({ assignee: args.assigneeName });
  return {
    subject,
    html: layout({
      title: t.assignedTitle,
      body,
      ctaUrl: args.ticketUrl,
      ctaLabel: t.viewTicket,
    }),
    text: t.assignedText({ url: args.ticketUrl }),
  };
}

export type CsatEmailArgs = {
  orgName: string;
  ticketSubject: string;
  customerName: string;
  rateUrl: string;
  locale: "en" | "es";
};

export function renderCsatEmail(args: CsatEmailArgs): {
  subject: string;
  html: string;
  text: string;
} {
  const t = args.locale === "es" ? TEXTS.es : TEXTS.en;
  const subject = t.csatSubject({
    org: args.orgName,
    subject: args.ticketSubject,
  });
  const body = t.csatBody({ name: args.customerName });
  return {
    subject,
    html: layout({
      title: t.csatTitle,
      body,
      ctaUrl: args.rateUrl,
      ctaLabel: t.csatCta,
    }),
    text: t.csatText({ name: args.customerName, url: args.rateUrl }),
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br>");
}

const TEXTS = {
  en: {
    inviteTitle: "You've been invited",
    inviteCta: "Accept invitation",
    inviteSubject: ({ org }: { org: string }) =>
      `You've been invited to ${org}`,
    inviteBody: ({
      org,
      inviter,
      cta,
    }: {
      org: string;
      inviter: string;
      cta: string;
    }) =>
      `<p><strong>${escapeHtml(inviter)}</strong> invited you to join <strong>${escapeHtml(org)}</strong> on Tickets App.</p><p>Click the button below to accept. If the button doesn't work, copy this link into your browser:</p><p>${cta}</p>`,
    inviteText: ({
      org,
      inviter,
      url,
    }: {
      org: string;
      inviter: string;
      url: string;
    }) =>
      `${inviter} invited you to join ${org} on Tickets App.\n\nAccept the invitation: ${url}`,
    replyTitle: "New reply on ticket",
    replySubject: ({ org, subject }: { org: string; subject: string }) =>
      `[${org}] New reply: ${subject}`,
    viewTicket: "View ticket",
    replyBody: ({
      author,
      body,
      internal,
    }: {
      author: string;
      body: string;
      internal: string;
    }) =>
      `<p><strong>${escapeHtml(author)}</strong> replied:</p><blockquote style="margin:16px 0;padding:12px;border-left:3px solid ${BRAND_COLOR};background:#f1f5f9;border-radius:4px;color:#334155;">${body}</blockquote>${internal}`,
    replyText: ({
      author,
      body,
      url,
    }: {
      author: string;
      body: string;
      url: string;
    }) => `${author} replied:\n\n${body}\n\nView: ${url}`,
    internalNote: "Internal note (only visible to staff)",
    assignedTitle: "A ticket was assigned to you",
    assignedSubject: ({ subject }: { subject: string }) =>
      `Ticket assigned: ${subject}`,
    assignedBody: ({ assignee }: { assignee: string }) =>
      `<p>Hi <strong>${escapeHtml(assignee)}</strong>,</p><p>A ticket has been assigned to you. Click the button below to view it.</p>`,
    assignedText: ({ url }: { url: string }) =>
      `A ticket has been assigned to you.\n\nView: ${url}`,
    csatTitle: "How did we do?",
    csatCta: "Rate your experience",
    csatSubject: ({ org, subject }: { org: string; subject: string }) =>
      `[${org}] How was your support? — ${subject}`,
    csatBody: ({ name }: { name: string }) =>
      `<p>Hi <strong>${escapeHtml(name)}</strong>,</p><p>Your ticket was marked as resolved. We'd love to hear how we did. Please take a moment to rate your experience.</p>`,
    csatText: ({ name, url }: { name: string; url: string }) =>
      `Hi ${name},\n\nYour ticket was marked as resolved. Please rate your experience: ${url}`,
  },
  es: {
    inviteTitle: "Has sido invitado",
    inviteCta: "Aceptar invitación",
    inviteSubject: ({ org }: { org: string }) => `Has sido invitado a ${org}`,
    inviteBody: ({
      org,
      inviter,
      cta,
    }: {
      org: string;
      inviter: string;
      cta: string;
    }) =>
      `<p><strong>${escapeHtml(inviter)}</strong> te invitó a unirte a <strong>${escapeHtml(org)}</strong> en Tickets App.</p><p>Haz clic en el botón para aceptar. Si no funciona, copia este enlace en tu navegador:</p><p>${cta}</p>`,
    inviteText: ({
      org,
      inviter,
      url,
    }: {
      org: string;
      inviter: string;
      url: string;
    }) =>
      `${inviter} te invitó a unirte a ${org} en Tickets App.\n\nAcepta la invitación: ${url}`,
    replyTitle: "Nueva respuesta en ticket",
    replySubject: ({ org, subject }: { org: string; subject: string }) =>
      `[${org}] Nueva respuesta: ${subject}`,
    viewTicket: "Ver ticket",
    replyBody: ({
      author,
      body,
      internal,
    }: {
      author: string;
      body: string;
      internal: string;
    }) =>
      `<p><strong>${escapeHtml(author)}</strong> respondió:</p><blockquote style="margin:16px 0;padding:12px;border-left:3px solid ${BRAND_COLOR};background:#f1f5f9;border-radius:4px;color:#334155;">${body}</blockquote>${internal}`,
    replyText: ({
      author,
      body,
      url,
    }: {
      author: string;
      body: string;
      url: string;
    }) => `${author} respondió:\n\n${body}\n\nVer: ${url}`,
    internalNote: "Nota interna (solo visible para el equipo)",
    assignedTitle: "Un ticket fue asignado a ti",
    assignedSubject: ({ subject }: { subject: string }) =>
      `Ticket asignado: ${subject}`,
    assignedBody: ({ assignee }: { assignee: string }) =>
      `<p>Hola <strong>${escapeHtml(assignee)}</strong>,</p><p>Un ticket ha sido asignado a ti. Haz clic en el botón para verlo.</p>`,
    assignedText: ({ url }: { url: string }) =>
      `Un ticket ha sido asignado a ti.\n\nVer: ${url}`,
    csatTitle: "¿Cómo lo hicimos?",
    csatCta: "Califica tu experiencia",
    csatSubject: ({ org, subject }: { org: string; subject: string }) =>
      `[${org}] ¿Cómo fue tu soporte? — ${subject}`,
    csatBody: ({ name }: { name: string }) =>
      `<p>Hola <strong>${escapeHtml(name)}</strong>,</p><p>Tu ticket fue marcado como resuelto. Nos encantaría saber cómo lo hicimos. Tómate un momento para calificar tu experiencia.</p>`,
    csatText: ({ name, url }: { name: string; url: string }) =>
      `Hola ${name},\n\nTu ticket fue marcado como resuelto. Por favor califica tu experiencia: ${url}`,
  },
} as const;
