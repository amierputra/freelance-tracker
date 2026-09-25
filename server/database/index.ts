import mysql from 'mysql2/promise'
import { drizzle } from 'drizzle-orm/mysql2'
import { and, eq } from 'drizzle-orm'
import * as schema from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

const pool = mysql.createPool(process.env.DATABASE_URL)

export const db = drizzle(pool, { schema, mode: 'default' })
export { schema }

// One settings row per user, created on first access
export async function getSettings(userId: number) {
  const where = eq(schema.settings.userId, userId)
  const [row] = await db.select().from(schema.settings).where(where).limit(1)
  if (row) return row
  await db.insert(schema.settings).values({ userId })
  const [created] = await db.select().from(schema.settings).where(where).limit(1)
  return created!
}

// 404 unless the referenced row belongs to this user (blocks cross-tenant foreign keys)
export async function assertOwned(table: typeof schema.clients | typeof schema.projects | typeof schema.payments, id: number, userId: number) {
  const [row] = await db.select({ id: table.id }).from(table).where(and(eq(table.id, id), eq(table.userId, userId))).limit(1)
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }
}
