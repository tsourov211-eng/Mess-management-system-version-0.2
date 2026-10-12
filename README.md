# Mess Management System Version-0.2

A modern, full-featured web application for managing student and bachelor messes, meal calculations, daily marketing/bazaar logs, deposits, overhead expenses, and monthly financial statements.

## Key Features

- **Multi-Role Workspaces**: Admin, Manager, and Member accounts with role-based routing and permissions.
- **Daily Meal Management**: Breakfast, Lunch, Dinner toggles with automated cutoff time enforcement.
- **Dynamic Calculation Engine**: Real-time Live Meal Rate, Mess Fund, individual member cost, and surplus/deficit balances.
- **Bazaar & Expenses**: Marketing schedules, expense approvals, and monthly expenditure summaries.
- **Reports & Exporting**: Comprehensive monthly breakdown with PDF and Excel export capabilities.
- **Authentication**: NextAuth credential and OAuth integration with role-based security.

## Getting Started

1. Install dependencies:
```bash
pnpm install
```

2. Generate Prisma Client:
```bash
pnpm exec prisma generate
```

3. Run the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Production Build

To build the project for production deployment:
```bash
pnpm build
pnpm start
```
