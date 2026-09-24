<script setup lang="ts">
defineProps<{ title: string, description?: string, confirmLabel?: string }>()
const emit = defineEmits<{ close: [boolean] }>()
</script>

<template>
  <UModal
    :title="title"
    :description="description"
    :ui="{ footer: 'justify-end' }"
  >
    <template #footer>
      <UButton
        color="neutral"
        variant="ghost"
        @click="emit('close', false)"
      >
        Cancel
      </UButton>
      <UButton
        color="error"
        @click="emit('close', true)"
      >
        {{ confirmLabel ?? 'Delete' }}
      </UButton>
    </template>
  </UModal>
</template>
