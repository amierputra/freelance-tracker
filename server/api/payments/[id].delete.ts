import { eq } from 'drizzle-orm'
import { db, schema } from '../../database'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const id = Number(getRouterParam(event, 'id'))
  db.delete(schema.payments).where(eq(schema.payments.id, id)).run()
  return { success: true }
})
