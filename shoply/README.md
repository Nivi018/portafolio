# Shoply

A production-ready full-stack e-commerce platform built with Next.js 16, Prisma, Stripe, and Cloudinary.

> Global marketplace selling curated **physical** and **digital** products. Supports secure checkout, inventory management, wishlist, coupon codes, reviews, admin panel, and real-time order notifications.

## Tech stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Database:** PostgreSQL (via Supabase or local Prisma Postgres)
- **ORM:** Prisma 7
- **Auth:** Auth.js v5 (NextAuth) with Credentials + Google OAuth
- **Payments:** Stripe (Payment Intents + Webhooks)
- **Storage:** Cloudinary
- **Email:** Resend
- **Realtime:** Pusher Channels
- **UI:** shadcn/ui (Base UI) + Tailwind CSS 4
- **PDF:** @react-pdf/renderer
- **Testing:** Playwright
- **Deployment:** Vercel

## Features

### Storefront
- Product catalog with filters, sort, pagination
- Product detail with image gallery, variants, quantity, reviews
- Search with live autocomplete (Postgres full-text)
- Cart with optimistic updates
- Coupon codes (percent / fixed, with min purchase and max uses)
- Wishlist
- Multi-step checkout with saved addresses and shipping method
- Stripe Payment Element with Apple Pay / Google Pay
- Order confirmation with downloadable invoice
- Account dashboard (profile, addresses, orders, downloads)
- Dark / light mode

### Admin
- Dashboard with revenue chart and metrics
- Orders list with filters and status workflow
- Product CRUD with image upload, variants, stock
- Category and coupon management
- User role management
- Real-time order notifications via Pusher
- Low stock alerts

## Getting started

### Prerequisites
- Node.js 20.9+
- npm 10+

### 1. Install dependencies
```bash
npm install
```

### 2. Start a local PostgreSQL database
The easiest way is to use Prisma's built-in local Postgres:
```bash
npm run db:dev
```

This starts a local Postgres server on `localhost:51218`. The connection string is printed to the terminal — copy it into `.env` as `DATABASE_URL`.

Alternatively, create a free Postgres database at [Supabase](https://supabase.com) and use that connection string.

### 3. Set up environment variables
Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

For a quick start, only `DATABASE_URL` and `AUTH_SECRET` are required. The other vars are needed when you wire up Stripe, Cloudinary, Pusher, Resend, etc.

Generate `AUTH_SECRET` with:
```bash
openssl rand -base64 32
```

### 4. Run the database migrations and seed
```bash
npm run db:push       # Create tables
npm run db:seed       # Add demo categories, products, users, coupons
```

### 5. Start the dev server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### Demo accounts (after seeding)

| Role  | Email                | Password    |
|-------|----------------------|-------------|
| Admin | `admin@shoply.dev`   | `admin123`  |
| Client| `client@shoply.dev`  | `client123` |

## Scripts

| Command               | Description                                       |
|-----------------------|---------------------------------------------------|
| `npm run dev`         | Start the dev server                              |
| `npm run build`       | Production build                                  |
| `npm run start`       | Run the production build                          |
| `npm run lint`        | Lint with ESLint                                  |
| `npm run typecheck`   | TypeScript type check                             |
| `npm run db:dev`      | Start a local Prisma Postgres server              |
| `npm run db:push`     | Push the schema to the database                   |
| `npm run db:seed`     | Seed the database with demo data                  |
| `npm run db:studio`   | Open Prisma Studio                                |
| `npm run db:generate` | Regenerate the Prisma client                      |

## Project structure

```
src/
├── app/                    # Next.js App Router
│   ├── (store)            # Public-facing routes
│   ├── admin/             # Admin panel
│   ├── api/               # API routes
│   ├── account/           # Authenticated user area
│   └── auth actions/      # Login, register, password reset
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── store/             # Storefront components
│   ├── admin/             # Admin components
│   ├── auth/              # Auth forms
│   ├── account/           # Account area components
│   └── checkout/          # Checkout components
├── lib/                   # Shared utilities
│   ├── prisma.ts          # Prisma client singleton
│   ├── auth.config.ts     # NextAuth configuration
│   ├── pricing.ts         # Cart totals calculator
│   ├── stripe.ts          # Stripe client
│   └── ...
├── server/
│   ├── actions/           # Server actions
│   └── queries/           # Database queries
├── types/                 # TypeScript types
└── generated/prisma/      # Generated Prisma client
```

## Stripe setup

1. Create a free Stripe account at [stripe.com](https://stripe.com)
2. Get your test API keys from the dashboard
3. Add them to `.env`:
   ```
   STRIPE_SECRET_KEY="sk_test_..."
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
   ```
4. For local webhook testing, use the Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   Then copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`.

## Deployment

### Vercel

1. Push your repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.example`
4. Set up your production Postgres (Supabase recommended)
5. Deploy

The build command is automatically detected. The Prisma client is generated as part of the build.

## Testing

End-to-end tests with Playwright:

```bash
npx playwright install
npm run test:e2e
```

## License

MIT

## Author

Built as part of a full-stack portfolio project. See also: [booking-system](link-to-booking) for a previous project.
