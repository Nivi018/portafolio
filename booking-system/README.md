# 📅 BookingSystem

Plataforma completa de gestión de reservas para negocios de servicios. Permite a barberías, consultorios, gimnasios, salones de belleza y cualquier negocio de servicios gestionar citas, clientes y pagos de forma profesional.

![Next.js](https://img.shields.io/badge/Next.js-16.0-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![Prisma](https://img.shields.io/badge/Prisma-7.0-2D3748) ![Tailwind](https://img.shields.io/badge/Tailwind-4.0-38B2AC) ![Stripe](https://img.shields.io/badge/Stripe-635BFF)

## ✨ Características

- 🔐 **Autenticación completa** con Auth.js v5 (email/password con bcrypt)
- 🏢 **Multi-tenant**: cada negocio tiene su propia página pública con URL personalizada
- 📅 **Reservas en tiempo real** con validación de disponibilidad
- 💼 **Gestión de servicios** (precios, duración, descripción, reservas simultáneas)
- ⏰ **Horarios personalizables** por día de la semana
- 🚫 **Bloqueo de fechas** (vacaciones, feriados)
- 📆 **Calendario visual** con FullCalendar (mes, semana, día)
- 👥 **3 roles**: Cliente, Dueño de Negocio, Administrador
- 📊 **Dashboard con estadísticas** y gráficos (Recharts)
- 💳 **Pagos con Stripe** (Payment Intents + webhooks)
- 📧 **Emails transaccionales** con Resend (confirmaciones, cancelaciones)
- 🌙 **Modo oscuro** con next-themes
- 🔍 **Búsqueda de negocios** en tiempo real
- 🛡️ **Páginas de error** personalizadas (404, 500)
- 📱 **100% Responsive**
- 🔒 **Headers de seguridad** (XSS, CSRF, etc.)

## 🛠️ Stack Tecnológico

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Components, Server Actions)
- **Lenguaje**: [TypeScript 5](https://www.typescriptlang.org/)
- **Estilos**: [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (Base UI)
- **Base de datos**: [PostgreSQL](https://www.postgresql.org/) (Supabase)
- **ORM**: [Prisma 7](https://www.prisma.io/) con driver adapter
- **Autenticación**: [Auth.js v5](https://authjs.dev/) (NextAuth)
- **Validación**: [Zod](https://zod.dev/) + [React Hook Form](https://react-hook-form.com/)
- **Emails**: [Resend](https://resend.com/) (configurado)
- **Pagos**: [Stripe](https://stripe.com/) (configurado)
- **Deploy**: [Vercel](https://vercel.com/)

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 20+
- npm, pnpm o yarn
- Una base de datos PostgreSQL (recomendado: [Supabase](https://supabase.com/) gratis)

### 1. Configurar Supabase

Sigue las instrucciones detalladas en [`prisma/SUPABASE_SETUP.md`](./prisma/SUPABASE_SETUP.md) o:

1. Crea un proyecto en [supabase.com](https://app.supabase.com)
2. Ve a **Settings → Database → Connection string**
3. Copia las URLs y pégalas en tu `.env`

### 2. Instalar el proyecto

```bash
# Clonar el repositorio
git clone <url>
cd booking-system

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales de Supabase

# Generar cliente de Prisma
npm run db:generate

# Aplicar migraciones a la base de datos
npm run db:migrate
# Cuando te pregunte el nombre de la migración, escribe: init

# (Opcional) Poblar con datos de prueba
npm run db:seed
```

### 3. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### 🔑 Credenciales de prueba (después del seed)

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | `admin@bookingsystem.com` | `password123` |
| Negocio | `dueno1@example.com` | `password123` |
| Negocio | `dueno2@example.com` | `password123` |
| Negocio | `dueno3@example.com` | `password123` |
| Cliente | `cliente1@example.com` | `password123` |

## 📁 Estructura del Proyecto

```
booking-system/
├── prisma/
│   └── schema.prisma          # Schema de la base de datos
├── src/
│   ├── app/
│   │   ├── (auth)/           # Rutas de autenticación (login, register)
│   │   ├── (dashboard)/      # Rutas protegidas del dashboard
│   │   │   ├── admin/        # Dashboard del administrador
│   │   │   ├── business/     # Dashboard del negocio
│   │   │   └── client/       # Dashboard del cliente
│   │   ├── (public)/         # Rutas públicas
│   │   │   ├── businesses/   # Lista de negocios
│   │   │   └── business/     # Página del negocio
│   │   ├── api/              # API routes
│   │   ├── layout.tsx        # Layout raíz
│   │   └── page.tsx          # Landing page
│   ├── components/
│   │   ├── ui/               # Componentes de shadcn/ui
│   │   ├── layout/           # Navbar, Sidebar, Providers
│   │   ├── appointment/      # Componentes de reservas
│   │   ├── business/         # Componentes de negocio
│   │   ├── calendar/         # Componentes de calendario
│   │   ├── dashboard/        # Componentes del dashboard
│   │   └── forms/            # Formularios
│   ├── lib/
│   │   ├── prisma.ts         # Cliente de Prisma
│   │   ├── auth.ts           # Configuración de Auth.js
│   │   ├── availability.ts   # Lógica de slots disponibles
│   │   ├── utils.ts          # Utilidades generales
│   │   └── validators.ts     # Esquemas de Zod
│   └── types/                # Tipos de TypeScript
└── emails/                    # Templates de email
```

## 🗃️ Modelos de Base de Datos

- **User**: Usuarios del sistema (clientes, dueños, admins)
- **Business**: Negocios registrados
- **Service**: Servicios ofrecidos por cada negocio
- **BusinessHours**: Horarios de atención por día
- **BlockedDate**: Fechas bloqueadas (vacaciones, feriados)
- **Appointment**: Reservas realizadas
- **Payment**: Pagos asociados a reservas

## 👥 Roles de Usuario

| Rol | Permisos |
|-----|----------|
| **CLIENT** | Ver negocios, hacer reservas, gestionar sus reservas |
| **BUSINESS_OWNER** | Todo de CLIENT + gestionar su negocio, servicios, horarios, ver dashboard |
| **SUPER_ADMIN** | Acceso total a la plataforma |

## 📜 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia el servidor de desarrollo
npm run build            # Construye la aplicación para producción
npm run start            # Inicia el servidor de producción
npm run lint             # Ejecuta ESLint

# Base de datos
npm run db:generate      # Genera el cliente de Prisma
npm run db:migrate       # Crea y aplica migraciones (desarrollo)
npm run db:migrate:deploy # Aplica migraciones (producción)
npm run db:reset         # Resetea la base de datos (¡cuidado!)
npm run db:seed          # Puebla la DB con datos de prueba
npm run db:studio        # Abre Prisma Studio (GUI)
npm run db:setup         # Migraciones + seed (primera vez)
```

## 🌐 Deploy a Producción

### Deploy Rápido con Vercel

1. **Sube tu código a GitHub**:
```bash
git add .
git commit -m "ready to deploy"
git push
```

2. **Importa en Vercel**:
   - Ve a [vercel.com/new](https://vercel.com/new)
   - Importa tu repositorio
   - Vercel detectará Next.js automáticamente

3. **Configura variables de entorno** en Vercel Dashboard:
```env
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://tu-app.vercel.app
RESEND_API_KEY=re_...
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

4. **Deploy**: Clic en "Deploy" y espera 2-5 minutos.

### Deploy Automatizado (Script)

**Linux/Mac**:
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

**Windows**:
```powershell
.\scripts\deploy.ps1
```

### Documentación Completa

- 📖 [**DEPLOY_GUIDE.md**](./DEPLOY_GUIDE.md) - Guía paso a paso completa
- 🔧 [**TROUBLESHOOTING.md**](./TROUBLESHOOTING.md) - Solución de problemas comunes
- 📊 [**ANALISIS_MEJORAS.md**](./ANALISIS_MEJORAS.md) - Análisis y mejoras

### Post-Deploy

1. **Ejecuta migraciones** en producción:
```bash
DATABASE_URL=tu_url_produccion npx prisma migrate deploy
```

2. **Configura webhook de Stripe** apuntando a `https://tu-app.vercel.app/api/payments/webhook`

3. **Verifica que todo funcione**:
   - [ ] Registro de usuarios
   - [ ] Login
   - [ ] Crear negocio
   - [ ] Hacer una reserva
   - [ ] Pago con tarjeta de prueba (4242 4242 4242 4242)
   - [ ] Email de confirmación

## 🗺️ Roadmap - Estado Actual

- [x] **Día 1**: Setup inicial del proyecto ✅
- [x] **Día 2-3**: Configurar Supabase y migraciones ✅
- [x] **Día 4-7**: CRUD de servicios y horarios ✅
- [x] **Día 8-14**: Sistema de reservas completo ✅
- [x] **Día 15-18**: Dashboard y calendario ✅
- [x] **Día 19-21**: Emails transaccionales ✅
- [x] **Día 22-25**: Pagos con Stripe ✅
- [x] **Día 26-30**: Funcionalidades avanzadas ✅
- [x] **Día 31-36**: Deploy y documentación ✅

## 🤝 Contribuciones

Este es un proyecto de portafolio personal. Si tienes sugerencias, no dudes en abrir un issue.

## 📄 Licencia

MIT
