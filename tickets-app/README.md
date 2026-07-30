# Tickets App

> A multi-tenant support ticket platform built with **Next.js 16**, **Auth.js v5**, **Prisma 7**, **Pusher Channels** and **Resend** — designed to showcase a real-world full-stack architecture with a polished UX.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue) ![Prisma](https://img.shields.io/badge/Prisma-7-2D3748) ![Auth.js](https://img.shields.io/badge/Auth.js-v5-purple) ![Pusher](https://img.shields.io/badge/Pusher-Channels-orange) ![License](https://img.shields.io/badge/license-MIT-green)

![Dashboard](docs/screenshots/dashboard.png)

---

## Overview

Tickets App is a self-contained, deployable SaaS where multiple organizations can run their support operations in isolated workspaces. Each org has its own members, tickets, tags, canned responses and branding.

It is intentionally **rich on real-world concerns** — not a CRUD toy. It implements:

- Multi-tenant isolation enforced at the query layer
- Three-tier role-based access control (Admin / Agent / Customer) with a permission catalog
- Real-time updates via Pusher Channels (private auth, membership-checked)
- A status workflow with reopen, transition rules and auto-routing of the first-response timestamp
- A CSAT (customer satisfaction) loop with rating + auto-prompt
- Email notifications via Resend with bilingual templates and graceful degradation
- Magic-link + Google OAuth sign-in
- Bilingual UI (EN/ES) via `next-intl` with locale-aware URL prefixes
- Cursor-paginated lists, ILIKE search, soft delete
- Activity log + in-app notification bell with live updates

---

## Tech Stack

| Layer         | Choice                                                     |
| ------------- | ---------------------------------------------------------- |
| Framework     | Next.js 16.2 (App Router, Server Actions)                  |
| Language      | TypeScript (strict)                                        |
| UI            | Tailwind v4 + shadcn/ui (Base UI) + sonner                 |
| i18n          | next-intl (EN default, ES available)                       |
| Auth          | Auth.js v5 (magic link + Google) + Prisma adapter          |
| Database      | PostgreSQL via Prisma 7 + `@prisma/adapter-pg`             |
| Real-time     | Pusher Channels (private channels, server SDK + pusher-js) |
| Email         | Resend (react-email-style HTML templates)                  |
| Forms         | React Hook Form + Zod                                      |
| Charts        | Recharts                                                   |
| Icons         | lucide-react                                               |
| Lint / Format | ESLint 9 (flat config) + Prettier 3                        |
| Deploy        | Vercel (or any Node host)                                  |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure env (see .env.example for all options)
cp .env.example .env.local
# Edit .env.local — at minimum set DATABASE_URL and AUTH_SECRET

# 3. Create the database and apply the schema
npm run db:push

# 4. Seed demo data (9 users, 2 orgs, 28 tickets, ratings, tags, ...)
npm run db:seed

# 5. Run
npm run dev
# Open http://localhost:3000
```

Useful scripts:

```bash
npm run dev           # dev server (Turbopack)
npm run build         # production build
npm run start         # serve production build
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit
npm run format        # Prettier write
npm run format:check  # Prettier check
npm run db:generate   # Prisma client regen
npm run db:push       # Apply schema to DB
npm run db:migrate    # Create migration
npm run db:studio     # Open Prisma Studio
npm run db:seed       # Seed demo data
```

---

## Demo Credentials

The seed creates nine users across two organizations. Sign in with **any email** — Auth.js will send a magic link (or use Google OAuth if you configure it).

| Email                  | Org               | Role(s)                            |
| ---------------------- | ----------------- | ---------------------------------- |
| `admin@acme.test`      | `acme-support`    | ADMIN                              |
| `agent1@acme.test`     | `acme-support`    | AGENT                              |
| `agent2@acme.test`     | `acme-support`    | AGENT                              |
| `customer1@acme.test`  | `acme-support`    | CUSTOMER                           |
| `customer2@acme.test`  | `acme-support`    | CUSTOMER                           |
| `admin@globex.test`    | `globex-helpdesk` | ADMIN                              |
| `agent@globex.test`    | `globex-helpdesk` | AGENT                              |
| `customer@globex.test` | `globex-helpdesk` | CUSTOMER                           |
| `power@multi.test`     | **both**          | ADMIN at Acme + CUSTOMER at Globex |

Org URL slugs (visit `/{orgSlug}/...`):

- `/acme-support` — Acme
- `/globex-helpdesk` — Globex

Sign in to two different accounts in two browser windows to see real-time updates between them (with Pusher configured) or instant page refreshes (without Pusher — see "Graceful degradation" below).

---

## Features

### Multi-tenant

- Each organization is fully isolated at the query layer (`scopedToOrg` helper)
- A user can belong to multiple orgs with **different roles** in each (e.g. `power@multi.test` is ADMIN in Acme and CUSTOMER in Globex)
- Per-org branding: name, URL slug, logo, primary color

### Auth & Roles

- Magic-link sign-in (no passwords) + Google OAuth via Auth.js v5
- Three roles: `ADMIN` (everything), `AGENT` (manage tickets), `CUSTOMER` (own tickets only)
- Permission catalog in `src/lib/permissions.ts` — every UI gate and server action checks a permission helper
- Onboarding flow: first sign-in → create the org → become its admin

### Tickets

- Create with subject, description (markdown-like), priority
- Status workflow with 5 states and validated transitions:
  - `OPEN → IN_PROGRESS → WAITING_CUSTOMER → RESOLVED → CLOSED`
  - Customer reply to a `RESOLVED`/`CLOSED` ticket auto-reopens it
  - Reopen from `CLOSED` requires a reason
- Priority (Low / Medium / High / Urgent)
- Internal notes (visible to staff only) vs public replies
- Soft delete (tickets are never hard-deleted)
- Cursor-based pagination with `ILIKE` subject search
- Per-user filtered views: "all tickets" (staff) vs "my tickets" (customer)
- Real-time new-ticket, reply, status, assignment and CSAT prompts
- CSAT (1–5 star rating + comment) auto-prompted when a ticket moves to `RESOLVED`

### Real-time (Pusher Channels)

- Private org channel (`private-org-{orgId}`) for ticket events visible to all members
- Private user channel (`private-user-{userId}`) for personal notifications
- Auth endpoint validates membership before issuing channel tokens
- Graceful degradation: if `PUSHER_*` envs are absent, the app still works — events are simply not published
- In-app `sonner` toasts + `router.refresh()` for live UI

### Email (Resend)

- Magic-link (handled by Auth.js)
- Org invite
- New reply (other party, with internal-note guard)
- Assignment
- CSAT request
- Bilingual (EN/ES) templates using the recipient's `preferredLocale`
- Graceful degradation: if `RESEND_API_KEY` is absent, emails are logged to stdout in dev and skipped in prod

### i18n

- `next-intl` with locale in URL (`/en/...`, `/es/...`)
- `LocaleSwitcher` in the top bar, preference persisted to the user record
- Server-rendered messages, client-side `useTranslations`
- Locale-aware date/number formatting

### Quality

- TypeScript strict mode, no `any` in app code
- Zod validation on every server action
- Centralized permission checks
- Soft delete for tickets and replies; never hard-delete user data
- Activity log for staff (`/activity`) with 16 action types
- In-app notification bell with unread badge and live updates
- Responsive (mobile / tablet / desktop) and dark-mode ready

---

## Architecture

```
src/
├── app/
│   ├── [locale]/
│   │   ├── (auth)/           ← sign-in, sign-up, onboarding (no app shell)
│   │   │   ├── sign-in/
│   │   │   ├── sign-up/
│   │   │   └── onboarding/
│   │   ├── app/[orgSlug]/    ← authenticated org workspace
│   │   │   ├── layout.tsx    ← getActiveOrg, bell, nav, toaster
│   │   │   ├── page.tsx      ← role-aware dashboard
│   │   │   ├── tickets/      ← list, [id], new
│   │   │   ├── my-tickets/   ← customer view
│   │   │   ├── settings/     ← org settings + members
│   │   │   ├── tags/
│   │   │   ├── canned-responses/
│   │   │   ├── reports/      ← charts (Recharts)
│   │   │   └── activity/     ← staff-only log
│   │   ├── join/[token]/     ← accept invite
│   │   └── layout.tsx        ← NextIntlClientProvider
│   └── api/
│       ├── auth/[...nextauth]/ ← Auth.js handler
│       └── pusher/auth/        ← channel auth
├── actions/                    ← server actions
│   ├── auth.ts, orgs.ts, tickets.ts, replies.ts, ratings.ts
│   ├── members.ts, settings.ts, tags.ts, canned-responses.ts
│   ├── notifications.ts, csat.ts
├── components/
│   ├── layout/      ← topbar, locale-switcher, notifications-bell
│   ├── auth/        ← sign-in/up/onboarding forms
│   ├── tickets/     ← list, filters, controls, status/priority badges
│   ├── replies/     ← composer, list, real-time listener
│   ├── ratings/     ← star form, display, global CSAT banner
│   ├── settings/    ← members, tags, canned-responses managers
│   ├── dashboard/   ← KPI card + Recharts wrappers
│   └── realtime/    ← ticket / ticket-list live listeners
├── lib/
│   ├── auth.ts           ← Auth.js config
│   ├── db.ts             ← Prisma + pg adapter singleton
│   ├── permissions.ts    ← role checks (can.*, canViewTicket, isAtLeast)
│   ├── ticket-workflow.ts← canTransition, requiresReason, canChangeStatus
│   ├── org-context.ts    ← getActiveOrg, getActiveOrgWithRole
│   ├── slug.ts           ← slugify, isValidSlug
│   ├── validators/       ← Zod schemas per action
│   ├── queries/          ← listTickets, getTicket, listTicketReplies, metrics, ...
│   ├── email/            ← Resend client + bilingual templates
│   ├── pusher-server.ts, pusher-client.ts ← channels + auth
│   └── i18n/             ← routing, request, navigation, messages/{en,es}.json
└── proxy.ts               ← locale routing + /app/* auth gate (renamed from middleware.ts in Next 16)
```

### Key helpers

| Helper                      | Purpose                                                                                 |
| --------------------------- | --------------------------------------------------------------------------------------- |
| `getActiveOrg(orgSlug)`     | Validates session + membership; redirects to `/sign-in` or `/onboarding` if not allowed |
| `getActiveOrgWithRole(...)` | Same, plus role check (throws/redirects on insufficient role)                           |
| `canTransition(from, to)`   | Workflow guard for ticket status changes                                                |
| `can.viewAllTickets(role)`  | Permission check used by both UI and server actions                                     |
| `slugify`                   | Generates URL-safe slugs from arbitrary input (handles accents)                         |
| `usePusherChannel`          | Client hook that subscribes to a private channel and cleans up on unmount               |

### Status workflow

```
OPEN ──► IN_PROGRESS ──► WAITING_CUSTOMER ──► RESOLVED ──► CLOSED
  │           │                  │              │            │
  └───────────┴──────────────────┴──────────────┘            │
                  (any of these can return to OPEN)
                                                            │
   CLOSED ──► OPEN  (explicit reopen with reason)
```

- Customer replying to a `RESOLVED` or `CLOSED` ticket auto-reopens to `OPEN` (one transaction).
- `firstResponseAt` is set the first time an agent or admin moves the ticket away from `OPEN`.
- `resolvedAt` is set on `RESOLVED` and cleared on any later transition away from it.

---

## Real-time (Pusher) reference

| Event                | Channel                 | Fired by                               |
| -------------------- | ----------------------- | -------------------------------------- |
| `ticket:created`     | `private-org-{orgId}`   | `createTicket`                         |
| `ticket:updated`     | `private-org-{orgId}`   | `updateTicketStatus/Priority/Assignee` |
| `reply:created`      | `private-org-{orgId}`   | `createReply`                          |
| `ticket:assigned`    | `private-user-{userId}` | `updateTicketAssignee`                 |
| `notification:new`   | `private-user-{userId}` | `createNotification`                   |
| `notification:count` | `private-user-{userId}` | every notification change              |

The auth endpoint (`POST /api/pusher/auth`) validates the calling session and rejects private channel subscriptions for orgs the user doesn't belong to.

### Graceful degradation

Both **Pusher** and **Resend** are _optional_. If their respective env vars are absent:

- Pusher: events are not published, but the app keeps working — the UI just doesn't get live updates (it still refreshes on form submissions).
- Resend: emails are logged to stdout in development and silently skipped in production. Auth.js magic links _do_ still work because they use the Auth.js internal email sender, not Resend (when configured).

---

## Screenshots

|                         |                                                          |
| ----------------------- | -------------------------------------------------------- |
| Dashboard (admin)       | ![admin dashboard](docs/screenshots/dashboard-admin.png) |
| Dashboard (agent)       | ![agent dashboard](docs/screenshots/dashboard-agent.png) |
| Ticket list             | ![ticket list](docs/screenshots/tickets.png)             |
| Ticket detail           | ![ticket detail](docs/screenshots/ticket-detail.png)     |
| Conversation            | ![conversation](docs/screenshots/conversation.png)       |
| Status workflow         | ![status picker](docs/screenshots/status-picker.png)     |
| CSAT banner + form      | ![csat](docs/screenshots/csat.png)                       |
| Members & invites       | ![members](docs/screenshots/members.png)                 |
| Org settings            | ![settings](docs/screenshots/settings.png)               |
| Reports                 | ![reports](docs/screenshots/reports.png)                 |
| Activity log            | ![activity](docs/screenshots/activity.png)               |
| Notification bell       | ![notifications](docs/screenshots/notifications.png)     |
| Multi-org switcher      | ![org switcher](docs/screenshots/org-switcher.png)       |
| Locale switcher (EN/ES) | ![locale switcher](docs/screenshots/locale-switcher.png) |
| Sign-in                 | ![sign in](docs/screenshots/sign-in.png)                 |

> Screenshots are not committed in this repository to keep the repo small. Drop your own files into `docs/screenshots/` with the names above.

---

## Environment Variables

See `.env.example` for the full list. Required:

```bash
DATABASE_URL=postgresql://USER:PASS@localhost:5432/tickets_app
AUTH_SECRET=...   # openssl rand -base64 32
AUTH_URL=http://localhost:3000
```

Recommended for production:

```bash
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
RESEND_API_KEY=...
RESEND_FROM_EMAIL=noreply@your-domain.com
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=us2
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=us2
NEXT_PUBLIC_APP_URL=https://tickets.your-domain.com
DEMO_RESET_SECRET=...   # for the /api/demo/reset endpoint
```

---

## Why these choices?

- **Next.js 16 App Router** lets us mix Server Components, Server Actions and Route Handlers with a single TypeScript codebase and zero separate API server.
- **Prisma 7 with `@prisma/adapter-pg`** keeps the SQL world accessible while giving us full type safety. The new driver-adapter model in Prisma 7 means no more `url` in `schema.prisma` — the URL lives in `prisma.config.ts` and the client.
- **Auth.js v5** has a clean Prisma adapter and supports multiple providers (magic link + Google) with a single config.
- **Pusher** keeps real-time logic out of the Next.js server (no WebSocket hosting) and integrates in a few lines per side.
- **Resend** for transactional email — clean API, good DX, free tier covers a demo.
- **next-intl** over `next-i18next` because App Router + Server Components deserve first-class i18n support.
- **shadcn/ui (Base UI preset)** for primitives that don't lock us into a heavy component library.

---

## Roadmap (not implemented in this version)

- File attachments via UploadThing (schema and UI scaffolding are in place; upload is pending)
- Mention parsing (`@user`) in replies with real-time notifications
- Custom ticket fields per org
- Ticket merge / split
- Saved views
- Webhooks (outbound) for ticket events
- Slack / Microsoft Teams integration
- Billing (Stripe) per-org with plan tiers
- Audit log export (CSV / JSON)
- E2E tests (Playwright)
- Background job queue (for emails, webhook delivery) — currently all in-process

---

## License

MIT — see [LICENSE](LICENSE).

---

## Acknowledgements

- [Next.js](https://nextjs.org), [Auth.js](https://authjs.dev), [Prisma](https://prisma.io), [Pusher](https://pusher.com), [Resend](https://resend.com), [shadcn/ui](https://ui.shadcn.com), [next-intl](https://next-intl-docs.vercel.app), [Recharts](https://recharts.org), [Tailwind CSS](https://tailwindcss.com).
