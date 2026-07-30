import { config as loadEnv } from "dotenv";
import { Priority, Role, Status } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const db = new PrismaClient({ adapter });

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function hoursAgo(n: number): Date {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d;
}

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Clean (in dependency order)
  console.log("  Cleaning existing data...");
  await db.activityLog.deleteMany();
  await db.notification.deleteMany();
  await db.rating.deleteMany();
  await db.attachment.deleteMany();
  await db.ticketReply.deleteMany();
  await db.tag.deleteMany();
  await db.cannedResponse.deleteMany();
  await db.ticket.deleteMany();
  await db.membership.deleteMany();
  await db.organization.deleteMany();
  await db.session.deleteMany();
  await db.account.deleteMany();
  await db.verificationToken.deleteMany();
  await db.user.deleteMany();

  // 2. Users
  console.log("  Creating users...");
  const users = await Promise.all([
    db.user.create({
      data: { email: "admin@acme.test", name: "Alice Admin" },
    }),
    db.user.create({
      data: { email: "agent1@acme.test", name: "Bob Agent" },
    }),
    db.user.create({
      data: { email: "agent2@acme.test", name: "Carol Agent" },
    }),
    db.user.create({
      data: { email: "customer1@acme.test", name: "Dan Customer" },
    }),
    db.user.create({
      data: { email: "customer2@acme.test", name: "Eve Customer" },
    }),
    db.user.create({
      data: { email: "admin@globex.test", name: "Frank Admin" },
    }),
    db.user.create({
      data: { email: "agent@globex.test", name: "Grace Agent" },
    }),
    db.user.create({
      data: { email: "customer@globex.test", name: "Henry Customer" },
    }),
    db.user.create({
      data: { email: "power@multi.test", name: "Pat PowerUser" },
    }),
  ]);

  const byEmail = Object.fromEntries(users.map((u) => [u.email, u]));

  // 3. Organizations
  console.log("  Creating organizations...");
  const acme = await db.organization.create({
    data: {
      slug: "acme-support",
      name: "Acme Support",
      primaryColor: "#0ea5e9",
    },
  });
  const globex = await db.organization.create({
    data: {
      slug: "globex-helpdesk",
      name: "Globex Helpdesk",
      primaryColor: "#a855f7",
    },
  });

  // 4. Memberships
  console.log("  Creating memberships...");
  await db.membership.createMany({
    data: [
      {
        userId: byEmail["admin@acme.test"].id,
        orgId: acme.id,
        role: Role.ADMIN,
        joinedAt: daysAgo(60),
      },
      {
        userId: byEmail["agent1@acme.test"].id,
        orgId: acme.id,
        role: Role.AGENT,
        joinedAt: daysAgo(50),
      },
      {
        userId: byEmail["agent2@acme.test"].id,
        orgId: acme.id,
        role: Role.AGENT,
        joinedAt: daysAgo(45),
      },
      {
        userId: byEmail["customer1@acme.test"].id,
        orgId: acme.id,
        role: Role.CUSTOMER,
        joinedAt: daysAgo(40),
      },
      {
        userId: byEmail["customer2@acme.test"].id,
        orgId: acme.id,
        role: Role.CUSTOMER,
        joinedAt: daysAgo(30),
      },
      {
        userId: byEmail["admin@globex.test"].id,
        orgId: globex.id,
        role: Role.ADMIN,
        joinedAt: daysAgo(35),
      },
      {
        userId: byEmail["agent@globex.test"].id,
        orgId: globex.id,
        role: Role.AGENT,
        joinedAt: daysAgo(28),
      },
      {
        userId: byEmail["customer@globex.test"].id,
        orgId: globex.id,
        role: Role.CUSTOMER,
        joinedAt: daysAgo(20),
      },
      // Multi-org: power@multi.test is ADMIN at acme and CUSTOMER at globex
      {
        userId: byEmail["power@multi.test"].id,
        orgId: acme.id,
        role: Role.ADMIN,
        joinedAt: daysAgo(20),
      },
      {
        userId: byEmail["power@multi.test"].id,
        orgId: globex.id,
        role: Role.CUSTOMER,
        joinedAt: daysAgo(15),
      },
    ],
  });

  // 5. Tags
  console.log("  Creating tags...");
  const tagData = [
    { name: "Bug", color: "#ef4444", orgId: acme.id },
    { name: "Feature", color: "#a855f7", orgId: acme.id },
    { name: "Billing", color: "#22c55e", orgId: acme.id },
    { name: "Question", color: "#0ea5e9", orgId: acme.id },
    { name: "Urgent", color: "#f97316", orgId: acme.id },
    { name: "Onboarding", color: "#eab308", orgId: acme.id },
    { name: "Bug", color: "#ef4444", orgId: globex.id },
    { name: "Feature", color: "#a855f7", orgId: globex.id },
    { name: "Billing", color: "#22c55e", orgId: globex.id },
    { name: "Question", color: "#0ea5e9", orgId: globex.id },
  ];
  await db.tag.createMany({ data: tagData });
  const acmeTags = await db.tag.findMany({ where: { orgId: acme.id } });
  const globexTags = await db.tag.findMany({ where: { orgId: globex.id } });

  // 6. Canned responses
  console.log("  Creating canned responses...");
  await db.cannedResponse.createMany({
    data: [
      {
        orgId: acme.id,
        title: "Greeting",
        body: "Hi! Thanks for reaching out to Acme Support. I'll take a look and get back to you shortly.",
        createdBy: byEmail["admin@acme.test"].id,
      },
      {
        orgId: acme.id,
        title: "Need more info",
        body: "To help me investigate, could you share: 1) the exact steps to reproduce, 2) any error messages, and 3) your browser/device?",
        createdBy: byEmail["agent1@acme.test"].id,
      },
      {
        orgId: acme.id,
        title: "Resolution",
        body: "Glad we could sort this out! If anything else comes up, just reply to this ticket or open a new one.",
        createdBy: byEmail["agent1@acme.test"].id,
      },
      {
        orgId: globex.id,
        title: "Welcome",
        body: "Hello and welcome to Globex Helpdesk. How can we help you today?",
        createdBy: byEmail["admin@globex.test"].id,
      },
    ],
  });

  // 7. Tickets
  console.log("  Creating tickets...");
  type TicketSpec = {
    subject: string;
    description: string;
    status: Status;
    priority: Priority;
    customerEmail: string;
    assigneeEmail?: string;
    tagNames?: string[];
    daysOld: number;
    replies?: {
      authorEmail: string;
      body: string;
      isInternal?: boolean;
      hoursAfter?: number;
    }[];
    rating?: { score: number; comment?: string };
  };

  const acmeTickets: TicketSpec[] = [
    {
      subject: "Login button doesn't work on mobile",
      description:
        "When I try to log in on the mobile app, the button doesn't respond. Tried on iOS and Android.",
      status: Status.IN_PROGRESS,
      priority: Priority.HIGH,
      customerEmail: "customer1@acme.test",
      assigneeEmail: "agent1@acme.test",
      tagNames: ["Bug"],
      daysOld: 3,
      replies: [
        {
          authorEmail: "agent1@acme.test",
          body: "Hi Dan! Sorry to hear that. Could you tell me which app version you have installed?",
          hoursAfter: 1,
        },
        {
          authorEmail: "customer1@acme.test",
          body: "iOS 3.2.1, Android 3.2.0",
          hoursAfter: 3,
        },
        {
          authorEmail: "agent1@acme.test",
          body: "Thanks, I can reproduce on Android 3.2.0. Working on a fix.",
          hoursAfter: 6,
          isInternal: true,
        },
      ],
    },
    {
      subject: "How do I add a team member?",
      description:
        "I bought the team plan and want to invite my colleague. Where do I go?",
      status: Status.RESOLVED,
      priority: Priority.LOW,
      customerEmail: "customer1@acme.test",
      assigneeEmail: "agent2@acme.test",
      tagNames: ["Question", "Onboarding"],
      daysOld: 10,
      replies: [
        {
          authorEmail: "agent2@acme.test",
          body: "Hi! Go to Settings → Members and click 'Invite a member'. They'll get an email with a join link.",
          hoursAfter: 2,
        },
        {
          authorEmail: "customer1@acme.test",
          body: "Perfect, got it. Thanks!",
          hoursAfter: 5,
        },
      ],
      rating: { score: 5, comment: "Super fast response, very helpful!" },
    },
    {
      subject: "Billing question: prorated upgrade?",
      description:
        "If I upgrade from Pro to Enterprise mid-cycle, will I be charged the difference for the remaining days?",
      status: Status.RESOLVED,
      priority: Priority.MEDIUM,
      customerEmail: "customer1@acme.test",
      assigneeEmail: "agent1@acme.test",
      tagNames: ["Billing"],
      daysOld: 14,
      replies: [
        {
          authorEmail: "agent1@acme.test",
          body: "Yes, we prorate to the day. The difference is reflected on your next invoice.",
          hoursAfter: 1,
        },
        {
          authorEmail: "customer1@acme.test",
          body: "Great, that's what I expected.",
          hoursAfter: 4,
        },
      ],
      rating: { score: 4 },
    },
    {
      subject: "Feature request: dark mode",
      description:
        "Would love a dark mode option. The white background is a bit harsh at night.",
      status: Status.OPEN,
      priority: Priority.LOW,
      customerEmail: "customer2@acme.test",
      tagNames: ["Feature"],
      daysOld: 1,
    },
    {
      subject: "Cannot upload PDF larger than 5MB",
      description:
        "Getting an error when uploading PDFs over 5MB. The docs say 10MB should be the limit.",
      status: Status.WAITING_CUSTOMER,
      priority: Priority.MEDIUM,
      customerEmail: "customer2@acme.test",
      assigneeEmail: "agent2@acme.test",
      tagNames: ["Bug"],
      daysOld: 5,
      replies: [
        {
          authorEmail: "agent2@acme.test",
          body: "Thanks for the report. Can you share the exact error message and the file size?",
          hoursAfter: 2,
        },
        {
          authorEmail: "customer2@acme.test",
          body: "Let me check and get back to you",
          hoursAfter: 8,
        },
      ],
    },
    {
      subject: "Webhook signature verification failing",
      description:
        "Our integration can't verify the webhook signature. Following the docs but the HMAC doesn't match.",
      status: Status.IN_PROGRESS,
      priority: Priority.URGENT,
      customerEmail: "customer1@acme.test",
      assigneeEmail: "agent1@acme.test",
      tagNames: ["Bug", "Urgent"],
      daysOld: 1,
      replies: [
        {
          authorEmail: "agent1@acme.test",
          body: "Hi Dan, looking into this right now. Are you using the raw body or the parsed JSON?",
          hoursAfter: 1,
        },
        {
          authorEmail: "agent1@acme.test",
          body: "Common cause is the proxy mangling the body before signature verification.",
          hoursAfter: 2,
          isInternal: true,
        },
      ],
    },
    {
      subject: "Export data to CSV",
      description:
        "We need to export all our tickets for a compliance audit. Is there a way to do this?",
      status: Status.OPEN,
      priority: Priority.MEDIUM,
      customerEmail: "customer1@acme.test",
      tagNames: ["Question"],
      daysOld: 2,
    },
    {
      subject: "Bug: notifications sent twice",
      description:
        "I'm getting duplicate email notifications for the same event.",
      status: Status.CLOSED,
      priority: Priority.LOW,
      customerEmail: "customer2@acme.test",
      assigneeEmail: "agent1@acme.test",
      tagNames: ["Bug"],
      daysOld: 20,
      replies: [
        {
          authorEmail: "agent1@acme.test",
          body: "This was a known issue. We deployed a fix on Monday, please let us know if it persists.",
          hoursAfter: 1,
        },
        {
          authorEmail: "customer2@acme.test",
          body: "Confirmed fixed. Thanks!",
          hoursAfter: 24,
        },
      ],
    },
    {
      subject: "Onboarding session request",
      description:
        "Can we schedule a 30min onboarding call? Our team is new to the platform.",
      status: Status.OPEN,
      priority: Priority.LOW,
      customerEmail: "customer2@acme.test",
      tagNames: ["Onboarding"],
      daysOld: 0,
    },
    {
      subject: "API rate limit error",
      description:
        "We're getting 429s on the /v1/orders endpoint even though we're under the documented limit.",
      status: Status.RESOLVED,
      priority: Priority.HIGH,
      customerEmail: "customer1@acme.test",
      assigneeEmail: "agent1@acme.test",
      tagNames: ["Bug", "Urgent"],
      daysOld: 8,
      replies: [
        {
          authorEmail: "agent1@acme.test",
          body: "The rate limit counter is per API key. Each environment has its own. Can you confirm which key is being throttled?",
          hoursAfter: 1,
        },
        {
          authorEmail: "customer1@acme.test",
          body: "It was our staging key hitting prod's limit. We fixed our config.",
          hoursAfter: 5,
        },
        {
          authorEmail: "agent1@acme.test",
          body: "Perfect, all good!",
          hoursAfter: 6,
        },
      ],
      rating: { score: 5, comment: "Quick diagnosis!" },
    },
    {
      subject: "SSO with Okta",
      description:
        "We use Okta for SSO. Is there a way to enable SAML for our org?",
      status: Status.IN_PROGRESS,
      priority: Priority.MEDIUM,
      customerEmail: "customer1@acme.test",
      assigneeEmail: "agent2@acme.test",
      tagNames: ["Onboarding", "Question"],
      daysOld: 4,
      replies: [
        {
          authorEmail: "agent2@acme.test",
          body: "We support SAML SSO on the Enterprise plan. I'll send docs separately.",
          hoursAfter: 1,
        },
      ],
    },
    {
      subject: "Mobile app keeps logging me out",
      description:
        "The mobile app logs me out every few hours even with 'remember me' enabled.",
      status: Status.OPEN,
      priority: Priority.HIGH,
      customerEmail: "customer2@acme.test",
      tagNames: ["Bug"],
      daysOld: 1,
    },
    {
      subject: "Two-factor authentication setup",
      description: "How do I enable 2FA for my account?",
      status: Status.RESOLVED,
      priority: Priority.LOW,
      customerEmail: "customer1@acme.test",
      tagNames: ["Question"],
      daysOld: 12,
      replies: [
        {
          authorEmail: "agent2@acme.test",
          body: "Go to Profile → Security → Two-Factor Auth and follow the prompts. You'll need an authenticator app.",
          hoursAfter: 1,
        },
        {
          authorEmail: "customer1@acme.test",
          body: "Done, working great.",
          hoursAfter: 3,
        },
      ],
      rating: { score: 5 },
    },
    {
      subject: "Integration with Zapier",
      description: "Is there a Zapier integration for new ticket events?",
      status: Status.OPEN,
      priority: Priority.LOW,
      customerEmail: "customer2@acme.test",
      tagNames: ["Feature", "Question"],
      daysOld: 6,
    },
    {
      subject: "Slow dashboard loading",
      description:
        "Dashboard takes 10+ seconds to load this morning. Something wrong?",
      status: Status.RESOLVED,
      priority: Priority.MEDIUM,
      customerEmail: "customer1@acme.test",
      assigneeEmail: "agent1@acme.test",
      tagNames: ["Bug"],
      daysOld: 4,
      replies: [
        {
          authorEmail: "agent1@acme.test",
          body: "We had a temporary slowdown. It's been resolved — can you confirm on your end?",
          hoursAfter: 1,
        },
        {
          authorEmail: "customer1@acme.test",
          body: "Yes, back to normal. Thanks!",
          hoursAfter: 2,
        },
      ],
      rating: { score: 4 },
    },
    {
      subject: "Data residency requirements",
      description:
        "Our company policy requires EU data residency. Can you confirm where our data is stored?",
      status: Status.WAITING_CUSTOMER,
      priority: Priority.MEDIUM,
      customerEmail: "customer1@acme.test",
      assigneeEmail: "admin@acme.test",
      tagNames: ["Question"],
      daysOld: 7,
      replies: [
        {
          authorEmail: "admin@acme.test",
          body: "We're working on EU residency as an add-on. ETA Q2. Will follow up once available.",
          hoursAfter: 4,
        },
      ],
    },
    {
      subject: "Cannot delete my account",
      description: "I want to delete my account but can't find the option.",
      status: Status.RESOLVED,
      priority: Priority.LOW,
      customerEmail: "customer2@acme.test",
      tagNames: ["Question"],
      daysOld: 18,
      replies: [
        {
          authorEmail: "agent2@acme.test",
          body: "Account deletion is currently handled by support. I've processed your request, your data will be purged within 30 days.",
          hoursAfter: 2,
        },
        {
          authorEmail: "customer2@acme.test",
          body: "Thanks, perfect.",
          hoursAfter: 4,
        },
      ],
      rating: { score: 5 },
    },
    {
      subject: "Add custom fields to tickets",
      description:
        "We need to track 'Order ID' on every ticket. Can we add custom fields?",
      status: Status.OPEN,
      priority: Priority.MEDIUM,
      customerEmail: "customer2@acme.test",
      tagNames: ["Feature"],
      daysOld: 9,
    },
    {
      subject: "Spam tickets from one IP",
      description:
        "We're receiving several spam tickets from the same IP range. Can you block them?",
      status: Status.RESOLVED,
      priority: Priority.LOW,
      customerEmail: "customer1@acme.test",
      assigneeEmail: "agent1@acme.test",
      tagNames: ["Bug"],
      daysOld: 15,
      replies: [
        {
          authorEmail: "agent1@acme.test",
          body: "Added the IP range to our blocklist. The spam should stop within an hour.",
          hoursAfter: 1,
        },
      ],
      rating: { score: 4 },
    },
    {
      subject: "Slack integration for ticket updates",
      description:
        "Get a Slack message when a ticket is assigned to me or replied to.",
      status: Status.OPEN,
      priority: Priority.LOW,
      customerEmail: "customer1@acme.test",
      tagNames: ["Feature"],
      daysOld: 12,
    },
  ];

  const globexTickets: TicketSpec[] = [
    {
      subject: "Cannot access my dashboard",
      description:
        "The dashboard shows a blank screen. Tried logging out and back in.",
      status: Status.OPEN,
      priority: Priority.HIGH,
      customerEmail: "customer@globex.test",
      tagNames: ["Bug"],
      daysOld: 1,
    },
    {
      subject: "Refund for duplicate charge",
      description:
        "I was charged twice for the same order. Need a refund for the duplicate.",
      status: Status.IN_PROGRESS,
      priority: Priority.URGENT,
      customerEmail: "customer@globex.test",
      assigneeEmail: "agent@globex.test",
      tagNames: ["Billing", "Urgent"],
      daysOld: 2,
      replies: [
        {
          authorEmail: "agent@globex.test",
          body: "Hi Henry, sorry about that. I see the duplicate charge. Processing a refund now, should appear in 3-5 business days.",
          hoursAfter: 1,
        },
        {
          authorEmail: "customer@globex.test",
          body: "Thanks for the quick response.",
          hoursAfter: 2,
        },
      ],
    },
    {
      subject: "Where do I find my invoices?",
      description: "I need invoices for the last 6 months for accounting.",
      status: Status.RESOLVED,
      priority: Priority.LOW,
      customerEmail: "customer@globex.test",
      assigneeEmail: "agent@globex.test",
      tagNames: ["Billing", "Question"],
      daysOld: 6,
      replies: [
        {
          authorEmail: "agent@globex.test",
          body: "All invoices are available at Settings → Billing → Invoices.",
          hoursAfter: 1,
        },
      ],
      rating: { score: 5 },
    },
    {
      subject: "Mobile app crashes on launch",
      description:
        "iOS app crashes immediately on launch after the latest update.",
      status: Status.IN_PROGRESS,
      priority: Priority.URGENT,
      customerEmail: "customer@globex.test",
      assigneeEmail: "agent@globex.test",
      tagNames: ["Bug", "Urgent"],
      daysOld: 0,
      replies: [
        {
          authorEmail: "agent@globex.test",
          body: "Looking into this right now. Can you share the iOS version and device model?",
          hoursAfter: 1,
          isInternal: true,
        },
      ],
    },
    {
      subject: "Feature request: dark mode",
      description: "Dark mode would be lovely.",
      status: Status.OPEN,
      priority: Priority.LOW,
      customerEmail: "customer@globex.test",
      tagNames: ["Feature"],
      daysOld: 3,
    },
    {
      subject: "API key rotation",
      description: "How do I rotate my API key without downtime?",
      status: Status.RESOLVED,
      priority: Priority.MEDIUM,
      customerEmail: "customer@globex.test",
      assigneeEmail: "agent@globex.test",
      tagNames: ["Question"],
      daysOld: 11,
      replies: [
        {
          authorEmail: "agent@globex.test",
          body: "Create a new key, deploy your services with both old and new, then revoke the old.",
          hoursAfter: 2,
        },
      ],
      rating: { score: 4 },
    },
    {
      subject: "Email notifications delayed",
      description: "Emails are arriving 30+ minutes late today.",
      status: Status.WAITING_CUSTOMER,
      priority: Priority.MEDIUM,
      customerEmail: "customer@globex.test",
      assigneeEmail: "agent@globex.test",
      tagNames: ["Bug"],
      daysOld: 0,
      replies: [
        {
          authorEmail: "agent@globex.test",
          body: "We're seeing delays from our email provider. Investigating now.",
          hoursAfter: 1,
        },
      ],
    },
    {
      subject: "Add a CSV export",
      description: "Need to export my data to CSV.",
      status: Status.OPEN,
      priority: Priority.LOW,
      customerEmail: "customer@globex.test",
      tagNames: ["Feature"],
      daysOld: 5,
    },
  ];

  async function createTicket(
    spec: TicketSpec,
    orgId: string,
    tags: { id: string; name: string }[],
  ) {
    const customer = byEmail[spec.customerEmail];
    const assignee = spec.assigneeEmail ? byEmail[spec.assigneeEmail] : null;
    const created = daysAgo(spec.daysOld);
    const firstResponseAt =
      spec.replies?.find((r) => !r.isInternal)?.hoursAfter !== undefined
        ? hoursAgo(
            spec.daysOld * 24 -
              spec.replies!.find((r) => !r.isInternal)!.hoursAfter!,
          )
        : null;
    const resolvedAt =
      spec.status === Status.RESOLVED || spec.status === Status.CLOSED
        ? daysAgo(Math.max(0, spec.daysOld - 1))
        : null;

    const ticket = await db.ticket.create({
      data: {
        subject: spec.subject,
        description: spec.description,
        status: spec.status,
        priority: spec.priority,
        orgId,
        customerId: customer.id,
        assigneeId: assignee?.id,
        firstResponseAt,
        resolvedAt,
        createdAt: created,
        updatedAt: created,
      },
    });

    if (spec.tagNames && spec.tagNames.length > 0) {
      const tagIds = spec.tagNames
        .map((name) => tags.find((t) => t.name === name)?.id)
        .filter((id): id is string => Boolean(id));
      if (tagIds.length > 0) {
        await db.ticket.update({
          where: { id: ticket.id },
          data: { tags: { connect: tagIds.map((id) => ({ id })) } },
        });
      }
    }

    if (spec.replies) {
      for (const r of spec.replies) {
        const author = byEmail[r.authorEmail];
        const hoursAfter = r.hoursAfter ?? 0;
        await db.ticketReply.create({
          data: {
            ticketId: ticket.id,
            authorId: author.id,
            body: r.body,
            isInternal: r.isInternal ?? false,
            createdAt: hoursAgo(spec.daysOld * 24 - hoursAfter),
          },
        });
      }
    }

    if (spec.rating) {
      await db.rating.create({
        data: {
          ticketId: ticket.id,
          userId: customer.id,
          score: spec.rating.score,
          comment: spec.rating.comment ?? null,
          createdAt: daysAgo(Math.max(0, spec.daysOld - 1)),
        },
      });
    }
  }

  for (const t of acmeTickets) {
    await createTicket(t, acme.id, acmeTags);
  }
  for (const t of globexTickets) {
    await createTicket(t, globex.id, globexTags);
  }

  console.log(`  ✓ Created ${acmeTickets.length} tickets in Acme`);
  console.log(`  ✓ Created ${globexTickets.length} tickets in Globex`);

  // 8. Activity log entries (sample)
  console.log("  Creating activity log...");
  await db.activityLog.createMany({
    data: [
      {
        orgId: acme.id,
        actorId: byEmail["admin@acme.test"].id,
        action: "MEMBER_INVITED",
        entityId: byEmail["agent1@acme.test"].id,
        createdAt: daysAgo(50),
      },
      {
        orgId: acme.id,
        actorId: byEmail["agent1@acme.test"].id,
        action: "TICKET_RESOLVED",
        entityId: null,
        createdAt: daysAgo(2),
      },
      {
        orgId: acme.id,
        actorId: byEmail["admin@acme.test"].id,
        action: "ROLE_CHANGED",
        entityId: byEmail["agent2@acme.test"].id,
        createdAt: daysAgo(20),
      },
      {
        orgId: globex.id,
        actorId: byEmail["admin@globex.test"].id,
        action: "MEMBER_INVITED",
        entityId: byEmail["agent@globex.test"].id,
        createdAt: daysAgo(28),
      },
    ],
  });

  console.log("✅ Seed complete.\n");
  console.log("Demo credentials (sign in via magic link or Google):");
  console.log("  Acme:");
  console.log("    admin@acme.test       (ADMIN)");
  console.log("    agent1@acme.test      (AGENT)");
  console.log("    agent2@acme.test      (AGENT)");
  console.log("    customer1@acme.test   (CUSTOMER)");
  console.log("    customer2@acme.test   (CUSTOMER)");
  console.log("  Globex:");
  console.log("    admin@globex.test     (ADMIN)");
  console.log("    agent@globex.test     (AGENT)");
  console.log("    customer@globex.test  (CUSTOMER)");
  console.log("  Multi-org:");
  console.log("    power@multi.test      (ADMIN at Acme + CUSTOMER at Globex)");
  console.log("\n  → /acme-support and /globex-helpdesk are the org slugs.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
