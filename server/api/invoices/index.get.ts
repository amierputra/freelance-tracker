import { desc, eq } from 'drizzle-orm'
import { db, schema } from '../../database'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const rows = db.select({
    id: schema.invoices.id,
    invoiceNumber: schema.invoices.invoiceNumber,
    issueDate: schema.invoices.issueDate,
    dueDate: schema.invoices.dueDate,
    total: schema.invoices.total,
    currency: schema.invoices.currency,
    status: schema.invoices.status,
    createdAt: schema.invoices.createdAt,
    clientName: schema.clients.name,
    projectTitle: schema.projects.title
  })
    .from(schema.invoices)
    .leftJoin(schema.clients, eq(schema.invoices.clientId, schema.clients.id))
    .leftJoin(schema.projects, eq(schema.invoices.projectId, schema.projects.id))
    .orderBy(desc(schema.invoices.createdAt))
    .all()

  return rows
})
