import { getSettings } from '../../database'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  return getSettings(userId)
})
