<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()
const action = useAction()
const { busy, run } = action
const projectId = route.params.id as string

const { error: loadError, data: project, refresh } = await useFetch(`/api/projects/${projectId}`)
if (loadError.value) throw createError({ statusCode: loadError.value.statusCode, statusMessage: loadError.value.statusMessage, fatal: true })
const markPaid = useMarkPaid(refresh, action)

type Payment = NonNullable<typeof project.value>['payments'][number]

const statusItems = toItems(projectStatus)
const paymentStatusItems = toItems(paymentStatus)
const today = todayISO()

const paidTotal = computed(() => (project.value?.payments ?? []).filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0))
const scheduledTotal = computed(() => (project.value?.payments ?? []).reduce((sum, p) => sum + p.amount, 0))
// Fixed projects measure against the agreed price; hourly ones against what has been billed so far
const targetTotal = computed(() => project.value?.pricingType === 'fixed' ? project.value.amount : scheduledTotal.value)
const paidPct = computed(() => targetTotal.value ? Math.min(100, (paidTotal.value / targetTotal.value) * 100) : 0)
// Part of a fixed price not yet split into any payment
const unscheduled = computed(() => project.value?.pricingType === 'fixed' ? Math.max(0, project.value.amount - scheduledTotal.value) : 0)
const deadlineLate = computed(() => !!project.value?.deadline && project.value.deadline < today && !['lead', 'completed', 'cancelled'].includes(project.value.status))

const stats = computed(() => project.value
  ? [
      { label: project.value.pricingType === 'fixed' ? 'Project price' : 'Hourly rate', value: money(project.value.amount), hint: project.value.pricingType === 'hourly' ? ' / h' : undefined },
      { label: 'Paid', value: money(paidTotal.value), class: 'text-success' },
      { label: 'Still owed', value: money(scheduledTotal.value - paidTotal.value) },
      {
        label: 'Deadline',
        value: `${formatDate(project.value.deadline)}${deadlineLate.value ? ' · late' : ''}`,
        class: deadlineLate.value ? 'text-error' : undefined,
        icon: deadlineLate.value ? 'i-lucide-alarm-clock' : undefined
      }
    ]
  : [])

function isLate(p: { status: string, dueDate: string | null }) {
  return p.status === 'overdue' || (p.status !== 'paid' && !!p.dueDate && p.dueDate < today)
}

// Invoice goes out first, then the payment comes in
const isInvoiced = (p: Payment) => !!p.invoiceId || p.status === 'sent'

function paymentMenu(payment: Payment) {
  return [
    [
      payment.status !== 'paid' && isInvoiced(payment)
        ? { label: 'Invoice again', icon: 'i-lucide-file-text', onSelect: () => openInvoiceModal(payment) }
        : payment.status !== 'paid'
          ? { label: 'Mark paid', icon: 'i-lucide-circle-check', onSelect: () => markPaid(payment) }
          : { label: 'Generate invoice', icon: 'i-lucide-file-text', onSelect: () => openInvoiceModal(payment) },
      { label: 'Edit payment', icon: 'i-lucide-pencil', onSelect: () => openEditPayment(payment) },
      {
        label: 'Set status',
        icon: 'i-lucide-circle-dot',
        children: paymentStatusItems.map(s => ({
          label: s.label,
          type: 'checkbox' as const,
          checked: payment.status === s.value,
          onSelect: () => updatePaymentStatus(payment.id, s.value)
        }))
      }
    ],
    [{ label: 'Delete payment', icon: 'i-lucide-trash-2', color: 'error' as const, onSelect: () => deletePayment(payment) }]
  ]
}

const projectMenu = [
  [{ label: 'Invoice full project', icon: 'i-lucide-file-text', onSelect: () => openInvoiceModal() }],
  [{ label: 'Delete project', icon: 'i-lucide-trash-2', color: 'error' as const, onSelect: () => deleteProject() }]
]

async function updateStatus(status: string) {
  const ok = await run('status', () => $fetch(`/api/projects/${projectId}`, { method: 'PATCH', body: { status } }), {
    error: 'Could not change status'
  })
  if (ok) await refresh()
}

