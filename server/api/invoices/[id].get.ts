import { and, eq } from 'drizzle-orm'
import { db, schema } from '../../database'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = Number(getRouterParam(event, 'id'))

  const [invoice] = await db.select().from(schema.invoices).where(and(eq(schema.invoices.id, id), eq(schema.invoices.userId, userId))).limit(1)
  if (!invoice) {
    throw createError({ statusCode: 404, statusMessage: 'Invoice not found' })
  }
  return invoice
})
