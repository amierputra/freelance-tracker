import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { mkdirSync, writeFileSync } from 'node:fs'
import { db, schema } from '../../database'
import { generateInvoicePdf } from '../../utils/pdf'

const bodySchema = z.object({
  clientId: z.number().int(),
  projectId: z.number().int(),
  paymentId: z.number().int().optional(),
  issueDate: z.string(),
  dueDate: z.string().nullable().optional(),
  lineItems: z.array(z.object({
    description: z.string().min(1),
    amount: z.number()
  })).min(1),
  notes: z.string().optional()
})

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const body = await readValidatedBody(event, bodySchema.parse)

  const client = db.select().from(schema.clients).where(eq(schema.clients.id, body.clientId)).get()
  if (!client) {
    throw createError({ statusCode: 404, statusMessage: 'Client not found' })
  }
  const project = db.select().from(schema.projects).where(eq(schema.projects.id, body.projectId)).get()
  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }

  let settings = db.select().from(schema.settings).get()
  if (!settings) {
    settings = db.insert(schema.settings).values({}).returning().get()
  }

  const subtotal = body.lineItems.reduce((sum, item) => sum + item.amount, 0)
  const total = subtotal
  const invoiceNumber = `${settings.invoicePrefix}-${String(settings.nextInvoiceNumber).padStart(4, '0')}`

  const pdfBytes = await generateInvoicePdf({
    invoiceNumber,
    issueDate: body.issueDate,
    dueDate: body.dueDate ?? null,
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
    lineItems: body.lineItems,
    subtotal,
    total,
    currency: 'MYR',
    notes: body.notes ?? settings.invoiceNotes
  })

  const pdfDir = './data/invoices'
  mkdirSync(pdfDir, { recursive: true })
  const pdfPath = `${pdfDir}/${invoiceNumber}.pdf`
  writeFileSync(pdfPath, pdfBytes)

  const invoice = db.insert(schema.invoices).values({
    invoiceNumber,
    clientId: body.clientId,
    projectId: body.projectId,
    paymentId: body.paymentId ?? null,
    issueDate: body.issueDate,
    dueDate: body.dueDate ?? null,
    subtotal,
    total,
    currency: 'MYR',
    lineItems: body.lineItems,
    status: 'draft',
    pdfPath
  }).returning().get()

  db.update(schema.settings)
    .set({ nextInvoiceNumber: settings.nextInvoiceNumber + 1 })
    .where(eq(schema.settings.id, settings.id))
    .run()

  return invoice
})
