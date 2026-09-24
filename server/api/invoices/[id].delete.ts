import { eq } from 'drizzle-orm'
import { existsSync, unlinkSync } from 'node:fs'
import { db, schema } from '../../database'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const id = Number(getRouterParam(event, 'id'))

  const [invoice] = await db.select().from(schema.invoices).where(eq(schema.invoices.id, id)).limit(1)
  if (invoice?.pdfPath && existsSync(invoice.pdfPath)) {
    unlinkSync(invoice.pdfPath)
  }

  await db.delete(schema.invoices).where(eq(schema.invoices.id, id))
  return { success: true }
})
