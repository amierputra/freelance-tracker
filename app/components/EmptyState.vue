<script setup lang="ts">
defineProps<{ title: string, description?: string, icon?: string, iconClass?: string }>()
</script>

<template>
  <div class="card px-6 py-14 text-center">
    <UIcon
      v-if="icon"
      :name="icon"
      class="mx-auto mb-4 size-9"
      :class="iconClass ?? 'text-dimmed'"
    />
    <p class="font-semibold text-highlighted">
      {{ title }}
    </p>
    <p
      v-if="description"
      class="mt-1 text-sm text-muted"
    >
      {{ description }}
    </p>
    <div
      v-if="$slots.default"
      class="mt-5"
    >
      <slot />
    </div>
  </div>
</template>
