import { eq } from 'drizzle-orm'
import { existsSync, unlinkSync } from 'node:fs'
import { db, schema } from '../../database'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const id = Number(getRouterParam(event, 'id'))

  const invoice = db.select().from(schema.invoices).where(eq(schema.invoices.id, id)).get()
  if (invoice?.pdfPath && existsSync(invoice.pdfPath)) {
    unlinkSync(invoice.pdfPath)
  }

  db.delete(schema.invoices).where(eq(schema.invoices.id, id)).run()
  return { success: true }
})
