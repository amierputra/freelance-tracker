import { and, eq } from 'drizzle-orm'
import { readFileSync } from 'node:fs'
import { db, schema } from '../../../database'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = Number(getRouterParam(event, 'id'))

  const [invoice] = await db.select().from(schema.invoices).where(and(eq(schema.invoices.id, id), eq(schema.invoices.userId, userId))).limit(1)
  if (!invoice || !invoice.pdfPath) {
    throw createError({ statusCode: 404, statusMessage: 'Invoice PDF not found' })
  }

  const bytes = readFileSync(invoice.pdfPath)
  setHeader(event, 'Content-Type', 'application/pdf')
  setHeader(event, 'Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`)
  return bytes
})
