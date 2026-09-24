import { desc, eq, sql } from 'drizzle-orm'
import { db, schema } from '../../database'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const rows = db.select({
    id: schema.projects.id,
    title: schema.projects.title,
    description: schema.projects.description,
    status: schema.projects.status,
    pricingType: schema.projects.pricingType,
    amount: schema.projects.amount,
    startDate: schema.projects.startDate,
    deadline: schema.projects.deadline,
    createdAt: schema.projects.createdAt,
    clientId: schema.projects.clientId,
    clientName: schema.clients.name,
    owed: sql<number>`(select coalesce(sum(pay.amount), 0) from payments pay where pay.project_id = "projects"."id" and pay.status != 'paid')`
  })
    .from(schema.projects)
    .leftJoin(schema.clients, eq(schema.projects.clientId, schema.clients.id))
    .orderBy(desc(schema.projects.createdAt))
    .all()

  return rows
})
