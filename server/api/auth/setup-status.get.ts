import { db, schema } from '../../database'

export default defineEventHandler(() => {
  const existing = db.select().from(schema.users).all()
  return { needsSetup: existing.length === 0 }
})
