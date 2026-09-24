<script setup lang="ts">
// Grid columns come from the parent's class, e.g. "grid-cols-2 sm:grid-cols-4"
defineProps<{ items: { label: string, value: string, hint?: string, icon?: string, class?: string }[] }>()
</script>

<template>
  <dl class="card grid gap-x-6 gap-y-5 p-5 sm:p-6">
    <div
      v-for="item in items"
      :key="item.label"
      class="min-w-0"
    >
      <dt class="text-sm text-muted">
        {{ item.label }}
      </dt>
      <dd
        class="mt-1 flex items-center gap-1.5 text-lg font-bold tracking-tight tabular-nums"
        :class="item.class ?? 'text-highlighted'"
      >
        <UIcon
          v-if="item.icon"
          :name="item.icon"
          class="size-4 shrink-0"
        />
        <span class="truncate">{{ item.value }}<span
          v-if="item.hint"
          class="text-sm font-normal text-muted"
        >{{ item.hint }}</span></span>
      </dd>
    </div>
  </dl>
</template>
