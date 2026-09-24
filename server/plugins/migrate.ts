import { existsSync } from 'node:fs'
import { migrate } from 'drizzle-orm/mysql2/migrator'
import { db } from '../database'

// Apply pending migrations on boot (Hostinger has no shell to run drizzle-kit).
// Dev reads the source folder; builds get a copy in .output/server/migrations (see nuxt.config.ts).
const candidates = [
  './server/database/migrations', // dev, cwd = project root
  './server/migrations', // Hostinger, cwd = .output contents
  './.output/server/migrations' // node .output/server/index.mjs from project root
]

export default defineNitroPlugin(async () => {
  const migrationsFolder = candidates.find(dir => existsSync(`${dir}/meta/_journal.json`))
  if (!migrationsFolder) {
    throw new Error(`Migrations folder not found (cwd ${process.cwd()}), tried: ${candidates.join(', ')}`)
  }
  console.log(`[migrate] using ${migrationsFolder}`)
  await migrate(db, { migrationsFolder })
})
