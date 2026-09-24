import ConfirmModal from '~/components/ConfirmModal.vue'

// Resolves true only when the user presses the confirm button
export function useConfirm() {
  const modal = useOverlay().create(ConfirmModal)
  return async (props: { title: string, description?: string, confirmLabel?: string }) =>
    (await modal.open(props).result) === true
}
