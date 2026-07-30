# Demo Script

A 5-minute walkthrough of Tickets App, designed for live demos,
interviews, and screen recordings.

## Setup (1 minute)

```bash
# Terminal 1: database + dev server
npm run db:push && npm run db:seed && npm run dev

# Open http://localhost:3000
```

Optional (for real-time demo): set `PUSHER_*` env vars and `RESEND_API_KEY`.
Without them, the demo still works — emails are logged, live updates are disabled.

## Cast of characters (use these emails in the sign-in form)

| Account               | Org          | Role             |
| --------------------- | ------------ | ---------------- |
| `admin@acme.test`     | acme-support | ADMIN            |
| `agent1@acme.test`    | acme-support | AGENT            |
| `customer1@acme.test` | acme-support | CUSTOMER         |
| `power@multi.test`    | both         | ADMIN + CUSTOMER |

Sign in via magic link (Resend) or Google OAuth (configure `AUTH_GOOGLE_*`).

## Act 1 — Customer opens a ticket (60s)

1. Sign in as `customer1@acme.test`.
2. Land on the customer dashboard (4 KPI cards).
3. Click "My tickets" — see 8 existing tickets (some resolved, some open).
4. Click "New ticket" → fill in:
   - Subject: "Mobile push notifications are silent"
   - Description: "When I get a push on iOS, no sound or banner. iPhone 15, iOS 18."
   - Priority: High
5. Submit → land on the ticket detail page.

## Act 2 — Agent triages and responds (60s)

1. Open a second window/incognito, sign in as `agent1@acme.test`.
2. The new ticket shows in `/tickets` (status: Open, priority: High).
3. Open the ticket.
4. From the ticket-controls:
   - Click "Priority" → change to "Urgent"
   - Click "Assignee" → assign to yourself
5. In the reply composer, type:
   > Hi Dan! I can reproduce on iOS 18. Looking into it. @admin@acme.test FYI
6. Toggle "Internal note" on. Submit.
7. **In the customer window**, the ticket auto-updates (Pusher): status changes
   to "In progress", assignee shows your name, but the internal note is hidden.

## Act 3 — Customer rates the resolution (60s)

1. As the agent, change status to "Resolved" (from the status picker).
2. **In the customer window**, a yellow "How was your experience?" banner
   appears at the top.
3. Click on the ticket → fill in the 5-star rating.
4. Submit → the form is replaced with "Your rating: ★★★★★" (display).
5. Reports → CSAT average goes up.

## Act 4 — Admin sees the activity (30s)

1. Sign in as `admin@acme.test` (or use `power@multi.test` which is
   ADMIN in Acme and CUSTOMER in Globex — open two windows).
2. Reports → see charts with updated data.
3. Activity → see the recent events.

## Closing (30s)

- Show the project README: stack, decisions, features, screenshot placeholders.
- Show `npm test` running (68 unit tests).
- Show `npm run build` clean.
- Show `.github/workflows/ci.yml` running locally with `act` (optional).

## Things to mention when challenged

- **Multi-tenant isolation**: all queries use `getActiveOrg(orgSlug)` which validates session + membership; no raw queries.
- **Three-tier RBAC**: `can.*` permission helpers in `src/lib/permissions.ts`.
- **Workflow rules**: 5-state status with validated transitions, auto-reopen, CSAT loop.
- **Real-time**: Pusher Channels with private channels + membership-checked auth.
- **Graceful degradation**: Pusher and Resend are optional; the app runs fine without them.
- **Type safety**: 13 Prisma models, Zod on every server action, TypeScript strict.
- **i18n**: full EN/ES with locale-aware URL prefix.

## If something breaks during the demo

- `npm run db:reset` brings the database back to a clean state.
- `npm run dev` restarts the dev server.
- Errors are caught by `error.tsx` boundaries.
