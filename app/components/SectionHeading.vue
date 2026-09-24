<script setup lang="ts">
defineProps<{ title: string, count?: number, tone?: 'error' }>()
</script>

<template>
  <h2 class="flex items-center gap-2 text-[0.9375rem] font-bold text-highlighted">
    {{ title }}
    <span
      v-if="count !== undefined"
      class="rounded-full px-2 text-xs font-bold tabular-nums"
      :class="tone === 'error' ? 'bg-error/10 text-error' : 'bg-elevated text-toned'"
    >{{ count }}</span>
    <slot />
  </h2>
</template>
