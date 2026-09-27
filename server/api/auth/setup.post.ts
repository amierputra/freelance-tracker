import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, schema, getSettings } from '../../database'

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1)
})

// Sign-up: creates a user (a tenant with its own isolated data) and its settings row
export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)

  const [existing] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, body.email)).limit(1)
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'An account with this email already exists' })
  }
  const passwordHash = await hashPassword(body.password)

  const [inserted] = await db.insert(schema.users).values({
    email: body.email,
    passwordHash,
    name: body.name
  }).$returningId()
  const user = { id: inserted!.id, email: body.email, name: body.name }

  await getSettings(user.id)

  await setUserSession(event, {
    user: { id: user.id, email: user.email, name: user.name }
  })

  return { success: true, email: user.email }
})
