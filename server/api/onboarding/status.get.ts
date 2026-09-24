import { db, schema } from '../../database'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const settings = db.select().from(schema.settings).get()
  const clientCount = db.select().from(schema.clients).all().length
  const projectCount = db.select().from(schema.projects).all().length
  const paymentCount = db.select().from(schema.payments).all().length
  const invoiceCount = db.select().from(schema.invoices).all().length

  const steps = [
    { key: 'settings', label: 'Add your business info', to: '/settings/business', done: !!settings?.businessName },
    { key: 'clients', label: 'Add your first client', to: '/clients', done: clientCount > 0 },
    { key: 'projects', label: 'Create a project for that client', to: '/projects/new', done: projectCount > 0 },
    { key: 'payments', label: 'Add a payment to the project', to: '/projects', done: paymentCount > 0 },
    { key: 'invoices', label: 'Generate an invoice', to: '/projects', done: invoiceCount > 0 }
  ]

  return {
    steps,
    allDone: steps.every(s => s.done),
    dismissed: !!settings?.onboardingDismissedAt
  }
})
