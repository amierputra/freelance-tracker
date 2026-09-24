<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { error: loadError, data: projects } = await useFetch('/api/projects')
if (loadError.value) throw createError({ statusCode: loadError.value.statusCode, statusMessage: loadError.value.statusMessage, fatal: true })

const ACTIVE = ['lead', 'in_progress', 'review']
const search = ref('')
const filter = ref<'active' | 'completed' | 'cancelled' | 'all'>('active')

const groups = {
  active: (s: string) => ACTIVE.includes(s),
  completed: (s: string) => s === 'completed',
  cancelled: (s: string) => s === 'cancelled',
  all: () => true
}

const filterItems = computed(() => (['active', 'completed', 'cancelled', 'all'] as const).map(key => ({
  label: `${key[0]!.toUpperCase()}${key.slice(1)} · ${(projects.value ?? []).filter(p => groups[key](p.status)).length}`,
  value: key
})))

const today = todayISO()
const isLate = (p: { deadline: string | null, status: string }) => !!p.deadline && p.deadline < today && ACTIVE.includes(p.status) && p.status !== 'lead'

const visible = computed(() => {
  const q = search.value.trim().toLowerCase()
  return (projects.value ?? [])
    .filter(p => groups[filter.value](p.status))
    .filter(p => !q || p.title.toLowerCase().includes(q) || p.clientName?.toLowerCase().includes(q))
    // Active work sorts by nearest deadline; everything else keeps newest first
    .sort((a, b) => filter.value === 'active' ? (a.deadline ?? '9999').localeCompare(b.deadline ?? '9999') : 0)
})
</script>

<template>
  <div>
    <PageHeader
      title="Projects"
      description="Active work first, sorted by the nearest deadline."
    >
      <template #actions>
        <UButton
          to="/projects/new"
          icon="i-lucide-plus"
        >
          New project
        </UButton>
      </template>
    </PageHeader>

    <div
      v-if="projects?.length"
      class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <UTabs
        v-model="filter"
        :items="filterItems"
        :content="false"
        size="sm"
        class="w-full overflow-x-auto sm:w-auto"
      />
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Search project or client"
        class="w-full sm:w-72"
      />
    </div>

    <div
      v-if="visible.length"
      class="card overflow-hidden"
    >
      <div class="hidden gap-4 border-b border-default px-5 py-3 text-xs font-medium text-muted md:grid md:grid-cols-[minmax(0,1fr)_8rem_9rem_7rem]">
        <span>Project</span>
        <span>Deadline</span>
        <span class="text-right">Price</span>
        <span class="text-right">Status</span>
      </div>
      <ul class="divide-y divide-default">
        <li
          v-for="project in visible"
          :key="project.id"
        >
          <NuxtLink
            :to="`/projects/${project.id}`"
            class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-5 py-4 transition-colors hover:bg-elevated/50 md:grid-cols-[minmax(0,1fr)_8rem_9rem_7rem]"
          >
            <span class="min-w-0">
              <span class="block truncate font-semibold text-highlighted">{{ project.title }}</span>
              <span class="block truncate text-sm text-muted">{{ project.clientName }}</span>
            </span>
            <span
              class="order-last col-span-2 flex items-center gap-1 text-sm md:order-0 md:col-span-1"
              :class="isLate(project) ? 'font-semibold text-error' : 'text-muted'"
            >
              <UIcon
                v-if="isLate(project)"
                name="i-lucide-alarm-clock"
                class="size-3.5 shrink-0"
              />
              <span class="md:hidden">Due </span>{{ formatDate(project.deadline) }}
              <span
                v-if="isLate(project)"
                class="sr-only"
              >(late)</span>
            </span>
            <span class="hidden text-right whitespace-nowrap tabular-nums md:block">
              <span class="block font-semibold text-highlighted">{{ money(project.amount) }}<span
                v-if="project.pricingType === 'hourly'"
                class="text-xs font-normal text-muted"
              > / h</span></span>
              <span
                class="block text-xs"
                :class="project.owed ? 'font-medium text-default' : 'text-muted'"
              >{{ project.owed ? `${money(project.owed)} owed` : project.pricingType === 'hourly' ? 'per hour' : 'fixed' }}</span>
            </span>
            <span class="text-right">
              <UBadge
                :color="projectStatus[project.status]?.color"
                variant="subtle"
              >
                {{ projectStatus[project.status]?.label }}
              </UBadge>
            </span>
          </NuxtLink>
        </li>
      </ul>
    </div>

    <EmptyState
      v-else
      icon="i-lucide-briefcase"
      :title="projects?.length ? 'No projects here' : 'No projects yet'"
      :description="projects?.length ? 'Try a different search or filter.' : 'Create a project for a client, then add its payments.'"
    >
      <UButton
        v-if="!projects?.length"
        to="/projects/new"
        icon="i-lucide-plus"
      >
        New project
      </UButton>
    </EmptyState>
  </div>
</template>
