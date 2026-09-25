import { and, eq } from 'drizzle-orm'
import { db, schema } from '../../database'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = Number(getRouterParam(event, 'id'))
  await db.delete(schema.clients).where(and(eq(schema.clients.id, id), eq(schema.clients.userId, userId)))
  return { success: true }
})
