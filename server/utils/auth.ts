import type { H3Event } from 'h3'

// Tenant id for the request; every query on tenant tables filters by it
export async function requireUserId(event: H3Event) {
  const { user } = await requireUserSession(event)
  return user.id
}
