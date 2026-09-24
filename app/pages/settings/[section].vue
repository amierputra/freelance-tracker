<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const sections = {
  business: { title: 'Business', description: 'Shown at the top of every invoice.' },
  bank: { title: 'Bank details', description: 'Where clients pay you. Printed on every invoice.' },
  invoicing: { title: 'Invoicing', description: 'Numbering and the note at the bottom of every invoice.' }
} as const
type Section = keyof typeof sections
const section = route.params.section as Section
if (!sections[section]) throw createError({ statusCode: 404, statusMessage: 'Settings page not found', fatal: true })
const meta = sections[section]

const confirm = useConfirm()
const { busy, run } = useAction()
const { error: loadError, data: settings, refresh } = await useFetch('/api/settings')
if (loadError.value) throw createError({ statusCode: loadError.value.statusCode, statusMessage: loadError.value.statusMessage, fatal: true })

const form = reactive({
  businessName: '',
  businessEmail: '',
  businessPhone: '',
  businessAddress: '',
  bankName: '',
  bankAccountName: '',
  bankAccountNumber: '',
  invoicePrefix: 'INV',
  invoiceNotes: ''
})

watchEffect(() => {
  if (settings.value) {
    form.businessName = settings.value.businessName
    form.businessEmail = settings.value.businessEmail
    form.businessPhone = settings.value.businessPhone
    form.businessAddress = settings.value.businessAddress
    form.bankName = settings.value.bankName
    form.bankAccountName = settings.value.bankAccountName
    form.bankAccountNumber = settings.value.bankAccountNumber
    form.invoicePrefix = settings.value.invoicePrefix
    form.invoiceNotes = settings.value.invoiceNotes
  }
})

const dirty = computed(() => !!settings.value && (Object.keys(form) as (keyof typeof form)[]).some(k => form[k] !== settings.value![k]))

async function save() {
  const ok = await run('save', () => $fetch('/api/settings', { method: 'PATCH', body: form }), {
    success: 'Settings saved',
    error: 'Could not save settings'
  })
  if (ok) await refresh()
}

onBeforeRouteLeave(async () => {
  if (!dirty.value) return true
  return confirm({
    title: 'Leave without saving?',
    description: 'Your changes to settings will be lost.',
    confirmLabel: 'Discard changes'
  })
})

// Browser close or reload
function warnUnsaved(e: BeforeUnloadEvent) {
  if (dirty.value) e.preventDefault()
}
onMounted(() => window.addEventListener('beforeunload', warnUnsaved))
onBeforeUnmount(() => window.removeEventListener('beforeunload', warnUnsaved))
</script>

<template>
  <div class="max-w-2xl">
    <PageHeader
      :title="meta.title"
      :description="meta.description"
      :back="{ to: '/settings', label: 'Settings' }"
    />

    <form
      class="space-y-5"
      @submit.prevent="save"
    >
      <section
        v-if="section === 'business'"
        class="card p-5 sm:p-7"
      >
        <div class="space-y-4">
          <UFormField label="Business name">
            <UInput
              v-model="form.businessName"
              class="w-full"
            />
          </UFormField>
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Email">
              <UInput
                v-model="form.businessEmail"
                type="email"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Phone">
              <UInput
                v-model="form.businessPhone"
                type="tel"
                class="w-full"
              />
            </UFormField>
          </div>
          <UFormField
            label="Address"
            description="One line per address line"
          >
            <UTextarea
              v-model="form.businessAddress"
              :rows="3"
              class="w-full"
            />
          </UFormField>
        </div>
      </section>
      <section
        v-if="section === 'bank'"
        class="card p-5 sm:p-7"
      >
        <div class="space-y-4">
          <UFormField label="Bank name">
            <UInput
              v-model="form.bankName"
              placeholder="e.g. Maybank"
              class="w-full"
            />
          </UFormField>
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Account name">
              <UInput
                v-model="form.bankAccountName"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Account number">
              <UInput
                v-model="form.bankAccountNumber"
                inputmode="numeric"
                class="w-full"
              />
            </UFormField>
          </div>
        </div>
      </section>
      <section
        v-if="section === 'invoicing'"
        class="card p-5 sm:p-7"
      >
        <div class="space-y-4">
          <UFormField
            label="Invoice number prefix"
            :description="`Next invoice: ${form.invoicePrefix || 'INV'}-${String(settings?.nextInvoiceNumber ?? 1).padStart(4, '0')}`"
          >
            <UInput
              v-model="form.invoicePrefix"
              class="w-full sm:w-40"
            />
          </UFormField>
          <UFormField
            label="Default invoice notes"
            description="Printed at the bottom of every invoice, e.g. payment terms."
          >
            <UTextarea
              v-model="form.invoiceNotes"
              :rows="3"
              class="w-full"
            />
          </UFormField>
        </div>
      </section>

      <div class="card sticky bottom-20 z-10 flex items-center justify-end gap-3 px-5 py-3 lg:bottom-4">
        <span
          v-if="dirty"
          class="text-sm text-muted"
          aria-live="polite"
        >Unsaved changes</span>
        <UButton
          type="submit"
          :loading="busy === 'save'"
          :disabled="!dirty"
        >
          Save settings
        </UButton>
      </div>
    </form>
  </div>
</template>
