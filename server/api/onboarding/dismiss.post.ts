import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, schema, getSettings } from '../../database'

const bodySchema = z.object({ dismissed: z.boolean().default(true) })

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const { dismissed } = await readValidatedBody(event, bodySchema.parse)

  const row = await getSettings()

  await db.update(schema.settings)
    .set({ onboardingDismissedAt: dismissed ? new Date().toISOString() : null })
    .where(eq(schema.settings.id, row.id))

  return { success: true }
})
