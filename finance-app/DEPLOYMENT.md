# Deploy

La separación web/API permite desplegar cada app de forma independiente. La opción recomendada para este proyecto es **Vercel para Next.js**, **Railway o Render para Hono** y **Neon o Supabase para PostgreSQL**.

## 1. Base de datos

1. Crea una base PostgreSQL en Neon o Supabase.
2. Copia la cadena de conexión en `DATABASE_URL`.
3. Desde local, apunta temporalmente `DATABASE_URL` a esa instancia y ejecuta:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

Para cambios futuros usa `pnpm db:migrate` en desarrollo y `prisma migrate deploy` dentro del proceso de deploy de la API.

## 2. API en Railway o Render

Configura la raíz del servicio en `apps/api` o ejecuta los comandos desde el root del monorepo.

```bash
pnpm --filter @finance/api build
pnpm --filter @finance/api start
```

Variables requeridas:

```text
DATABASE_URL=<postgres-production-url>
BETTER_AUTH_SECRET=<random-32-plus-character-secret>
BETTER_AUTH_URL=https://your-web-domain.vercel.app
CRON_SECRET=<long-random-secret>
NODE_ENV=production
PORT=<provided-by-host>
```

Variables opcionales:

```text
RESEND_API_KEY=
RESEND_FROM_EMAIL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Verifica `GET https://your-api-domain/health` antes de conectar el frontend.

## 3. Web en Vercel

Importa el repositorio y define `apps/web` como Root Directory.

Variables requeridas:

```text
NEXT_PUBLIC_API_URL=https://your-api-domain
NEXT_PUBLIC_APP_URL=https://your-web-domain.vercel.app
```

El rewrite de `next.config.ts` reenvía `/api/*` a la API. Mantén `BETTER_AUTH_URL` igual a `NEXT_PUBLIC_APP_URL` para que Better Auth emita las cookies con el origen esperado.

## 4. Cron de recurrencias

Configura un scheduler diario (Railway Cron, Render Cron o cron-job.org):

```text
POST https://your-api-domain/api/recurring/process-due
x-cron-secret: <CRON_SECRET>
```

El endpoint responde `404` cuando el secreto es inválido para no revelar su existencia.

## Checklist de producción

- [ ] `BETTER_AUTH_SECRET` y `CRON_SECRET` son secretos únicos, no valores de desarrollo.
- [ ] La URL de frontend está configurada en `BETTER_AUTH_URL`.
- [ ] Las migraciones están aplicadas en PostgreSQL.
- [ ] `NEXT_PUBLIC_API_URL` apunta a la API HTTPS real.
- [ ] Se verificó login, creación de movimiento y dashboard.
- [ ] El cron de recurrencias se ejecuta con el header correcto.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test` y `pnpm build` pasan.
