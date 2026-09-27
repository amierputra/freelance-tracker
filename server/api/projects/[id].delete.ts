import { and, eq } from 'drizzle-orm'
import { db, schema } from '../../database'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = Number(getRouterParam(event, 'id'))
  await db.delete(schema.projects).where(and(eq(schema.projects.id, id), eq(schema.projects.userId, userId)))
  return { success: true }
})
