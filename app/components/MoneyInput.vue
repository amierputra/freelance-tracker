<script setup lang="ts">
const model = defineModel<number>()
defineProps<{ perHour?: boolean }>()
</script>

<template>
  <UInput
    v-model.number="model"
    type="number"
    inputmode="decimal"
    step="0.01"
    min="0"
  >
    <template #leading>
      <span class="text-sm text-muted">RM</span>
    </template>
    <template
      v-if="perHour"
      #trailing
    >
      <span class="text-sm text-muted">/ hour</span>
    </template>
  </UInput>
</template>
