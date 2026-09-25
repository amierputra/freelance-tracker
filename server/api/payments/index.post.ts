import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { db, schema, assertOwned } from '../../database'

const bodySchema = z.object({
  projectId: z.number().int(),
  label: z.string().optional().default('Payment'),
  amount: z.number(),
  status: z.enum(['pending', 'sent', 'paid', 'overdue']).optional().default('pending'),
  dueDate: z.string().nullable().optional(),
  paidDate: z.string().nullable().optional()
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  await assertOwned(schema.projects, body.projectId, userId)
  if (body.status === 'paid' && !body.paidDate) body.paidDate = todayISO()
  const [inserted] = await db.insert(schema.payments).values({ ...body, userId }).$returningId()
  const [payment] = await db.select().from(schema.payments).where(and(eq(schema.payments.id, inserted!.id), eq(schema.payments.userId, userId)))
  return payment!
})
