import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { db, schema, assertOwned } from '../../database'

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
  const userId = await requireUserId(event)
  const id = Number(getRouterParam(event, 'id'))
  const body = await readValidatedBody(event, bodySchema.parse)
  if (body.clientId !== undefined) await assertOwned(schema.clients, body.clientId, userId)

  await db.update(schema.projects)
    .set(body)
    .where(and(eq(schema.projects.id, id), eq(schema.projects.userId, userId)))
  const [project] = await db.select().from(schema.projects).where(and(eq(schema.projects.id, id), eq(schema.projects.userId, userId)))

  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }
  return project
})
