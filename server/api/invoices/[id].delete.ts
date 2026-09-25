import { and, eq } from 'drizzle-orm'
import { existsSync, unlinkSync } from 'node:fs'
import { db, schema } from '../../database'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = Number(getRouterParam(event, 'id'))

  const [invoice] = await db.select().from(schema.invoices).where(and(eq(schema.invoices.id, id), eq(schema.invoices.userId, userId))).limit(1)
  if (invoice?.pdfPath && existsSync(invoice.pdfPath)) {
    unlinkSync(invoice.pdfPath)
  }

  await db.delete(schema.invoices).where(and(eq(schema.invoices.id, id), eq(schema.invoices.userId, userId)))
  return { success: true }
})
