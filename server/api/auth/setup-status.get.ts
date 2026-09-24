import { db, schema } from '../../database'

export default defineEventHandler(async () => {
  return { needsSetup: await db.$count(schema.users) === 0 }
})
