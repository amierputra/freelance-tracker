<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const toast = useToast()
const clientId = route.params.id as string

const { error: loadError, data: client, refresh } = await useFetch(`/api/clients/${clientId}`)
if (loadError.value) throw createError({ statusCode: loadError.value.statusCode, statusMessage: loadError.value.statusMessage, fatal: true })
const confirm = useConfirm()
const { run } = useAction()

const editing = ref(false)
const saving = ref(false)
const form = reactive({
  name: '',
  company: '',
  email: '',
  phone: '',
  notes: '',
  status: 'active' as 'active' | 'inactive'
})

watchEffect(() => {
  if (client.value) {
    form.name = client.value.name
    form.company = client.value.company
    form.email = client.value.email
    form.phone = client.value.phone
    form.notes = client.value.notes
    form.status = client.value.status
  }
})

async function saveClient() {
  saving.value = true
  try {
    await $fetch(`/api/clients/${clientId}`, { method: 'PATCH', body: form })
    toast.add({ title: 'Client updated', color: 'success' })
    editing.value = false
    await refresh()
  } catch (e) {
    toast.add({ title: 'Failed to update', description: (e as { data?: { statusMessage?: string } }).data?.statusMessage, color: 'error' })
  } finally {
    saving.value = false
  }
}

async function deleteClient() {
  const yes = await confirm({
    title: `Delete ${client.value?.name}?`,
    description: 'This also deletes all their projects, payments and invoices. It cannot be undone.',
    confirmLabel: 'Delete client'
  })
  if (!yes) return
  const ok = await run('delete', () => $fetch(`/api/clients/${clientId}`, { method: 'DELETE' }), {
    success: 'Client deleted',
    error: 'Could not delete client'
  })
  if (ok) router.push('/clients')
}

const moreMenu = [[{ label: 'Delete client', icon: 'i-lucide-trash-2', color: 'error' as const, onSelect: deleteClient }]]
</script>

<template>
  <div v-if="client">
    <PageHeader
      :title="client.name"
      :back="{ to: '/clients', label: 'Clients' }"
    >
      <template #description>
        {{ client.company || 'No company' }} ·
        <span :class="client.status === 'active' ? 'text-success' : ''">{{ client.status === 'active' ? 'Active' : 'Inactive' }}</span>
      </template>
      <template #actions>
        <UButton
          :to="`/projects/new?clientId=${client.id}`"
          icon="i-lucide-plus"
        >
          New project
        </UButton>
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-pencil"
          @click="editing = true"
        >
          Edit
        </UButton>
        <UDropdownMenu :items="moreMenu">
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-ellipsis"
            aria-label="More actions"
          />
        </UDropdownMenu>
      </template>
    </PageHeader>

    <div class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] xl:gap-14">
      <section class="min-w-0">
        <SectionHeading
          title="Projects"
          :count="client.projects?.length ?? 0"
          class="mb-2.5"
        />
        <ul
          v-if="client.projects?.length"
          class="divide-y divide-default card overflow-hidden"
        >
          <li
            v-for="project in client.projects"
            :key="project.id"
          >
            <NuxtLink
              :to="`/projects/${project.id}`"
              class="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-elevated/50"
            >
              <span class="min-w-0 flex-1">
                <span class="block truncate font-semibold text-highlighted">{{ project.title }}</span>
                <span class="block truncate text-sm text-muted">{{ project.deadline ? `Due ${formatDate(project.deadline)}` : 'No deadline' }}</span>
              </span>
              <span class="hidden text-right whitespace-nowrap sm:block">
                <span class="block font-semibold text-highlighted tabular-nums">{{ money(project.amount) }}</span>
                <span class="block text-xs text-muted">{{ project.pricingType === 'hourly' ? 'per hour' : 'fixed' }}</span>
              </span>
              <UBadge
                :color="projectStatus[project.status]?.color"
                variant="subtle"
                class="w-24 justify-center"
              >
                {{ projectStatus[project.status]?.label }}
              </UBadge>
            </NuxtLink>
          </li>
        </ul>
        <EmptyState
          v-else
          title="No projects yet"
          :description="`Create a project to start tracking payments for ${client.name}.`"
        >
          <UButton
            :to="`/projects/new?clientId=${client.id}`"
            icon="i-lucide-plus"
          >
            New project
          </UButton>
        </EmptyState>
      </section>

      <aside class="card space-y-6 self-start p-5 sm:p-6">
        <section>
          <h2 class="mb-3 text-[0.9375rem] font-bold text-highlighted">
            Contact
          </h2>
          <dl class="space-y-3 text-sm">
            <div class="flex items-center gap-2.5">
              <UIcon
                name="i-lucide-mail"
                class="size-4 shrink-0 text-muted"
              />
              <dt class="sr-only">
                Email
              </dt>
              <dd class="min-w-0 truncate">
                <a
                  v-if="client.email"
                  :href="`mailto:${client.email}`"
                  class="text-highlighted hover:underline"
                >{{ client.email }}</a>
                <span
                  v-else
                  class="text-muted"
                >No email</span>
              </dd>
            </div>
            <div class="flex items-center gap-2.5">
              <UIcon
                name="i-lucide-phone"
                class="size-4 shrink-0 text-muted"
              />
              <dt class="sr-only">
                Phone
              </dt>
              <dd>
                <a
                  v-if="client.phone"
                  :href="`tel:${client.phone}`"
                  class="text-highlighted hover:underline"
                >{{ client.phone }}</a>
                <span
                  v-else
                  class="text-muted"
                >No phone</span>
              </dd>
            </div>
            <div class="flex items-center gap-2.5">
              <UIcon
                name="i-lucide-building-2"
                class="size-4 shrink-0 text-muted"
              />
              <dt class="sr-only">
                Company
              </dt>
              <dd :class="client.company ? 'text-highlighted' : 'text-muted'">
                {{ client.company || 'No company' }}
              </dd>
            </div>
          </dl>
        </section>
        <section class="border-t border-default pt-6">
          <h2 class="mb-2 text-[0.9375rem] font-bold text-highlighted">
            Notes
          </h2>
          <p
            class="text-sm whitespace-pre-wrap"
            :class="client.notes ? 'text-default' : 'text-muted'"
          >
            {{ client.notes || 'No notes.' }}
          </p>
        </section>
      </aside>
    </div>

    <UModal
      v-model:open="editing"
      title="Edit client"
    >
      <template #body>
        <form
          class="space-y-4"
          @submit.prevent="saveClient"
        >
          <UFormField
            label="Name"
            required
          >
            <UInput
              v-model="form.name"
              required
              class="w-full"
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
          <UFormField label="Status">
            <USelect
              v-model="form.status"
              :items="[{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }]"
              value-key="value"
              class="w-full"
            />
          </UFormField>
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
              @click="editing = false"
            >
              Cancel
            </UButton>
            <UButton
              type="submit"
              :loading="saving"
            >
              Save
            </UButton>
          </div>
        </form>
      </template>
    </UModal>
  </div>
</template>