async function deleteProject() {
  const yes = await confirm({
    title: `Delete ${project.value?.title}?`,
    description: 'This also deletes its payments and invoices. It cannot be undone.',
    confirmLabel: 'Delete project'
  })
  if (!yes) return
  const ok = await run('delete', () => $fetch(`/api/projects/${projectId}`, { method: 'DELETE' }), {
    success: 'Project deleted',
    error: 'Could not delete project'
  })
  if (ok) router.push('/projects')
}

// --- Edit project ---
const editingProject = ref(false)
const projectForm = reactive({
  title: '',
  description: '',
  pricingType: 'fixed' as 'fixed' | 'hourly',
  amount: 0,
  startDate: '',
  deadline: ''
})

function openEditProject() {
  if (!project.value) return
  projectForm.title = project.value.title
  projectForm.description = project.value.description
  projectForm.pricingType = project.value.pricingType
  projectForm.amount = project.value.amount
  projectForm.startDate = project.value.startDate ?? ''
  projectForm.deadline = project.value.deadline ?? ''
  editingProject.value = true
}

async function saveProject() {
  const ok = await run('saveProject', () => $fetch(`/api/projects/${projectId}`, {
    method: 'PATCH',
    body: {
      ...projectForm,
      startDate: projectForm.startDate || null,
      deadline: projectForm.deadline || null
    }
  }), { success: 'Project updated', error: 'Could not update project' })
  if (!ok) return
  editingProject.value = false
  await refresh()
}

// --- Payments ---
const showPaymentModal = ref(false)
const paymentForm = reactive({
  label: '',
  amount: 0,
  status: 'pending' as 'pending' | 'sent' | 'paid' | 'overdue',
  dueDate: ''
})

function openAddPayment() {
  paymentForm.label = ''
  // Suggest whatever is left of a fixed price
  paymentForm.amount = unscheduled.value
  paymentForm.status = 'pending'
  paymentForm.dueDate = ''
  showPaymentModal.value = true
}

async function addPayment() {
  const ok = await run('addPayment', () => $fetch('/api/payments', {
    method: 'POST',
    body: {
      projectId: Number(projectId),
      label: paymentForm.label || 'Payment',
      amount: paymentForm.amount,
      status: paymentForm.status,
      dueDate: paymentForm.dueDate || null
    }
  }), { success: 'Payment added', error: 'Could not add payment' })
  if (!ok) return
  showPaymentModal.value = false
  await refresh()
}

async function updatePaymentStatus(paymentId: number, status: string) {
  const ok = await run(`pay${paymentId}`, () => $fetch(`/api/payments/${paymentId}`, {
    method: 'PATCH',
    body: { status, ...(status === 'paid' && { paidDate: todayISO() }) }
  }), { error: 'Could not change payment status' })
  if (ok) await refresh()
}

async function deletePayment(payment: Payment) {
  const yes = await confirm({
    title: `Delete ${payment.label}?`,
    description: payment.invoiceId ? 'Invoices already generated for it are kept.' : undefined,
    confirmLabel: 'Delete payment'
  })
  if (!yes) return
  const ok = await run(`pay${payment.id}`, () => $fetch(`/api/payments/${payment.id}`, { method: 'DELETE' }), {
    success: 'Payment deleted',
    error: 'Could not delete payment'
  })
  if (ok) await refresh()
}

// --- Edit payment ---
const editingPaymentId = ref<number | null>(null)
const editPaymentForm = reactive({
  label: '',
  amount: 0,
  dueDate: ''
})

function openEditPayment(payment: Payment) {
  editingPaymentId.value = payment.id
  editPaymentForm.label = payment.label
  editPaymentForm.amount = payment.amount
  editPaymentForm.dueDate = payment.dueDate ?? ''
}

async function saveEditPayment() {
  if (!editingPaymentId.value) return
  const ok = await run('editPayment', () => $fetch(`/api/payments/${editingPaymentId.value}`, {
    method: 'PATCH',
    body: {
      label: editPaymentForm.label || 'Payment',
      amount: editPaymentForm.amount,
      dueDate: editPaymentForm.dueDate || null
    }
  }), { success: 'Payment updated', error: 'Could not update payment' })
  if (!ok) return
  editingPaymentId.value = null
  await refresh()
}

// --- Invoice generation ---
const showInvoiceModal = ref(false)
const invoiceForm = reactive({
  paymentId: undefined as number | undefined,
  issueDate: todayISO(),
  dueDate: '',
  description: '',
  amount: 0
})

