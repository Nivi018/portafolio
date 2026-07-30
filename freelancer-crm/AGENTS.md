<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# FreelancerCRM - Guía de Configuración

## Variables de Entorno

### 🔴 Requeridas (sin estas la app NO funciona)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/dbname` |
| `NEXTAUTH_URL` | URL base de la app | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Secret para JWT (mín 32 chars) | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | URL pública (usada en emails) | `http://localhost:3000` |

### 🟡 Opcionales (activan features adicionales)

| Variable | Descripción | Para qué sirve |
|----------|-------------|----------------|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | Login con Google |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | Login con Google |
| `RESEND_API_KEY` | Resend API Key | Envío de emails (facturas, propuestas, invitaciones) |
| `RESEND_FROM_EMAIL` | Email remitente | Desde qué email se envían los correos |

## Setup Local

### 1. Instalar PostgreSQL

**Opción A: Docker (recomendado)**
```bash
docker-compose up -d
```

**Opción B: Local**
- Instala PostgreSQL
- Crea DB: `createdb freelancer_crm`
- Actualiza `DATABASE_URL` en `.env`

### 2. Configurar .env

```bash
cp .env.example .env
```

Edita `.env` con tus valores:
- `DATABASE_URL` - tu conexión a PostgreSQL
- `NEXTAUTH_SECRET` - genera uno nuevo
- `RESEND_API_KEY` - (opcional) para emails

### 3. Instalar dependencias

```bash
npm install
```

### 4. Ejecutar migraciones

```bash
npx prisma migrate dev
```

### 5. Iniciar servidor

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## Setup para Producción (sin deploy)

### 1. Base de datos

Recomendados:
- **Supabase** (gratis hasta 500MB): https://supabase.com
- **Neon** (gratis hasta 3GB): https://neon.tech

Connection string ejemplo:
```
postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
```

### 2. NEXTAUTH_SECRET

Genera uno seguro:
```bash
openssl rand -base64 32
```

### 3. Google OAuth (opcional)

1. Ve a https://console.cloud.google.com/apis/credentials
2. Crea un OAuth 2.0 Client ID
3. Authorized redirect URIs: `https://tudominio.com/api/auth/callback/google`
4. Copia Client ID y Secret a `.env`

### 4. Resend (opcional pero recomendado)

1. Crea cuenta en https://resend.com
2. Verifica tu dominio
3. Crea una API Key
4. Agrega a `.env`:
   ```
   RESEND_API_KEY="re_xxxxx"
   RESEND_FROM_EMAIL="noreply@tudominio.com"
   ```

## Verificar configuración

```bash
# Ver conexión a DB
npx prisma db pull

# Ver tests
npm run test

# Ver lint
npm run lint
```

## Stack

- **Framework**: Next.js 16
- **Database**: PostgreSQL + Prisma 7
- **Auth**: Auth.js v5 (NextAuth)
- **UI**: Tailwind 4 + shadcn/ui
- **Charts**: Recharts
- **Email**: Resend
- **PDF**: @react-pdf/renderer
- **Tests**: Vitest
