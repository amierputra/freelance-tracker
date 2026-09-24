# Freelance Tracker

Personal tool for a solo freelancer to track clients, projects, payments and invoices. Single login, MYR currency, invoices generated as PDF.

Built with Nuxt 4, Nuxt UI v4, Tailwind v4 and MySQL (Drizzle ORM + mysql2).

## Setup

```bash
npm install
cp .env.example .env
```

Set `NUXT_SESSION_PASSWORD` in `.env` to a random string of at least 32 characters:

```bash
openssl rand -base64 32
```

Create a MySQL database (locally via DBngin) and set `DATABASE_URL` in `.env`:

```bash
/Users/Shared/DBngin/mysql/8.0.33/bin/mysql -uroot -h127.0.0.1 -e "create database freelance_tracker"
# DATABASE_URL=mysql://root@127.0.0.1:3306/freelance_tracker
```

Tables are created automatically on server start (pending migrations run on boot).

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

Edit `server/database/schema.ts`, then generate a migration. It applies on next server start:

```bash
npx drizzle-kit generate
```

## Production

```bash
npm run build
npm run preview
```

Set `DATABASE_URL` (and `NUXT_SESSION_PASSWORD`) as environment variables. On Hostinger, create the database in hPanel and use host `127.0.0.1`. Start the server from the project root so `server/database/migrations` and `data/` resolve. The server needs a writable `data/` directory for invoice PDFs.
