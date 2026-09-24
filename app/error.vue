<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const notFound = computed(() => props.error.statusCode === 404)

function retry() {
  clearError({ redirect: useRoute().fullPath })
}
</script>

<template>
  <NuxtLayout>
    <EmptyState
      :icon="notFound ? 'i-lucide-search-x' : 'i-lucide-cloud-off'"
      :title="notFound ? 'Not found' : 'Something went wrong'"
      :description="error.statusMessage || (notFound ? 'It may have been deleted.' : 'Check your connection and try again.')"
    >
      <div class="flex justify-center gap-2">
        <UButton
          v-if="!notFound"
          icon="i-lucide-refresh-cw"
          @click="retry"
        >
          Retry
        </UButton>
        <UButton
          color="neutral"
          variant="outline"
          @click="clearError({ redirect: '/' })"
        >
          Go to Today
        </UButton>
      </div>
    </EmptyState>
  </NuxtLayout>
</template>
