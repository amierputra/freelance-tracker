import { eq, inArray, sql } from 'drizzle-orm'
import { db, schema } from '../database'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const now = new Date()
  const today = isoDate(now)
  const weekEnd = isoDate(new Date(now.getTime() + 7 * 86400000))
  const [year, month] = today.split('-').map(Number) as [number, number]
  const start = new Date(Date.UTC(year, month - 6, 1))
  const sixMonthsAgo = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}-01`

  // Outstanding balance = sum of payments not yet paid
  const [outstandingRow] = await db.select({
    total: sql<number>`coalesce(sum(${schema.payments.amount}), 0)`
  })
    .from(schema.payments)
    .where(inArray(schema.payments.status, ['pending', 'sent', 'overdue']))

  const activeProjects = await db.select({
    id: schema.projects.id,
    title: schema.projects.title,
    status: schema.projects.status,
    deadline: schema.projects.deadline,
    clientName: schema.clients.name
  })
    .from(schema.projects)
    .leftJoin(schema.clients, eq(schema.projects.clientId, schema.clients.id))
    .where(inArray(schema.projects.status, ['lead', 'in_progress', 'review']))
    .orderBy(sql`${schema.projects.deadline} is null, ${schema.projects.deadline}`)

  const paymentFields = {
    id: schema.payments.id,
    label: schema.payments.label,
    amount: schema.payments.amount,
    status: schema.payments.status,
    dueDate: schema.payments.dueDate,
    projectId: schema.payments.projectId,
    projectTitle: schema.projects.title,
    clientName: schema.clients.name
  }

  const overduePayments = await db.select(paymentFields)
    .from(schema.payments)
    .leftJoin(schema.projects, eq(schema.payments.projectId, schema.projects.id))
    .leftJoin(schema.clients, eq(schema.projects.clientId, schema.clients.id))
    .where(sql`(${schema.payments.status} = 'overdue') or (${schema.payments.status} in ('pending', 'sent') and ${schema.payments.dueDate} is not null and ${schema.payments.dueDate} < ${today})`)
    .orderBy(schema.payments.dueDate)

  // Pending, not overdue, and no invoice generated for it yet
  const readyToInvoice = await db.select(paymentFields)
    .from(schema.payments)
    .leftJoin(schema.projects, eq(schema.payments.projectId, schema.projects.id))
    .leftJoin(schema.clients, eq(schema.projects.clientId, schema.clients.id))
    .where(sql`${schema.payments.status} = 'pending'
      and (${schema.payments.dueDate} is null or ${schema.payments.dueDate} >= ${today})
      and not exists (select 1 from ${schema.invoices} where ${schema.invoices.paymentId} = ${schema.payments.id})`)
    .orderBy(sql`${schema.payments.dueDate} is null, ${schema.payments.dueDate}`)
    .limit(5)

  const dueThisWeek = await db.select(paymentFields)
    .from(schema.payments)
    .leftJoin(schema.projects, eq(schema.payments.projectId, schema.projects.id))
    .leftJoin(schema.clients, eq(schema.projects.clientId, schema.clients.id))
    .where(sql`${schema.payments.status} in ('pending', 'sent') and ${schema.payments.dueDate} between ${today} and ${weekEnd}`)
    .orderBy(schema.payments.dueDate)

  const collected = await db.select({
    month: sql<string>`substr(${schema.payments.paidDate}, 1, 7)`,
    total: sql<number>`sum(${schema.payments.amount})`
  })
    .from(schema.payments)
    .where(sql`${schema.payments.status} = 'paid' and ${schema.payments.paidDate} >= ${sixMonthsAgo}`)
    .groupBy(sql`substr(${schema.payments.paidDate}, 1, 7)`)

  return {
    today,
    outstandingBalance: outstandingRow?.total ?? 0,
    overdueTotal: overduePayments.reduce((sum, p) => sum + p.amount, 0),
    activeProjects,
    overduePayments,
    readyToInvoice,
    // Shown once: a payment already listed as ready to invoice is not repeated
    dueThisWeek: dueThisWeek.filter(p => !readyToInvoice.some(r => r.id === p.id)),
    lateProjects: activeProjects.filter(p => p.status !== 'lead' && p.deadline && p.deadline < today),
    deadlinesThisWeek: activeProjects.filter(p => p.deadline && p.deadline >= today && p.deadline <= weekEnd),
    collected
  }
})
