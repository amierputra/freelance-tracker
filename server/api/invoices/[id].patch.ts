import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { writeFileSync } from 'node:fs'
import { db, schema, getSettings } from '../../database'
import { generateInvoicePdf } from '../../utils/pdf'

const bodySchema = z.object({
  status: z.enum(['draft', 'sent', 'paid']).optional(),
  issueDate: z.string().optional(),
  dueDate: z.string().nullable().optional(),
  lineItems: z.array(z.object({
    description: z.string().min(1),
    amount: z.number()
  })).min(1).optional()
})

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const id = Number(getRouterParam(event, 'id'))
  const body = await readValidatedBody(event, bodySchema.parse)

  const [existing] = await db.select().from(schema.invoices).where(eq(schema.invoices.id, id)).limit(1)
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Invoice not found' })
  }

  const update: Partial<typeof schema.invoices.$inferInsert> = { ...body }

  if (body.lineItems || body.issueDate || body.dueDate !== undefined) {
    const [client] = await db.select().from(schema.clients).where(eq(schema.clients.id, existing.clientId)).limit(1)
    const settings = await getSettings()
    if (!client || !settings) {
      throw createError({ statusCode: 404, statusMessage: 'Client or settings not found' })
    }

    const lineItems = body.lineItems ?? existing.lineItems
    const issueDate = body.issueDate ?? existing.issueDate
    const dueDate = body.dueDate !== undefined ? body.dueDate : existing.dueDate
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0)
    const total = subtotal

    const pdfBytes = await generateInvoicePdf({
      invoiceNumber: existing.invoiceNumber,
      issueDate,
      dueDate: dueDate ?? null,
      business: {
        name: settings.businessName,
        email: settings.businessEmail,
        phone: settings.businessPhone,
        address: settings.businessAddress,
        bankName: settings.bankName,
        bankAccountName: settings.bankAccountName,
        bankAccountNumber: settings.bankAccountNumber
      },
      client: {
        name: client.name,
        company: client.company,
        email: client.email
      },
      lineItems,
      subtotal,
      total,
      currency: existing.currency,
      notes: settings.invoiceNotes
    })

    if (existing.pdfPath) {
      writeFileSync(existing.pdfPath, pdfBytes)
    }

    update.lineItems = lineItems
    update.issueDate = issueDate
    update.dueDate = dueDate
    update.subtotal = subtotal
    update.total = total
  }

  await db.update(schema.invoices)
    .set(update)
    .where(eq(schema.invoices.id, id))
  const [invoice] = await db.select().from(schema.invoices).where(eq(schema.invoices.id, id))

  return invoice
})
