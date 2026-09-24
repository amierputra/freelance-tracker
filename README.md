# Freelance Tracker

Personal tool for a solo freelancer to track clients, projects, payments and invoices. Single login, MYR currency, invoices generated as PDF.

Built with Nuxt 4, Nuxt UI v4, Tailwind v4 and SQLite (Drizzle ORM + better-sqlite3).

## Setup

```bash
npm install
cp .env.example .env
```

Set `NUXT_SESSION_PASSWORD` in `.env` to a random string of at least 32 characters:

```bash
openssl rand -base64 32
```

Create the database (stored at `data/db.sqlite`):

```bash
npx drizzle-kit migrate
```

## Development

```bash
npm run dev
```

Open `http://localhost:3000`. On first run you'll create your login on the setup page, then an onboarding checklist appears on the dashboard.

## Checks

```bash
npm run lint
npm run typecheck
```

## Database changes

Edit `server/database/schema.ts`, then generate and apply a migration:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

## Production

```bash
npm run build
npm run preview
```

The server needs a writable `data/` directory for the database. Back it up, it holds all your data.
