import { and, eq } from 'drizzle-orm'
import { db, schema } from '../../database'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = Number(getRouterParam(event, 'id'))

  const [client] = await db.select().from(schema.clients).where(and(eq(schema.clients.id, id), eq(schema.clients.userId, userId))).limit(1)
  if (!client) {
    throw createError({ statusCode: 404, statusMessage: 'Client not found' })
  }

  const clientProjects = await db.select().from(schema.projects).where(eq(schema.projects.clientId, id))

  return { ...client, projects: clientProjects }
})
