import { z } from 'zod'
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
  const [client] = db.insert(schema.clients).values(body).returning().all()
  return client
})
