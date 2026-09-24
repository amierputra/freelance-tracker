import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// --- Users (single freelancer login, but table supports more if ever needed) ---
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  createdAt: text('created_at').notNull().default(sql`(current_timestamp)`)
})

// --- Settings (business info used on invoices; single row app-wide) ---
export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  businessName: text('business_name').notNull().default(''),
  businessEmail: text('business_email').notNull().default(''),
  businessPhone: text('business_phone').notNull().default(''),
  businessAddress: text('business_address').notNull().default(''),
  bankName: text('bank_name').notNull().default(''),
  bankAccountName: text('bank_account_name').notNull().default(''),
  bankAccountNumber: text('bank_account_number').notNull().default(''),
  invoicePrefix: text('invoice_prefix').notNull().default('INV'),
  nextInvoiceNumber: integer('next_invoice_number').notNull().default(1),
  invoiceNotes: text('invoice_notes').notNull().default(''),
  onboardingDismissedAt: text('onboarding_dismissed_at'),
  updatedAt: text('updated_at').notNull().default(sql`(current_timestamp)`)
})

// --- Clients ---
export const clients = sqliteTable('clients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  company: text('company').notNull().default(''),
  email: text('email').notNull().default(''),
  phone: text('phone').notNull().default(''),
  notes: text('notes').notNull().default(''),
  status: text('status', { enum: ['active', 'inactive'] }).notNull().default('active'),
  createdAt: text('created_at').notNull().default(sql`(current_timestamp)`),
  updatedAt: text('updated_at').notNull().default(sql`(current_timestamp)`)
})

// --- Projects ---
export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientId: integer('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  status: text('status', {
    enum: ['lead', 'in_progress', 'review', 'completed', 'cancelled']
  }).notNull().default('lead'),
  pricingType: text('pricing_type', { enum: ['fixed', 'hourly'] }).notNull().default('fixed'),
  amount: real('amount').notNull().default(0), // fixed total, or hourly rate
  startDate: text('start_date'),
  deadline: text('deadline'),
  createdAt: text('created_at').notNull().default(sql`(current_timestamp)`),
  updatedAt: text('updated_at').notNull().default(sql`(current_timestamp)`)
})

// --- Payments (one or many per project: deposit, milestone, final, or single lump sum) ---
export const payments = sqliteTable('payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  label: text('label').notNull().default('Payment'), // e.g. "Deposit", "Final payment", "Full payment"
  amount: real('amount').notNull(),
  status: text('status', {
    enum: ['pending', 'sent', 'paid', 'overdue']
  }).notNull().default('pending'),
  dueDate: text('due_date'),
  paidDate: text('paid_date'),
  createdAt: text('created_at').notNull().default(sql`(current_timestamp)`),
  updatedAt: text('updated_at').notNull().default(sql`(current_timestamp)`)
})

// --- Invoices (generated PDF tied to one or more payments) ---
export const invoices = sqliteTable('invoices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  invoiceNumber: text('invoice_number').notNull().unique(),
  clientId: integer('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  paymentId: integer('payment_id').references(() => payments.id, { onDelete: 'set null' }),
  issueDate: text('issue_date').notNull(),
  dueDate: text('due_date'),
  subtotal: real('subtotal').notNull().default(0),
  total: real('total').notNull().default(0),
  currency: text('currency').notNull().default('MYR'),
  lineItems: text('line_items', { mode: 'json' }).notNull().$type<{ description: string, amount: number }[]>(),
  status: text('status', { enum: ['draft', 'sent', 'paid'] }).notNull().default('draft'),
  pdfPath: text('pdf_path'),
  createdAt: text('created_at').notNull().default(sql`(current_timestamp)`)
})
