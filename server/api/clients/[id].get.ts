import { eq } from 'drizzle-orm'
import { db, schema } from '../../database'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const id = Number(getRouterParam(event, 'id'))

  const client = db.select().from(schema.clients).where(eq(schema.clients.id, id)).get()
  if (!client) {
    throw createError({ statusCode: 404, statusMessage: 'Client not found' })
  }

  const clientProjects = db.select().from(schema.projects).where(eq(schema.projects.clientId, id)).all()

  return { ...client, projects: clientProjects }
})
