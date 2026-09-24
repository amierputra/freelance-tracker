type BadgeColor = 'primary' | 'neutral' | 'info' | 'success' | 'warning' | 'error'

export function money(n: number) {
  return `RM ${n.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDate(d: string | null | undefined, withYear = true) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', ...(withYear && { year: 'numeric' }) })
}

export function initialsOf(name: string | null | undefined) {
  return (name ?? '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export const projectStatus: Record<string, { label: string, color: BadgeColor }> = {
  lead: { label: 'Lead', color: 'neutral' },
  in_progress: { label: 'In progress', color: 'primary' },
  review: { label: 'In review', color: 'warning' },
  completed: { label: 'Completed', color: 'success' },
  cancelled: { label: 'Cancelled', color: 'error' }
}

export const paymentStatus: Record<string, { label: string, color: BadgeColor }> = {
  pending: { label: 'Pending', color: 'neutral' },
  sent: { label: 'Sent', color: 'info' },
  paid: { label: 'Paid', color: 'success' },
  overdue: { label: 'Overdue', color: 'error' }
}

export const invoiceStatus: Record<string, { label: string, color: BadgeColor }> = {
  draft: { label: 'Draft', color: 'neutral' },
  sent: { label: 'Sent', color: 'info' },
  paid: { label: 'Paid', color: 'success' }
}

export const toItems = (map: Record<string, { label: string }>) =>
  Object.entries(map).map(([value, { label }]) => ({ label, value }))
