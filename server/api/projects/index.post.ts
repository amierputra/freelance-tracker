import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { db, schema, assertOwned } from '../../database'

const bodySchema = z.object({
  clientId: z.number().int(),
  title: z.string().min(1),
  description: z.string().optional().default(''),
  status: z.enum(['lead', 'in_progress', 'review', 'completed', 'cancelled']).optional().default('lead'),
  pricingType: z.enum(['fixed', 'hourly']).optional().default('fixed'),
  amount: z.number().optional().default(0),
  startDate: z.string().nullable().optional(),
  deadline: z.string().nullable().optional()
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  await assertOwned(schema.clients, body.clientId, userId)
  const [inserted] = await db.insert(schema.projects).values({ ...body, userId }).$returningId()
  const [project] = await db.select().from(schema.projects).where(and(eq(schema.projects.id, inserted!.id), eq(schema.projects.userId, userId)))
  return project!
})
