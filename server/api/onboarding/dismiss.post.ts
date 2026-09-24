import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, schema } from '../../database'

const bodySchema = z.object({ dismissed: z.boolean().default(true) })

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const { dismissed } = await readValidatedBody(event, bodySchema.parse)

  let row = db.select().from(schema.settings).get()
  if (!row) {
    ;[row] = db.insert(schema.settings).values({}).returning().all()
  }

  db.update(schema.settings)
    .set({ onboardingDismissedAt: dismissed ? new Date().toISOString() : null })
    .where(eq(schema.settings.id, row.id))
    .run()

  return { success: true }
})
