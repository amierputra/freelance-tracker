// Runs a mutation with a busy key and success/error toasts; resolves false on failure
export function useAction() {
  const toast = useToast()
  const busy = ref<string | null>(null)

  async function run(key: string, fn: () => Promise<unknown>, messages: { success?: string, error: string }) {
    busy.value = key
    try {
      await fn()
      if (messages.success) toast.add({ title: messages.success, color: 'success' })
      return true
    } catch (e) {
      toast.add({ title: messages.error, description: (e as { data?: { statusMessage?: string } }).data?.statusMessage, color: 'error' })
      return false
    } finally {
      busy.value = null
    }
  }

  return { busy, run }
}
