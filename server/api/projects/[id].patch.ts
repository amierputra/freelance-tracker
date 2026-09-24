import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, schema } from '../../database'

const bodySchema = z.object({
  clientId: z.number().int().optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['lead', 'in_progress', 'review', 'completed', 'cancelled']).optional(),
  pricingType: z.enum(['fixed', 'hourly']).optional(),
  amount: z.number().optional(),
  startDate: z.string().nullable().optional(),
  deadline: z.string().nullable().optional()
})

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const id = Number(getRouterParam(event, 'id'))
  const body = await readValidatedBody(event, bodySchema.parse)

  await db.update(schema.projects)
    .set(body)
    .where(eq(schema.projects.id, id))
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, id))

  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }
  return project
})
