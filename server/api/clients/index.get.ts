import { desc, getTableColumns, sql } from 'drizzle-orm'
import { db, schema } from '../../database'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  return db.select({
    ...getTableColumns(schema.clients),
    // Qualified by hand: drizzle drops table prefixes in single-table selects, which makes subqueries ambiguous
    owed: sql<number>`(select coalesce(sum(pay.amount), 0) from payments pay join projects pr on pr.id = pay.project_id where pr.client_id = "clients"."id" and pay.status != 'paid')`
  }).from(schema.clients).orderBy(desc(schema.clients.createdAt)).all()
})
