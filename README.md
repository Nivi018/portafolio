# Portafolio de Iván Díaz

Colección de aplicaciones full stack enfocadas en flujos operativos reales: finanzas personales, reservas, CRM, comercio electrónico y soporte SaaS.

Cada proyecto es independiente, tiene su propio `README.md`, dependencias y variables de entorno. Consulta la documentación dentro de cada carpeta para instalarlo o ejecutarlo.

## Proyectos

| Proyecto | Descripción | Stack principal |
|---|---|---|
| [Nexa Finance](./finance-app) | Gestión de finanzas personales: cuentas, movimientos, presupuestos, metas, recurrencias y reportes. | Next.js, Hono, PostgreSQL, Prisma, Better Auth, Turborepo |
| [BookingSystem](./booking-system) | Plataforma multi-tenant de reservas para negocios de servicios, con calendarios, pagos y roles. | Next.js, TypeScript, PostgreSQL, Prisma, Auth.js, Stripe |
| [Freelancer CRM](./freelancer-crm) | CRM para clientes, proyectos, tareas, propuestas, facturas y seguimiento de tiempo. | Next.js, TypeScript, PostgreSQL, Prisma, Auth.js |
| [Shoply](./shoply) | Plataforma e-commerce para productos físicos y digitales, con checkout, inventario y administración. | Next.js, TypeScript, PostgreSQL, Prisma, Stripe, Cloudinary |
| [Tickets App](./tickets-app) | SaaS multi-tenant de tickets de soporte con roles, tiempo real, CSAT e internacionalización. | Next.js, TypeScript, PostgreSQL, Prisma, Auth.js, Pusher |

## Estructura

```text
portafolio/
├── booking-system/      Plataforma de reservas
├── CV/                  Currículum y versiones HTML
├── finance-app/         Aplicación de finanzas personales
├── freelancer-crm/      CRM para freelancers
├── shoply/              E-commerce full stack
├── tickets-app/         Plataforma SaaS de soporte
└── plan-portafolio-fullstack.html
```

## Tecnologías recurrentes

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS y shadcn/ui.
- **Backend y datos:** Node.js, Hono, PostgreSQL y Prisma.
- **Autenticación y validación:** Auth.js / Better Auth, Zod y React Hook Form.
- **Integraciones:** Stripe, Resend, Pusher, Cloudinary y Supabase según el proyecto.
- **Calidad:** ESLint, Prettier, Vitest y Playwright donde aplica.

## Ejecutar un proyecto

1. Entra en la carpeta del proyecto elegido.
2. Lee su `README.md` y copia el archivo `.env.example` a `.env` cuando exista.
3. Instala dependencias con el gestor indicado en ese proyecto.
4. Configura la base de datos e integraciones requeridas antes de ejecutar el servidor de desarrollo.

> Los archivos `.env` locales, llaves y artefactos de compilación están excluidos del repositorio. Nunca publiques credenciales reales.
