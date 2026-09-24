import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, schema } from '../../database'

const bodySchema = z.object({
  name: z.string().min(1),
  company: z.string().optional().default(''),
  email: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  status: z.enum(['active', 'inactive']).optional().default('active')
})

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const [inserted] = await db.insert(schema.clients).values(body).$returningId()
  const [client] = await db.select().from(schema.clients).where(eq(schema.clients.id, inserted!.id))
  return client!
})
