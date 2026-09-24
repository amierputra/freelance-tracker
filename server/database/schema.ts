import { mysqlTable, mysqlEnum, varchar, int, double, timestamp, customType } from 'drizzle-orm/mysql-core'

// JSON stored as text: MariaDB returns JSON columns as strings, so parse here instead of relying on the driver
const jsonText = <T>() => customType<{ data: T, driverData: string }>({
  dataType: () => 'text',
  toDriver: value => JSON.stringify(value),
  fromDriver: value => (typeof value === 'string' ? JSON.parse(value) : value)
})

const createdAt = () => timestamp('created_at', { mode: 'string' }).notNull().defaultNow()
const updatedAt = () => timestamp('updated_at', { mode: 'string' }).notNull().defaultNow().onUpdateNow()

// --- Users (single freelancer login, but table supports more if ever needed) ---
export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: createdAt()
})

// --- Settings (business info used on invoices; single row app-wide) ---
export const settings = mysqlTable('settings', {
  id: int('id').primaryKey().autoincrement(),
  businessName: varchar('business_name', { length: 255 }).notNull().default(''),
  businessEmail: varchar('business_email', { length: 255 }).notNull().default(''),
  businessPhone: varchar('business_phone', { length: 64 }).notNull().default(''),
  businessAddress: varchar('business_address', { length: 1000 }).notNull().default(''),
  bankName: varchar('bank_name', { length: 255 }).notNull().default(''),
  bankAccountName: varchar('bank_account_name', { length: 255 }).notNull().default(''),
  bankAccountNumber: varchar('bank_account_number', { length: 64 }).notNull().default(''),
  invoicePrefix: varchar('invoice_prefix', { length: 32 }).notNull().default('INV'),
  nextInvoiceNumber: int('next_invoice_number').notNull().default(1),
  invoiceNotes: varchar('invoice_notes', { length: 2000 }).notNull().default(''),
  onboardingDismissedAt: varchar('onboarding_dismissed_at', { length: 32 }),
  updatedAt: updatedAt()
})

// --- Clients ---
export const clients = mysqlTable('clients', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  company: varchar('company', { length: 255 }).notNull().default(''),
  email: varchar('email', { length: 255 }).notNull().default(''),
  phone: varchar('phone', { length: 64 }).notNull().default(''),
  notes: varchar('notes', { length: 5000 }).notNull().default(''),
  status: mysqlEnum('status', ['active', 'inactive']).notNull().default('active'),
  createdAt: createdAt(),
  updatedAt: updatedAt()
})

// --- Projects ---
export const projects = mysqlTable('projects', {
  id: int('id').primaryKey().autoincrement(),
  clientId: int('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: varchar('description', { length: 5000 }).notNull().default(''),
  status: mysqlEnum('status', ['lead', 'in_progress', 'review', 'completed', 'cancelled']).notNull().default('lead'),
  pricingType: mysqlEnum('pricing_type', ['fixed', 'hourly']).notNull().default('fixed'),
  amount: double('amount').notNull().default(0), // fixed total, or hourly rate
  startDate: varchar('start_date', { length: 10 }),
  deadline: varchar('deadline', { length: 10 }),
  createdAt: createdAt(),
  updatedAt: updatedAt()
})

// --- Payments (one or many per project: deposit, milestone, final, or single lump sum) ---
export const payments = mysqlTable('payments', {
  id: int('id').primaryKey().autoincrement(),
  projectId: int('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  label: varchar('label', { length: 255 }).notNull().default('Payment'), // e.g. "Deposit", "Final payment", "Full payment"
  amount: double('amount').notNull(),
  status: mysqlEnum('status', ['pending', 'sent', 'paid', 'overdue']).notNull().default('pending'),
  dueDate: varchar('due_date', { length: 10 }),
  paidDate: varchar('paid_date', { length: 10 }),
  createdAt: createdAt(),
  updatedAt: updatedAt()
})

// --- Invoices (generated PDF tied to one or more payments) ---
export const invoices = mysqlTable('invoices', {
  id: int('id').primaryKey().autoincrement(),
  invoiceNumber: varchar('invoice_number', { length: 64 }).notNull().unique(),
  clientId: int('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  projectId: int('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  paymentId: int('payment_id').references(() => payments.id, { onDelete: 'set null' }),
  issueDate: varchar('issue_date', { length: 10 }).notNull(),
  dueDate: varchar('due_date', { length: 10 }),
  subtotal: double('subtotal').notNull().default(0),
  total: double('total').notNull().default(0),
  currency: varchar('currency', { length: 8 }).notNull().default('MYR'),
  lineItems: jsonText<{ description: string, amount: number }[]>()('line_items').notNull(),
  status: mysqlEnum('status', ['draft', 'sent', 'paid']).notNull().default('draft'),
  pdfPath: varchar('pdf_path', { length: 500 }),
  createdAt: createdAt()
})
