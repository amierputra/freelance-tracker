import { and, eq, desc, getTableColumns, sql } from 'drizzle-orm'
import { db, schema } from '../../database'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = Number(getRouterParam(event, 'id'))

  const [project] = await db.select().from(schema.projects).where(and(eq(schema.projects.id, id), eq(schema.projects.userId, userId))).limit(1)
  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }

  const [client] = await db.select().from(schema.clients).where(eq(schema.clients.id, project.clientId)).limit(1)
  const projectPayments = await db.select({
    ...getTableColumns(schema.payments),
    // Qualified by hand: drizzle drops table prefixes in single-table selects, which makes subqueries ambiguous
    invoiceId: sql<number | null>`(select max(inv.id) from invoices inv where inv.payment_id = payments.id)`
  }).from(schema.payments)
    .where(eq(schema.payments.projectId, id))
    .orderBy(desc(schema.payments.createdAt))

  return { ...project, client, payments: projectPayments }
})