function openInvoiceModal(payment?: Payment) {
  invoiceForm.issueDate = todayISO()
  if (payment) {
    invoiceForm.paymentId = payment.id
    invoiceForm.description = `${project.value?.title} — ${payment.label}`
    invoiceForm.amount = payment.amount
    invoiceForm.dueDate = payment.dueDate ?? ''
  } else {
    invoiceForm.paymentId = undefined
    invoiceForm.description = project.value?.title ?? ''
    invoiceForm.amount = project.value?.amount ?? 0
    invoiceForm.dueDate = ''
  }
  showInvoiceModal.value = true
}

// Deep link from Today: /projects/:id?invoice=<paymentId>
onMounted(() => {
  const payment = project.value?.payments.find(p => p.id === Number(route.query.invoice))
  if (payment) openInvoiceModal(payment)
})

function downloadInvoice(id: number) {
  window.open(`/api/invoices/${id}/download`, '_blank')
}

async function generateInvoice() {
  let invoice: { id: number, invoiceNumber: string } | undefined
  const ok = await run('invoice', async () => {
    invoice = await $fetch('/api/invoices', {
      method: 'POST',
      body: {
        clientId: project.value?.clientId,
        projectId: Number(projectId),
        paymentId: invoiceForm.paymentId,
        issueDate: invoiceForm.issueDate,
        dueDate: invoiceForm.dueDate || null,
        lineItems: [{ description: invoiceForm.description, amount: invoiceForm.amount }]
      }
    })
  }, { error: 'Could not generate invoice' })
  if (!ok || !invoice) return
  const { id, invoiceNumber } = invoice
  showInvoiceModal.value = false
  if (route.query.invoice) router.replace({ query: {} })
  toast.add({
    title: `${invoiceNumber} generated`,
    color: 'success',
    actions: [
      { label: 'Download PDF', icon: 'i-lucide-download', color: 'neutral', variant: 'outline', onClick: () => downloadInvoice(id) },
      { label: 'All invoices', color: 'neutral', variant: 'ghost', to: '/invoices' }
    ]
  })
  await refresh()
}
</script>

