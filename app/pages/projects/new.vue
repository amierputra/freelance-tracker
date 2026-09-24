<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const toast = useToast()

const { error: loadError, data: clients } = await useFetch('/api/clients')
if (loadError.value) throw createError({ statusCode: loadError.value.statusCode, statusMessage: loadError.value.statusMessage, fatal: true })

const form = reactive({
  clientId: route.query.clientId ? Number(route.query.clientId) : undefined as number | undefined,
  title: '',
  description: '',
  status: 'lead' as 'lead' | 'in_progress' | 'review' | 'completed' | 'cancelled',
  pricingType: 'fixed' as 'fixed' | 'hourly',
  amount: 0,
  startDate: '',
  deadline: ''
})

const saving = ref(false)
const clientMissing = ref(false)
watch(() => form.clientId, () => {
  clientMissing.value = false
})

const clientItems = computed(() => (clients.value ?? []).map(c => ({ label: c.name, value: c.id })))
const statusItems = toItems(projectStatus)
const pricingItems = [
  { label: 'Fixed price', description: 'One total for the whole project', value: 'fixed' },
  { label: 'Hourly rate', description: 'Billed per hour worked', value: 'hourly' }
]

async function createProject() {
  if (!form.clientId) {
    clientMissing.value = true
    return
  }
  saving.value = true
  try {
    const project = await $fetch('/api/projects', {
      method: 'POST',
      body: {
        ...form,
        startDate: form.startDate || null,
        deadline: form.deadline || null
      }
    })
    toast.add({ title: 'Project created', color: 'success' })
    router.push(`/projects/${project.id}`)
  } catch (e) {
    toast.add({ title: 'Failed to create project', description: (e as { data?: { statusMessage?: string } }).data?.statusMessage, color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl">
    <PageHeader
      title="New project"
      description="Add the basics now. Payments come next, on the project page."
      :back="{ to: '/projects', label: 'Projects' }"
    />

    <form
      class="space-y-5"
      @submit.prevent="createProject"
    >
      <section class="card grid gap-6 p-5 sm:p-7 md:grid-cols-[14rem_1fr]">
        <div>
          <h2 class="text-[0.9375rem] font-bold text-highlighted">
            Details
          </h2>
          <p class="mt-1 text-sm text-muted">
            Who it's for and what it is.
          </p>
        </div>
        <div class="space-y-4">
          <UFormField
            label="Client"
            required
            :error="clientMissing ? 'Choose who this project is for.' : false"
          >
            <USelect
              v-model="form.clientId"
              :items="clientItems"
              value-key="value"
              placeholder="Select a client"
              class="w-full"
            />
            <template
              v-if="!clientItems.length"
              #help
            >
              No clients yet. <NuxtLink
                to="/clients"
                class="text-primary hover:underline"
              >Add one first</NuxtLink>.
            </template>
          </UFormField>
          <UFormField
            label="Title"
            required
          >
            <UInput
              v-model="form.title"
              placeholder="e.g. Website revamp"
              required
              class="w-full"
              autofocus
            />
          </UFormField>
          <UFormField label="Description">
            <UTextarea
              v-model="form.description"
              :rows="3"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Status">
            <USelect
              v-model="form.status"
              :items="statusItems"
              value-key="value"
              class="w-full sm:w-56"
            />
          </UFormField>
        </div>
      </section>

      <section class="card grid gap-6 p-5 sm:p-7 md:grid-cols-[14rem_1fr]">
        <div>
          <h2 class="text-[0.9375rem] font-bold text-highlighted">
            Pricing
          </h2>
          <p class="mt-1 text-sm text-muted">
            How you charge for this work.
          </p>
        </div>
        <div class="space-y-4">
          <URadioGroup
            v-model="form.pricingType"
            :items="pricingItems"
            variant="card"
            orientation="horizontal"
            :ui="{ fieldset: 'grid gap-3 sm:grid-cols-2', item: 'w-full' }"
          />
          <UFormField
            :label="form.pricingType === 'fixed' ? 'Total amount' : 'Hourly rate'"
            description="Leave at 0 if it's still a lead without a price."
          >
            <MoneyInput
              v-model="form.amount"
              :per-hour="form.pricingType === 'hourly'"
              class="w-full sm:w-56"
            />
          </UFormField>
        </div>
      </section>

      <section class="card grid gap-6 p-5 sm:p-7 md:grid-cols-[14rem_1fr]">
        <div>
          <h2 class="text-[0.9375rem] font-bold text-highlighted">
            Schedule
          </h2>
          <p class="mt-1 text-sm text-muted">
            The deadline shows up on Today when it's close.
          </p>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Start date">
            <UInput
              v-model="form.startDate"
              type="date"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Deadline">
            <UInput
              v-model="form.deadline"
              type="date"
              class="w-full"
            />
          </UFormField>
        </div>
      </section>

      <div class="flex justify-end gap-2 pt-1">
        <UButton
          to="/projects"
          color="neutral"
          variant="ghost"
        >
          Cancel
        </UButton>
        <UButton
          type="submit"
          :loading="saving"
        >
          Create project
        </UButton>
      </div>
    </form>
  </div>
</template>
