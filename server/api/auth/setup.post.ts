import { z } from 'zod'
import { db, schema } from '../../database'

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1)
})

/**
 * One-time setup endpoint to create the (single) login user and default
 * settings row. Refuses to run again once a user already exists, so it's
 * safe to leave in place after first use.
 *
 * Usage (once, right after first `npm run dev`):
 * curl -X POST http://localhost:3000/api/auth/setup \
 *   -H "Content-Type: application/json" \
 *   -d '{"email":"you@example.com","password":"a-strong-password","name":"Your Name"}'
 */
export default defineEventHandler(async (event) => {
  const existing = db.select().from(schema.users).all()
  if (existing.length > 0) {
    throw createError({ statusCode: 403, statusMessage: 'Setup already completed. A user already exists.' })
  }

  const body = await readValidatedBody(event, bodySchema.parse)
  const passwordHash = await hashPassword(body.password)

  const [user] = db.insert(schema.users).values({
    email: body.email,
    passwordHash,
    name: body.name
  }).returning().all()

  const existingSettings = db.select().from(schema.settings).all()
  if (existingSettings.length === 0) {
    db.insert(schema.settings).values({}).run()
  }

  await setUserSession(event, {
    user: { id: user.id, email: user.email, name: user.name }
  })

  return { success: true, email: user.email }
})
