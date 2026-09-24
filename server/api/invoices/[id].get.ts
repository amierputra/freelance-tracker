import { eq } from 'drizzle-orm'
import { db, schema } from '../../database'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const id = Number(getRouterParam(event, 'id'))

  const [invoice] = await db.select().from(schema.invoices).where(eq(schema.invoices.id, id)).limit(1)
  if (!invoice) {
    throw createError({ statusCode: 404, statusMessage: 'Invoice not found' })
  }
  return invoice
})
