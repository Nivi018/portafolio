# Contributing

Thanks for your interest in improving Tickets App! This document covers
the day-to-day workflow for contributing changes.

## Local development

```bash
# 1. Install
npm install

# 2. Database
cp .env.example .env.local  # fill in DATABASE_URL and AUTH_SECRET at minimum
npm run db:push
npm run db:seed

# 3. Run
npm run dev
```

## Workflow

1. Create a branch off `main` (e.g. `feature/csrf-protection`).
2. Make focused commits. The pre-commit hook runs Prettier + ESLint.
3. Run the full check suite locally before pushing:

   ```bash
   npm run format:check
   npm run lint
   npm run typecheck
   npm test
   npm run build
   ```

4. Push and open a Pull Request. CI will run the same suite.
5. Get a review and squash-merge.

## Code style

- TypeScript strict mode — no `any`, no `// @ts-ignore` without a comment.
- Prefer Server Components. Mark with `"use client"` only when you need state, effects, or browser APIs.
- Validate inputs with Zod at the boundary (server actions, route handlers).
- All multi-tenant queries must include the org scope (`getActiveOrg` or `scopedToOrg`).
- Add tests for new pure functions and validators under `src/lib/__tests__/*.test.ts`.
- Add or update translations in `src/i18n/messages/{en,es}.json` for any user-facing string.

## Adding a new shadcn component

```bash
npx --yes shadcn@latest add <name>
```

The Base UI preset is configured. Components land in `src/components/ui/`.

## Database changes

- Edit `prisma/schema.prisma`.
- Run `npm run db:push` for development, or `npm run db:migrate` to create a migration.
- Update `prisma/seed.ts` to cover new models.
- If you add a field that should appear in the UI, search the codebase for
  the existing place where similar fields are read/written (e.g. tickets)
  and add the field there too.

## Adding a server action

- Put the file in `src/actions/<domain>.ts`. Use `"use server"` at the top.
- Validate inputs with Zod (see `src/lib/validators/`).
- Use `getActiveOrg(orgSlug)` to verify membership.
- Use `can.*` permission helpers from `src/lib/permissions.ts`.
- Call `revalidatePath` for any data that the affected page should re-render.
- Trigger Pusher events in `src/lib/pusher-server.ts` for live updates.
- Send emails via `sendEmail` in `src/lib/email/send.ts` (graceful if no API key).
- In-app notifications go through `createNotification` in `src/lib/queries/notifications.ts`.

## Code review checklist

- [ ] New server actions check auth + membership
- [ ] New server actions have rate limits
- [ ] New server actions validate with Zod
- [ ] Multi-tenant: org-scoped queries
- [ ] New UI strings are in both `en.json` and `es.json`
- [ ] New pure logic has tests
- [ ] `npm run build` passes
