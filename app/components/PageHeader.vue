<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  back?: { to: string, label: string }
}>()
</script>

<template>
  <header class="mb-8">
    <NuxtLink
      v-if="back"
      :to="back.to"
      class="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-highlighted"
    >
      <UIcon
        name="i-lucide-chevron-left"
        class="size-4"
      />
      {{ back.label }}
    </NuxtLink>
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-3xl font-semibold tracking-tight text-balance text-highlighted">
          {{ title }}
        </h1>
        <p
          v-if="description || $slots.description"
          class="mt-1.5 text-sm text-muted"
        >
          <slot name="description">
            {{ description }}
          </slot>
        </p>
      </div>
      <div
        v-if="$slots.actions"
        class="flex flex-wrap items-center gap-2"
      >
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>
