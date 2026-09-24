import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, schema } from '../../database'

const bodySchema = z.object({
  name: z.string().min(1).optional(),
  company: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional()
})

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const id = Number(getRouterParam(event, 'id'))
  const body = await readValidatedBody(event, bodySchema.parse)

  await db.update(schema.clients)
    .set(body)
    .where(eq(schema.clients.id, id))
  const [client] = await db.select().from(schema.clients).where(eq(schema.clients.id, id))

  if (!client) {
    throw createError({ statusCode: 404, statusMessage: 'Client not found' })
  }
  return client
})
