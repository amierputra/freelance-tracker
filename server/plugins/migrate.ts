import { migrate } from 'drizzle-orm/mysql2/migrator'
import { db } from '../database'

// Apply pending migrations on boot (Hostinger has no shell to run drizzle-kit).
// Path is cwd-relative, same as ./data: start the server from the project root.
export default defineNitroPlugin(async () => {
  await migrate(db, { migrationsFolder: './server/database/migrations' })
})
