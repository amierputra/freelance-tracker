import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, schema } from '../../database'

const bodySchema = z.object({
  projectId: z.number().int(),
  label: z.string().optional().default('Payment'),
  amount: z.number(),
  status: z.enum(['pending', 'sent', 'paid', 'overdue']).optional().default('pending'),
  dueDate: z.string().nullable().optional(),
  paidDate: z.string().nullable().optional()
})

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  if (body.status === 'paid' && !body.paidDate) body.paidDate = todayISO()
  const [inserted] = await db.insert(schema.payments).values(body).$returningId()
  const [payment] = await db.select().from(schema.payments).where(eq(schema.payments.id, inserted!.id))
  return payment!
})
