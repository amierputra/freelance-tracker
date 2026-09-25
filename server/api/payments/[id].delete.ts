import { and, eq } from 'drizzle-orm'
import { db, schema } from '../../database'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = Number(getRouterParam(event, 'id'))
  await db.delete(schema.payments).where(and(eq(schema.payments.id, id), eq(schema.payments.userId, userId)))
  return { success: true }
})
