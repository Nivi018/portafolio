# Nexa Finance

Aplicación full stack para gestionar finanzas personales: movimientos, cuentas, transferencias, presupuestos, metas de ahorro, recurrencias y reportes visuales.

Construida como proyecto de portafolio con monorepo, backend independiente y arquitectura hexagonal pragmática.

## Características

- Autenticación segura con Better Auth, sesiones HTTP-only y Google OAuth opcional.
- Cuentas de débito, ahorro, efectivo y crédito, con transferencias auditables.
- Movimientos de ingreso y gasto, filtros, paginación e importación de CSV.
- Categorías personalizadas y categorías iniciales idempotentes para usuarios nuevos.
- Presupuestos por categoría con gasto, restante y alerta visual de excedente.
- Metas de ahorro con aportaciones desde una cuenta.
- Movimientos recurrentes con endpoint protegido para scheduler/cron.
- Dashboard con flujo mensual, distribución de gastos, actividad y presupuestos.
- Reporte de ingresos y gastos por rango de fechas.

## Stack

| Área | Tecnología |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Recharts |
| API | Hono + Node.js |
| Datos | PostgreSQL + Prisma 7 + `@prisma/adapter-pg` |
| Auth | Better Auth |
| Validación | Zod 4 |
| Testing | Vitest |
| Monorepo | pnpm workspaces + Turborepo |

## Arquitectura

```text
apps/
  web/                 Next.js frontend (puerto 3000)
  api/                 Hono API (puerto 3001)
packages/
  shared/              DTOs, schemas Zod, tipos y constantes
  domain/              Entidades, value objects, puertos y casos de uso
  infrastructure/      Prisma, Better Auth, Resend y repositorios
```

El dominio no depende de Hono, Prisma, Better Auth ni React. La API actúa como composition root: conecta los adaptadores de infraestructura a los casos de uso mediante el contenedor de dependencias manual.

## Inicio rápido

### Requisitos

- Node.js 20.9 o superior
- pnpm 9 o superior
- PostgreSQL 16 local, o una instancia remota de Neon/Supabase

### Instalación

```bash
pnpm install
cp .env.example .env

# Configura DATABASE_URL y secretos en .env
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Abre `http://localhost:3000`.

### Cuenta demo

Después de ejecutar `pnpm db:seed`:

```text
Email: demo@financeapp.dev
Password: DemoPass123!
```

## Scripts

| Comando | Descripción |
|---|---|
| `pnpm dev` | Inicia web y API en paralelo |
| `pnpm build` | Compila API y frontend de producción |
| `pnpm lint` | Ejecuta ESLint 9 para todos los paquetes |
| `pnpm typecheck` | Ejecuta TypeScript en todo el monorepo |
| `pnpm test` | Ejecuta pruebas unitarias y de API sin base externa |
| `pnpm test:integration` | Prueba Better Auth, PostgreSQL, cuentas, movimientos y dashboard |
| `pnpm db:generate` | Genera el cliente Prisma |
| `pnpm db:migrate` | Crea/aplica migraciones en desarrollo |
| `pnpm db:push` | Sincroniza el schema sin crear migración |
| `pnpm db:seed` | Genera la cuenta y datos demo |
| `pnpm db:studio` | Abre Prisma Studio |

## Endpoints

| Grupo | Base |
|---|---|
| Better Auth | `/api/auth/*` |
| Perfil/bootstrap | `/api/auth/me`, `/api/auth/bootstrap` |
| Cuentas y transferencias | `/api/accounts` |
| Categorías | `/api/categories` |
| Movimientos y CSV | `/api/transactions` |
| Presupuestos | `/api/budgets` |
| Metas | `/api/goals` |
| Recurrencias | `/api/recurring` |
| Dashboard | `/api/dashboard` |
| Reportes | `/api/reports/income-expense` |

La web usa `rewrites` de Next.js para enviar `/api/*` a Hono. Esto conserva una sola origin para el navegador y permite que las cookies de Better Auth funcionen sin exponer tokens a JavaScript.

## Variables de entorno

| Variable | Requerida | Uso |
|---|---:|---|
| `DATABASE_URL` | Sí | Conexión PostgreSQL |
| `BETTER_AUTH_SECRET` | Sí | Secreto de sesión, mínimo 32 caracteres |
| `BETTER_AUTH_URL` | Sí | URL pública de la web |
| `CRON_SECRET` | Sí en producción | Protege `POST /api/recurring/process-due` |
| `NEXT_PUBLIC_API_URL` | Sí | URL pública de Hono para el rewrite de Next.js |
| `NEXT_PUBLIC_APP_URL` | Sí | URL pública del frontend |
| `RESEND_API_KEY` | No | Habilita envío de emails reales |
| `RESEND_FROM_EMAIL` | No | Remitente de Resend |
| `GOOGLE_CLIENT_ID` | No | Habilita Google OAuth |
| `GOOGLE_CLIENT_SECRET` | No | Habilita Google OAuth |

Consulta [DEPLOYMENT.md](./DEPLOYMENT.md) para configuración de producción y [DEMO.md](./DEMO.md) para el guion de presentación.

## Calidad

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm build
```

Las pruebas unitarias cubren schemas, casos de uso y reglas de balances. La prueba de integración crea un usuario temporal, realiza bootstrap de categorías, crea cuenta y movimiento, consulta dashboard y elimina los datos creados.
