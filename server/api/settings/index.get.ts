import { getSettings } from '../../database'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  return getSettings()
})
