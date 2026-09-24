// Marks a payment paid with an Undo toast that restores its previous status.
// Pass the page's useAction() so busy keys stay shared with its other buttons.
export function useMarkPaid(refresh: () => Promise<unknown>, { run }: ReturnType<typeof useAction>) {
  const toast = useToast()

  async function markPaid(payment: { id: number, status: string }) {
    const prev = payment.status
    const ok = await run(`pay${payment.id}`, () => $fetch(`/api/payments/${payment.id}`, {
      method: 'PATCH',
      body: { status: 'paid', paidDate: todayISO() }
    }), { error: 'Could not mark as paid' })
    if (!ok) return
    await refresh()
    toast.add({
      title: 'Marked as paid',
      color: 'success',
      actions: [{
        label: 'Undo',
        onClick: () => run(`undo${payment.id}`, () => $fetch(`/api/payments/${payment.id}`, {
          method: 'PATCH',
          body: { status: prev, paidDate: null }
        }), { error: 'Could not undo' }).then(done => done && refresh())
      }]
    })
  }

  return markPaid
}
