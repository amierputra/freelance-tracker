import { z } from 'zod'
import { db, schema } from '../../database'

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
  await requireUserSession(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const project = db.insert(schema.projects).values(body).returning().get()
  return project
})
