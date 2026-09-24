import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, schema, getSettings } from '../../database'

const bodySchema = z.object({
  businessName: z.string().optional(),
  businessEmail: z.string().optional(),
  businessPhone: z.string().optional(),
  businessAddress: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  invoicePrefix: z.string().optional(),
  invoiceNotes: z.string().optional()
})

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const body = await readValidatedBody(event, bodySchema.parse)

  const row = await getSettings()

  await db.update(schema.settings)
    .set(body)
    .where(eq(schema.settings.id, row.id))

  return getSettings()
})
