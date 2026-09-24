<script setup lang="ts">
const props = defineProps<{ showDismissed?: boolean }>()

const { data: status, refresh } = await useFetch('/api/onboarding/status')
const saving = ref(false)

const visible = computed(() => {
  if (!status.value) return false
  if (props.showDismissed) return true
  return !status.value.allDone && !status.value.dismissed
})

const doneCount = computed(() => status.value?.steps.filter(s => s.done).length ?? 0)
const total = computed(() => status.value?.steps.length ?? 0)

async function setDismissed(dismissed: boolean) {
  saving.value = true
  try {
    await $fetch('/api/onboarding/dismiss', { method: 'POST', body: { dismissed } })
    await refresh()
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section
    v-if="visible"
    class="card overflow-hidden"
  >
    <div class="flex items-start justify-between gap-4 px-5 pt-5">
      <div class="min-w-0 flex-1">
        <h2 class="text-[0.9375rem] font-bold text-highlighted">
          Getting started
        </h2>
        <p class="mt-0.5 text-sm text-muted">
          {{ doneCount }} of {{ total }} steps done
        </p>
        <div class="mt-3 h-2 overflow-hidden rounded-full bg-elevated">
          <div
            class="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
            :style="{ width: `${total ? (doneCount / total) * 100 : 0}%` }"
          />
        </div>
      </div>
      <UButton
        v-if="!status?.dismissed"
        color="neutral"
        variant="ghost"
        :loading="saving"
        @click="setDismissed(true)"
      >
        Hide
      </UButton>
      <UButton
        v-else
        color="neutral"
        variant="ghost"
        :loading="saving"
        @click="setDismissed(false)"
      >
        Show on Today
      </UButton>
    </div>

    <ul class="mt-4 px-2 pb-2">
      <li
        v-for="step in status?.steps"
        :key="step.key"
      >
        <NuxtLink
          :to="step.to"
          class="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-elevated/60"
        >
          <UIcon
            :name="step.done ? 'i-lucide-circle-check' : 'i-lucide-circle'"
            :class="step.done ? 'text-primary' : 'text-dimmed'"
            class="size-5 shrink-0"
          />
          <span
            class="flex-1"
            :class="step.done ? 'text-muted line-through' : 'font-medium text-highlighted'"
          >{{ step.label }}</span>
          <UIcon
            v-if="!step.done"
            name="i-lucide-chevron-right"
            class="size-4 text-dimmed"
          />
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>
