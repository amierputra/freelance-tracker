import { eq } from 'drizzle-orm'
import { db, schema } from '../../database'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const id = Number(getRouterParam(event, 'id'))
  await db.delete(schema.clients).where(eq(schema.clients.id, id))
  return { success: true }
})
