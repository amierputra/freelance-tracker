# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
One solo freelancer in Malaysia (the owner) tracking their own client work. Personal tool, single login. Used equally on desktop (at the desk, doing admin: invoices, project setup) and on phone (quick checks: what's overdue, what's due next).

## Product Purpose
Keep a freelancer's money and deadlines under control: who the clients are, which projects are live, which payments are owed or overdue, and which invoices have gone out. Success = nothing slips: no missed deadline, no forgotten unpaid payment, invoices generated in seconds.

## Operating Context
- Currency is MYR, shown as `RM 1,234.00`; dates in `en-MY` format.
- Flow: client → project (fixed or hourly) → payments (deposit, milestone, final, lump sum) → invoice PDF generated from a payment.
- Invoices are downloaded as PDF and sent to clients outside the app.
- First-run: setup page, then onboarding checklist on dashboard.

## Capabilities and Constraints
- Nuxt 4 + Nuxt UI v4 + Tailwind v4, SQLite via Drizzle. Keep Nuxt UI as the component library.
- Entities: clients (active/inactive), projects (lead, in_progress, review, completed, cancelled), payments (pending, sent, paid, overdue), invoices (draft, sent, paid), business settings (bank details, invoice prefix/notes).
- Dashboard data: outstanding balance, active project count, upcoming deadlines (5), overdue payments.
- Light and dark mode both supported.

## Evidence on Hand
Real data lives in the local SQLite DB (`data/`). No testimonials, logos or brand assets exist beyond the name "Freelance Tracker".

## Product Principles
1. Money owed is the first thing seen; overdue is never quiet.
2. Next deadline before history.
3. Every common action (mark paid, generate invoice) is one step from where the data is shown.
4. Works as well on a phone as at the desk.
