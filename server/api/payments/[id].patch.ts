import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, schema } from '../../database'

const bodySchema = z.object({
  label: z.string().optional(),
  amount: z.number().optional(),
  status: z.enum(['pending', 'sent', 'paid', 'overdue']).optional(),
  dueDate: z.string().nullable().optional(),
  paidDate: z.string().nullable().optional()
})

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const id = Number(getRouterParam(event, 'id'))
  const body = await readValidatedBody(event, bodySchema.parse)
  if (body.status === 'paid' && !body.paidDate) body.paidDate = todayISO()

  const [payment] = db.update(schema.payments)
    .set({ ...body, updatedAt: new Date().toISOString() })
    .where(eq(schema.payments.id, id))
    .returning()
    .all()

  if (!payment) {
    throw createError({ statusCode: 404, statusMessage: 'Payment not found' })
  }
  return payment
})
