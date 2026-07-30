# Freelancer CRM

A complete CRM for freelancers to manage clients, projects, tasks, proposals, invoices, and time tracking. Built with modern web technologies.

## Features

- **Multi-user Support** - Invite team members with different roles (Owner, Admin, Member)
- **Client Management** - Track clients with status, contact info, and notes
- **Project Management** - Manage projects with status workflow, budgets, and deadlines
- **Task Management** - Create and assign tasks with priorities and due dates
- **Time Tracking** - Live timer and manual time entries with weekly timesheets
- **Proposals** - Create professional proposals with line items and convert to invoices
- **Invoices** - Generate invoices, send via email, and track payments
- **Dashboard** - Real-time analytics with revenue charts and team workload
- **Dark Mode** - Full dark mode support
- **Responsive Design** - Works on desktop and mobile

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: PostgreSQL with Prisma 7
- **Auth**: Auth.js v5 (NextAuth)
- **Validation**: Zod + React Hook Form
- **Charts**: Recharts
- **Email**: Resend
- **Testing**: Vitest
- **Deploy**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/freelancer-crm.git
cd freelancer-crm
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Update `.env` with your database URL and other secrets.

5. Run database migrations:
```bash
npx prisma migrate dev
```

6. Seed the database (optional):
```bash
npx prisma db seed
```

7. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### Core Models

- **Organization** - Workspace for teams
- **User** - Team members with roles
- **Client** - Customer information
- **Project** - Client projects with status workflow
- **Task** - Project tasks with assignments
- **TimeEntry** - Time tracking entries
- **Proposal** - Client proposals with line items
- **Invoice** - Client invoices with line items
- **Note** - Internal notes on clients
- **ActivityLog** - Audit trail of actions

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, register)
│   ├── (dashboard)/       # Dashboard pages
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── layout/            # Layout components
│   ├── dashboard/         # Dashboard components
│   ├── clientes/          # Client components
│   ├── proyectos/         # Project components
│   ├── tareas/            # Task components
│   ├── tiempo/            # Time tracking components
│   ├── propuestas/        # Proposal components
│   ├── facturas/          # Invoice components
│   └── configuracion/     # Settings components
├── lib/                   # Utility functions
├── server/
│   ├── actions/           # Server actions
│   └── queries/           # Database queries
└── types/                 # TypeScript types
```

## Testing

Run the test suite:

```bash
npm run test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Generate coverage report:

```bash
npm run test:coverage
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_URL` | Application URL | Yes |
| `NEXTAUTH_SECRET` | Secret for NextAuth | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | No |
| `RESEND_API_KEY` | Resend API key for emails | No |
| `NEXT_PUBLIC_APP_URL` | Public application URL | Yes |

## Deployment

### Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables
4. Deploy

### Docker

```bash
docker-compose up -d
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the MIT License.
