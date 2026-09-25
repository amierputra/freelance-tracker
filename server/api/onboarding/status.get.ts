import { eq } from 'drizzle-orm'
import { db, schema, getSettings } from '../../database'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)

  const settings = await getSettings(userId)
  const clientCount = await db.$count(schema.clients, eq(schema.clients.userId, userId))
  const projectCount = await db.$count(schema.projects, eq(schema.projects.userId, userId))
  const paymentCount = await db.$count(schema.payments, eq(schema.payments.userId, userId))
  const invoiceCount = await db.$count(schema.invoices, eq(schema.invoices.userId, userId))

  const steps = [
    { key: 'settings', label: 'Add your business info', to: '/settings/business', done: !!settings.businessName },
    { key: 'clients', label: 'Add your first client', to: '/clients', done: clientCount > 0 },
    { key: 'projects', label: 'Create a project for that client', to: '/projects/new', done: projectCount > 0 },
    { key: 'payments', label: 'Add a payment to the project', to: '/projects', done: paymentCount > 0 },
    { key: 'invoices', label: 'Generate an invoice', to: '/projects', done: invoiceCount > 0 }
  ]

  return {
    steps,
    allDone: steps.every(s => s.done),
    dismissed: !!settings.onboardingDismissedAt
  }
})
