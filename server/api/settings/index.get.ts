import { db, schema } from '../../database'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  let row = db.select().from(schema.settings).get()
  if (!row) {
    ;[row] = db.insert(schema.settings).values({}).returning().all()
  }
  return row
})