<template>
  <div v-if="project">
    <PageHeader
      :title="project.title"
      :back="{ to: '/projects', label: 'Projects' }"
    >
      <template #description>
        <NuxtLink
          :to="`/clients/${project.client?.id}`"
          class="hover:text-highlighted hover:underline"
        >
          {{ project.client?.name }}
        </NuxtLink>
      </template>
      <template #actions>
        <USelect
          :model-value="project.status"
          :items="statusItems"
          value-key="value"
          :loading="busy === 'status'"
          class="w-36"
          aria-label="Project status"
          @update:model-value="updateStatus"
        />
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-pencil"
          @click="openEditProject"
        >
          Edit
        </UButton>
        <UDropdownMenu :items="projectMenu">
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-ellipsis"
            aria-label="More actions"
          />
        </UDropdownMenu>
      </template>
    </PageHeader>

    <StatStrip
      class="mb-10 grid-cols-2 sm:grid-cols-4"
      :items="stats"
    />

    <div class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] xl:gap-14">
      <!-- Payments -->
      <section class="min-w-0">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
          <SectionHeading
            title="Payments"
            :count="project.payments?.length ?? 0"
          />
          <UButton
            v-if="project.payments?.length"
            icon="i-lucide-plus"
            @click="openAddPayment"
          >
            Add payment
          </UButton>
        </div>

        <div
          v-if="targetTotal"
          class="mb-4"
        >
          <div
            class="h-2 overflow-hidden rounded-full bg-elevated"
            role="progressbar"
            :aria-valuenow="Math.round(paidPct)"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="Paid so far"
          >
            <div
              class="h-full rounded-full bg-success"
              :style="{ width: `${paidPct}%` }"
            />
          </div>
          <p class="mt-2 text-sm text-muted tabular-nums">
            {{ Math.round(paidPct) }}% paid of {{ money(targetTotal) }}{{ project.pricingType === 'hourly' ? ' billed' : '' }}
            <template v-if="unscheduled && project.payments?.length">
              · <button
                type="button"
                class="font-medium text-warning hover:underline"
                @click="openAddPayment"
              >
                {{ money(unscheduled) }} not scheduled yet
              </button>
            </template>
          </p>
        </div>

        <ul
          v-if="project.payments?.length"
          class="divide-y divide-default card overflow-hidden"
        >
          <li
            v-for="payment in project.payments"
            :key="payment.id"
            class="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 sm:flex-nowrap"
          >
            <span class="min-w-0 flex-1">
              <span
                class="block truncate font-semibold"
                :class="payment.status === 'paid' ? 'text-muted' : 'text-highlighted'"
              >{{ payment.label }}</span>
              <span class="block truncate text-sm text-muted">
                <template v-if="payment.paidDate">Paid {{ formatDate(payment.paidDate) }}</template>
                <template v-else-if="payment.dueDate">Due {{ formatDate(payment.dueDate) }}</template>
                <template v-else>No due date</template>
                <template v-if="payment.invoiceId"> · invoiced</template>
              </span>
            </span>
            <UBadge
              :color="isLate(payment) ? 'error' : paymentStatus[payment.status]?.color"
              variant="subtle"
            >
              {{ isLate(payment) ? 'Overdue' : paymentStatus[payment.status]?.label }}
            </UBadge>
            <span
              class="ms-auto font-semibold whitespace-nowrap tabular-nums sm:ms-0 sm:w-28 sm:text-right"
              :class="payment.status === 'paid' ? 'text-muted' : 'text-highlighted'"
            >{{ money(payment.amount) }}</span>
            <div class="flex w-full items-center justify-end gap-1 sm:w-auto">
              <UButton
                v-if="payment.status !== 'paid' && isInvoiced(payment)"
                variant="soft"
                :loading="busy === `pay${payment.id}`"
                class="flex-1 justify-center max-sm:h-11 sm:w-28 sm:flex-none"
                @click="markPaid(payment)"
              >
                Mark paid
              </UButton>
              <UButton
                v-else-if="payment.status !== 'paid'"
                color="neutral"
                variant="outline"
                icon="i-lucide-file-text"
                class="flex-1 justify-center max-sm:h-11 sm:w-28 sm:flex-none"
                @click="openInvoiceModal(payment)"
              >
                Invoice
              </UButton>
              <UDropdownMenu :items="paymentMenu(payment)">
                <UButton
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-ellipsis"
                  class="max-sm:size-11 justify-center"
                  :aria-label="`More actions for ${payment.label}`"
                />
              </UDropdownMenu>
            </div>
          </li>
        </ul>
        <EmptyState
          v-else
          title="No payments yet"
          description="Split the project into a deposit, milestones and a final payment, or add one lump sum."
        >
          <UButton
            icon="i-lucide-plus"
            @click="openAddPayment"
          >
            Add payment
          </UButton>
        </EmptyState>
      </section>

      <!-- Details -->
      <aside class="card space-y-6 self-start p-5 sm:p-6">
        <section>
          <h2 class="mb-3 text-[0.9375rem] font-bold text-highlighted">
            Details
          </h2>
          <dl class="space-y-2.5 text-sm">
            <div class="flex justify-between gap-4">
              <dt class="text-muted">
                Pricing
              </dt>
              <dd class="text-highlighted">
                {{ project.pricingType === 'fixed' ? 'Fixed price' : 'Hourly' }}
              </dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-muted">
                Start
              </dt>
              <dd class="text-highlighted">
                {{ formatDate(project.startDate) }}
              </dd>
            </div>
          </dl>
        </section>
        <section class="border-t border-default pt-6">
          <h2 class="mb-2 text-[0.9375rem] font-bold text-highlighted">
            Description
          </h2>
          <p
            class="text-sm whitespace-pre-wrap"
            :class="project.description ? 'text-default' : 'text-muted'"
          >
            {{ project.description || 'No description.' }}
          </p>
        </section>
      </aside>
    </div>

    <UModal
      v-model:open="showPaymentModal"
      title="Add payment"
    >
      <template #body>
        <form
          class="space-y-4"
          @submit.prevent="addPayment"
        >
          <UFormField
            label="Label"
            description="e.g. Deposit, Milestone 1, Final payment"
          >
            <UInput
              v-model="paymentForm.label"
              placeholder="Payment"
              class="w-full"
              autofocus
            />
          </UFormField>
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField
              label="Amount"
              required
            >
              <MoneyInput
                v-model="paymentForm.amount"
                required
                min="0.01"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Due date">
              <UInput
                v-model="paymentForm.dueDate"
                type="date"
                class="w-full"
              />
            </UFormField>
          </div>
          <UFormField label="Status">
            <USelect
              v-model="paymentForm.status"
              :items="paymentStatusItems"
              value-key="value"
              class="w-full"
            />
          </UFormField>
          <div class="flex justify-end gap-2 pt-2">
            <UButton
              color="neutral"
              variant="ghost"
              @click="showPaymentModal = false"
            >
              Cancel
            </UButton>
            <UButton
              type="submit"
              :loading="busy === 'addPayment'"
            >
              Add payment
            </UButton>
          </div>
        </form>
      </template>
    </UModal>

    <UModal
      v-model:open="showInvoiceModal"
      title="Generate invoice"
      description="Creates a numbered PDF you can download and send."
    >
      <template #body>
        <form
          class="space-y-4"
          @submit.prevent="generateInvoice"
        >
          <UFormField
            label="Line item description"
            required
          >
            <UInput
              v-model="invoiceForm.description"
              required
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Amount"
            required
          >
            <MoneyInput
              v-model="invoiceForm.amount"
              required
              min="0.01"
              class="w-full"
            />
          </UFormField>
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField
              label="Issue date"
              required
            >
              <UInput
                v-model="invoiceForm.issueDate"
                type="date"
                required
                class="w-full"
              />
            </UFormField>
            <UFormField label="Due date">
              <UInput
                v-model="invoiceForm.dueDate"
                type="date"
                class="w-full"
              />
            </UFormField>
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <UButton
              color="neutral"
              variant="ghost"
              @click="showInvoiceModal = false"
            >
              Cancel
            </UButton>
            <UButton
              type="submit"
              :loading="busy === 'invoice'"
            >
              Generate PDF
            </UButton>
          </div>
        </form>
      </template>
    </UModal>

    <UModal
      v-model:open="editingProject"
      title="Edit project"
    >
      <template #body>
        <form
          class="space-y-4"
          @submit.prevent="saveProject"
        >
          <UFormField
            label="Title"
            required
          >
            <UInput
              v-model="projectForm.title"
              required
              class="w-full"
            />
          </UFormField>
          <UFormField label="Description">
            <UTextarea
              v-model="projectForm.description"
              class="w-full"
            />
          </UFormField>
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Pricing">
              <USelect
                v-model="projectForm.pricingType"
                :items="[{ label: 'Fixed price', value: 'fixed' }, { label: 'Hourly rate', value: 'hourly' }]"
                value-key="value"
                class="w-full"
              />
            </UFormField>
            <UFormField :label="projectForm.pricingType === 'fixed' ? 'Total amount' : 'Hourly rate'">
              <MoneyInput
                v-model="projectForm.amount"
                :per-hour="projectForm.pricingType === 'hourly'"
                class="w-full"
              />
            </UFormField>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Start date">
              <UInput
                v-model="projectForm.startDate"
                type="date"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Deadline">
              <UInput
                v-model="projectForm.deadline"
                type="date"
                class="w-full"
              />
            </UFormField>
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <UButton
              color="neutral"
              variant="ghost"
              @click="editingProject = false"
            >
              Cancel
            </UButton>
            <UButton
              type="submit"
              :loading="busy === 'saveProject'"
            >
              Save
            </UButton>
          </div>
        </form>
      </template>
    </UModal>

    <UModal
      :open="editingPaymentId !== null"
      title="Edit payment"
      @update:open="(v) => { if (!v) editingPaymentId = null }"
    >
      <template #body>
        <form
          class="space-y-4"
          @submit.prevent="saveEditPayment"
        >
          <UFormField label="Label">
            <UInput
              v-model="editPaymentForm.label"
              placeholder="Payment"
              class="w-full"
            />
          </UFormField>
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField
              label="Amount"
              required
            >
              <MoneyInput
                v-model="editPaymentForm.amount"
                required
                min="0.01"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Due date">
              <UInput
                v-model="editPaymentForm.dueDate"
                type="date"
                class="w-full"
              />
            </UFormField>
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <UButton
              color="neutral"
              variant="ghost"
              @click="editingPaymentId = null"
            >
              Cancel
            </UButton>
            <UButton
              type="submit"
              :loading="busy === 'editPayment'"
            >
              Save
            </UButton>
          </div>
        </form>
      </template>
    </UModal>
  </div>
</template>
