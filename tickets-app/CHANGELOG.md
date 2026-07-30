# Changelog

All notable changes to this project are documented here. The format is
based on [Keep a Changelog](https://keepachangelog.com/), and this
project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

#### Authentication & multi-tenant

- Magic-link + Google OAuth via Auth.js v5
- Three roles (ADMIN, AGENT, CUSTOMER) with a permission catalog
- Multi-org memberships (one user, multiple orgs, different roles)
- Invite-only customer onboarding with token-based accept flow
- Per-user notification preferences (5 toggles) respected by email sender
- Account self-deletion (GDPR / right-to-be-forgotten) with last-admin guard

#### Tickets

- CRUD with cursor pagination, ILIKE search, status / priority / assignee filters
- 5-state workflow (`OPEN → IN_PROGRESS → WAITING_CUSTOMER → RESOLVED → CLOSED`) with validated transitions
- Reopen with required reason
- Auto-reopen on customer reply to a resolved/closed ticket
- Internal notes (visible to staff only) vs public replies
- Soft delete (`deletedAt`); `firstResponseAt` and `resolvedAt` tracked
- CSAT rating (1-5 + comment) with global banner for unresolved ratings
- Per-user "My tickets" view
- CSV export endpoint (5000 cap, auth + filter)

#### Real-time

- Pusher Channels: private org channel + private user channel
- Membership-checked auth endpoint
- Live updates: new tickets, replies, status changes, assignments
- Notification bell with unread badge and live counter
- Graceful degradation if Pusher is not configured

#### Email

- Resend with bilingual HTML templates (EN/ES) and graceful fallback
- Triggers: org invite, reply, assignment, CSAT request
- Per-user opt-out toggles

#### Admin

- Members management (invite / change role / remove)
- Org settings (name, slug, primary color, logo)
- Tags (color-coded) and canned responses
- Activity log (last 100 events, 16 action types)
- Reports: KPIs by role + 4 Recharts (status, priority, time-series, agent performance)
- Notification bell with full dropdown

#### UX & polish

- Bilingual UI (EN/ES) with locale in URL and persistent preference
- Dark mode ready
- Error boundaries, 404 page, loading states
- Skeleton-friendly layouts
- Pagination via `LoadMore` (IntersectionObserver) replacing the previous Prev/Next
- Notification badge auto-updates

#### Developer experience

- TypeScript strict mode, no `any` in app code
- Zod validation on every server action and route handler
- Vitest unit tests (68 tests across 7 files)
- Playwright E2E config (smoke + auth scaffolded)
- GitHub Actions CI with PostgreSQL service
- ESLint 9 flat config + Prettier 3
- Husky + lint-staged pre-commit hooks
- Sentry error tracking (server + client + instrumentation)
- UploadThing integration (8 MIME types whitelisted, 8MB / file, 5 files)
- @mentions in replies with autocomplete dropdown + notification
- Strict CSP + security headers (`Strict-Transport-Security`, `X-Frame-Options`, etc.)
- Rate limiting in-memory (token bucket) on auth, create-ticket, create-reply
- Dockerfile multi-stage + docker-compose for local dev
- CONTRIBUTING.md with full workflow
- Multi-tenant guard helper `scopedToOrg` (per-request, not per-query)

#### Ops

- `npm run db:seed` populates 9 users, 2 orgs, 28 tickets, 31 replies, 9 ratings
- `npm run db:studio` opens Prisma Studio
- `POST /api/demo/reset` (with `DEMO_RESET_SECRET` + auth) re-seeds the DB
- `GET /api/tickets/export?orgSlug=…&…` returns CSV
- Pino-style structured logging via console (placeholder; swap for Sentry)
