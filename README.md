# GroceryOS 🛒

A full-stack retail grocery management system built with Next.js 14, Prisma, NextAuth, and Recharts.

## Features

- **POS Terminal** — Fast bill generation with Zustand cart, GST calculation, stock deduction
- **Inventory Management** — Products, categories, stock adjustments, low-stock alerts
- **Finance & P&L** — Revenue, COGS, expenses, net profit across any date range
- **Investor Portal** — Multi-investor profit splitting proportional to investment
- **AI Insights** — Daily quotes and business suggestions via Anthropic Claude
- **Reports** — Exportable Excel P&L reports with investor returns
- **Notifications** — In-app alerts for low stock, large bills
- **Role-Based Access** — ADMIN / STAFF / INVESTOR roles via NextAuth

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Database**: PostgreSQL via [Neon](https://neon.tech) + Prisma ORM
- **Auth**: NextAuth.js v5 (Google + Microsoft OAuth)
- **UI**: Tailwind CSS + shadcn/ui + Recharts
- **State**: Zustand (cart) + TanStack Query (server state)
- **AI**: Anthropic Claude (claude-sonnet-4-5)
- **Cache**: Upstash Redis
- **Email**: Resend

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
Copy `.env.local` and fill in your values:
```
DATABASE_URL=postgresql://...          # Neon PostgreSQL connection string
AUTH_SECRET=...                         # Run: openssl rand -base64 32
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
AUTH_MICROSOFT_ENTRA_ID_CLIENT_ID=...
AUTH_MICROSOFT_ENTRA_ID_CLIENT_SECRET=...
AUTH_MICROSOFT_ENTRA_ID_TENANT_ID=...
ANTHROPIC_API_KEY=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
RESEND_API_KEY=...
UPLOADTHING_TOKEN=...
NEXT_PUBLIC_SHOP_NAME=My Grocery Store
NEXT_PUBLIC_SHOP_ADDRESS=123 Main St, City
NEXT_PUBLIC_SHOP_PHONE=+91 98765 43210
NEXT_PUBLIC_SHOP_GSTIN=22AAAAA0000A1Z5
ADMIN_EMAIL=admin@example.com
```

### 3. Push database schema
```bash
npm run db:push
```

### 4. Seed sample data
```bash
npm run db:seed
```

### 5. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects to `/dashboard`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:seed` | Seed sample categories, products, expenses |
| `npm run db:studio` | Open Prisma Studio |

## Deployment (Vercel)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.local`
4. Deploy

The `postinstall` script runs `prisma generate` automatically on Vercel.

## Pages

| Route | Description |
|---|---|
| `/dashboard` | Metrics, charts, AI suggestions |
| `/pos` | Full-screen POS terminal |
| `/inventory` | Product list with stock management |
| `/inventory/add` | Add new product |
| `/inventory/categories` | Category & GST manager |
| `/bills` | Bills history |
| `/bills/[id]` | Bill detail with investor split |
| `/finance` | P&L with investor distribution |
| `/finance/expenses` | Expense tracker |
| `/finance/investors` | Investor management |
| `/finance/investors/[id]` | Individual investor dashboard |
| `/reports` | Generate & export reports |
| `/settings` | User roles, store config |
