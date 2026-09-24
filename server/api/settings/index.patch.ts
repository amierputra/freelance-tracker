import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, schema } from '../../database'

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

  let row = db.select().from(schema.settings).get()
  if (!row) {
    row = db.insert(schema.settings).values({}).returning().get()
  }

  const [updated] = db.update(schema.settings)
    .set({ ...body, updatedAt: new Date().toISOString() })
    .where(eq(schema.settings.id, row.id))
    .returning()
    .all()

  return updated
})
