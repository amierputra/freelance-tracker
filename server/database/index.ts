import mysql from 'mysql2/promise'
import { drizzle } from 'drizzle-orm/mysql2'
import * as schema from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

const pool = mysql.createPool(process.env.DATABASE_URL)

export const db = drizzle(pool, { schema, mode: 'default' })
export { schema }

// Single app-wide settings row, created on first access
export async function getSettings() {
  const [row] = await db.select().from(schema.settings).limit(1)
  if (row) return row
  await db.insert(schema.settings).values({})
  const [created] = await db.select().from(schema.settings).limit(1)
  return created!
}
