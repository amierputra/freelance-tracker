import { eq } from 'drizzle-orm'
import { db, schema } from '../../database'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const id = Number(getRouterParam(event, 'id'))
  await db.delete(schema.projects).where(eq(schema.projects.id, id))
  return { success: true }
})
