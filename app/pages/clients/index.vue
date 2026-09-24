<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { error: loadError, data: clients, refresh } = await useFetch('/api/clients')
if (loadError.value) throw createError({ statusCode: loadError.value.statusCode, statusMessage: loadError.value.statusMessage, fatal: true })
const toast = useToast()

const search = ref('')
const filter = ref<'active' | 'inactive' | 'all'>('active')

const counts = computed(() => ({
  active: clients.value?.filter(c => c.status === 'active').length ?? 0,
  inactive: clients.value?.filter(c => c.status === 'inactive').length ?? 0,
  all: clients.value?.length ?? 0
}))

const filterItems = computed(() => [
  { label: `Active · ${counts.value.active}`, value: 'active' },
  { label: `Inactive · ${counts.value.inactive}`, value: 'inactive' },
  { label: `All · ${counts.value.all}`, value: 'all' }
])

const visible = computed(() => {
  const q = search.value.trim().toLowerCase()
  return (clients.value ?? []).filter(c =>
    (filter.value === 'all' || c.status === filter.value)
    && (!q || [c.name, c.company, c.email].some(v => v?.toLowerCase().includes(q)))
  )
})

const showModal = ref(false)
const saving = ref(false)
const form = reactive({
  name: '',
  company: '',
  email: '',
  phone: '',
  notes: '',
  status: 'active' as 'active' | 'inactive'
})

function resetForm() {
  form.name = ''
  form.company = ''
  form.email = ''
  form.phone = ''
  form.notes = ''
  form.status = 'active'
}

async function createClient() {
  saving.value = true
  try {
    await $fetch('/api/clients', { method: 'POST', body: form })
    toast.add({ title: 'Client added', color: 'success' })
    showModal.value = false
    resetForm()
    await refresh()
  } catch (e: any) {
    toast.add({ title: 'Failed to add client', description: e?.data?.statusMessage, color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <PageHeader
      title="Clients"
      description="Everyone you work with, and how to reach them."
    >
      <template #actions>
        <UButton
          icon="i-lucide-plus"
          @click="showModal = true"
        >
          Add client
        </UButton>
      </template>
    </PageHeader>

    <div
      v-if="clients?.length"
      class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <UTabs
        v-model="filter"
        :items="filterItems"
        :content="false"
        size="sm"
        class="w-full sm:w-auto"
      />
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Search name, company, email"
        class="w-full sm:w-72"
      />
    </div>

    <ul
      v-if="visible.length"
      class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      <li
        v-for="client in visible"
        :key="client.id"
      >
        <NuxtLink
          :to="`/clients/${client.id}`"
          class="card flex h-full flex-col p-5 transition-shadow hover:shadow-lg"
          :class="client.status === 'inactive' && 'opacity-70'"
        >
          <span class="flex items-start justify-between gap-3">
            <span class="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {{ initialsOf(client.name) }}
            </span>
            <UBadge
              v-if="client.status === 'inactive'"
              color="neutral"
              variant="subtle"
            >
              Inactive
            </UBadge>
          </span>
          <span class="mt-4 block truncate font-semibold text-highlighted">{{ client.name }}</span>
          <span class="block truncate text-sm text-muted">{{ client.company || 'No company' }}</span>
          <span
            class="mt-auto block pt-5 text-sm tabular-nums"
            :class="client.owed ? 'font-bold text-highlighted' : 'text-muted'"
          >{{ client.owed ? `${money(client.owed)} owed` : 'Nothing owed' }}</span>
        </NuxtLink>
      </li>
    </ul>

    <EmptyState
      v-else
      icon="i-lucide-users"
      :title="clients?.length ? 'No clients match' : 'No clients yet'"
      :description="clients?.length ? 'Try a different search or filter.' : 'Add your first client, then create a project for them.'"
    >
      <UButton
        v-if="!clients?.length"
        icon="i-lucide-plus"
        @click="showModal = true"
      >
        Add client
      </UButton>
    </EmptyState>

    <UModal
      v-model:open="showModal"
      title="Add client"
    >
      <template #body>
        <form
          class="space-y-4"
          @submit.prevent="createClient"
        >
          <UFormField
            label="Name"
            required
          >
            <UInput
              v-model="form.name"
              required
              class="w-full"
              autofocus
            />
          </UFormField>
          <UFormField label="Company">
            <UInput
              v-model="form.company"
              class="w-full"
            />
          </UFormField>
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Email">
              <UInput
                v-model="form.email"
                type="email"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Phone">
              <UInput
                v-model="form.phone"
                type="tel"
                class="w-full"
              />
            </UFormField>
          </div>
          <UFormField label="Notes">
            <UTextarea
              v-model="form.notes"
              class="w-full"
            />
          </UFormField>
          <div class="flex justify-end gap-2 pt-2">
            <UButton
              color="neutral"
              variant="ghost"
              @click="showModal = false"
            >
              Cancel
            </UButton>
            <UButton
              type="submit"
              :loading="saving"
            >
              Add client
            </UButton>
          </div>
        </form>
      </template>
    </UModal>
  </div>
</template>
