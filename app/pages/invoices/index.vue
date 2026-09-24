<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { error: loadError, data: invoices, refresh } = await useFetch('/api/invoices')
if (loadError.value) throw createError({ statusCode: loadError.value.statusCode, statusMessage: loadError.value.statusMessage, fatal: true })
const confirm = useConfirm()
const { busy, run } = useAction()

const search = ref('')
const showAllPaid = ref(false)
const today = todayISO()

const totals = computed(() => {
  const out = { draft: 0, sent: 0, paid: 0 } as Record<string, number>
  for (const i of invoices.value ?? []) out[i.status]! += i.total
  return out
})

const visible = computed(() => {
  const q = search.value.trim().toLowerCase()
  return (invoices.value ?? []).filter(i =>
    !q || [i.invoiceNumber, i.clientName, i.projectTitle].some(v => v?.toLowerCase().includes(q))
  )
})

const isOverdue = (i: { status: string, dueDate: string | null }) => i.status === 'sent' && !!i.dueDate && i.dueDate < today
const daysLate = (d: string) => Math.round((new Date(today).getTime() - new Date(d).getTime()) / 86400000)

// Awaiting payment: overdue first, then by nearest due date
const awaiting = computed(() => visible.value.filter(i => i.status === 'sent')
  .sort((a, b) => Number(isOverdue(b)) - Number(isOverdue(a)) || (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999')))
const drafts = computed(() => visible.value.filter(i => i.status === 'draft'))
const paid = computed(() => visible.value.filter(i => i.status === 'paid'))
const overdueCount = computed(() => awaiting.value.filter(isOverdue).length)
const sum = (list: { total: number }[]) => list.reduce((n, i) => n + i.total, 0)

const groups = computed(() => [
  { key: 'sent', title: 'Awaiting payment', items: awaiting.value, action: { label: 'Mark paid', status: 'paid', solid: true } },
  { key: 'draft', title: 'Drafts, not sent yet', items: drafts.value, action: { label: 'Mark sent', status: 'sent', solid: false } },
  { key: 'paid', title: 'Paid', items: showAllPaid.value || search.value ? paid.value : paid.value.slice(0, 1), action: null }
])

function invoiceMenu(invoice: { id: number, status: string }) {
  return [
    [{ label: 'Edit invoice', icon: 'i-lucide-pencil', onSelect: () => openEdit(invoice.id) }],
    [{
      label: 'Set status',
      icon: 'i-lucide-circle-dot',
      children: (['draft', 'sent', 'paid'] as const).map(s => ({
        label: invoiceStatus[s]!.label,
        type: 'checkbox' as const,
        checked: invoice.status === s,
        onSelect: () => updateStatus(invoice.id, s)
      }))
    }],
    [{ label: 'Delete invoice', icon: 'i-lucide-trash-2', color: 'error' as const, onSelect: () => deleteInvoice(invoice.id) }]
  ]
}

async function updateStatus(id: number, status: string) {
  const ok = await run(`status${id}`, () => $fetch(`/api/invoices/${id}`, { method: 'PATCH', body: { status } }), {
    error: 'Could not change invoice status'
  })
  if (ok) await refresh()
}

function downloadInvoice(id: number) {
  window.open(`/api/invoices/${id}/download`, '_blank')
}

async function deleteInvoice(id: number) {
  const number = invoices.value?.find(i => i.id === id)?.invoiceNumber
  const yes = await confirm({
    title: `Delete ${number ?? 'invoice'}?`,
    description: 'The PDF is removed too. The invoice number is not reused.',
    confirmLabel: 'Delete invoice'
  })
  if (!yes) return
  const ok = await run(`delete${id}`, () => $fetch(`/api/invoices/${id}`, { method: 'DELETE' }), {
    success: 'Invoice deleted',
    error: 'Could not delete invoice'
  })
  if (ok) await refresh()
}

// --- Edit invoice ---
const editingId = ref<number | null>(null)
const editForm = reactive({
  issueDate: '',
  dueDate: '',
  lineItems: [] as { description: string, amount: number }[]
})

const editTotal = computed(() => editForm.lineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0))

async function openEdit(id: number) {
  await run(`open${id}`, async () => {
    const invoice = await $fetch(`/api/invoices/${id}`)
    editForm.issueDate = invoice.issueDate
    editForm.dueDate = invoice.dueDate ?? ''
    editForm.lineItems = invoice.lineItems.map(item => ({ ...item }))
    editingId.value = id
  }, { error: 'Could not open invoice' })
}

function addLineItem() {
  editForm.lineItems.push({ description: '', amount: 0 })
}

function removeLineItem(index: number) {
  editForm.lineItems.splice(index, 1)
}

async function saveEdit() {
  if (!editingId.value) return
  const ok = await run('save', () => $fetch(`/api/invoices/${editingId.value}`, {
    method: 'PATCH',
    body: {
      issueDate: editForm.issueDate,
      dueDate: editForm.dueDate || null,
      lineItems: editForm.lineItems
    }
  }), { success: 'Invoice updated', error: 'Could not update invoice' })
  if (!ok) return
  editingId.value = null
  await refresh()
}
</script>

<template>
  <div>
    <PageHeader
      title="Invoices"
      description="Generated from a project's payments. Download the PDF and send it to your client."
    >
      <template
        v-if="invoices?.length"
        #actions
      >
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Search number, client, project"
          class="w-full sm:w-72"
        />
      </template>
    </PageHeader>

    <template v-if="invoices?.length">
      <StatStrip
        class="mb-10 grid-cols-2 sm:grid-cols-3"
        :items="[
          { label: 'Awaiting payment', value: money(totals.sent ?? 0), class: overdueCount ? 'text-error' : undefined },
          { label: 'Drafts, not sent', value: money(totals.draft ?? 0) },
          { label: 'Paid', value: money(totals.paid ?? 0), class: 'text-success' }
        ]"
      />

      <div
        v-if="visible.length"
        class="space-y-10"
      >
        <template
          v-for="group in groups"
          :key="group.key"
        >
          <section v-if="group.key === 'paid' ? paid.length : group.items.length">
            <SectionHeading
              :title="group.title"
              :count="group.key === 'sent' && overdueCount ? overdueCount : (group.key === 'paid' ? paid.length : group.items.length)"
              :tone="group.key === 'sent' && overdueCount ? 'error' : undefined"
              class="mb-3 px-1"
            >
              <span
                v-if="group.key === 'sent' && overdueCount"
                class="-ms-1 text-sm font-semibold text-error"
              >overdue</span>
              <span class="ms-auto text-sm font-semibold text-muted tabular-nums">{{ money(sum(group.key === 'paid' ? paid : group.items)) }}</span>
            </SectionHeading>

            <ul class="card divide-y divide-default overflow-hidden">
              <li
                v-for="invoice in group.items"
                :key="invoice.id"
                class="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-4"
              >
                <div class="flex min-w-0 flex-1 items-start justify-between gap-4 sm:items-center">
                  <span class="hidden w-20 shrink-0 text-sm font-bold text-highlighted sm:block">{{ invoice.invoiceNumber }}</span>
                  <span class="min-w-0 flex-1">
                    <span class="block truncate font-semibold text-highlighted">{{ invoice.clientName }}</span>
                    <span class="block truncate text-sm text-muted">
                      <span class="sm:hidden">{{ invoice.invoiceNumber }} · </span>{{ invoice.projectTitle }} ·
                      <span
                        v-if="isOverdue(invoice)"
                        class="font-semibold text-error"
                      >due {{ formatDate(invoice.dueDate, false) }}, {{ daysLate(invoice.dueDate!) }} {{ daysLate(invoice.dueDate!) === 1 ? 'day' : 'days' }} late</span>
                      <template v-else-if="invoice.status === 'sent'">{{ invoice.dueDate ? `due ${formatDate(invoice.dueDate, false)}` : 'no due date' }}</template>
                      <template v-else>issued {{ formatDate(invoice.issueDate, false) }}</template>
                    </span>
                  </span>
                  <span class="font-bold whitespace-nowrap text-highlighted tabular-nums">{{ money(invoice.total) }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <UButton
                    v-if="group.action"
                    :color="group.action.solid ? 'primary' : 'neutral'"
                    :variant="group.action.solid ? 'solid' : 'soft'"
                    :loading="busy === `status${invoice.id}`"
                    class="h-11 flex-1 justify-center rounded-xl sm:h-10 sm:w-28 sm:flex-none"
                    @click="updateStatus(invoice.id, group.action.status)"
                  >
                    {{ group.action.label }}
                  </UButton>
                  <UButton
                    color="neutral"
                    variant="soft"
                    icon="i-lucide-download"
                    class="size-11 justify-center rounded-xl sm:size-10"
                    :aria-label="`Download ${invoice.invoiceNumber} PDF`"
                    @click="downloadInvoice(invoice.id)"
                  />
                  <UDropdownMenu :items="invoiceMenu(invoice)">
                    <UButton
                      color="neutral"
                      variant="ghost"
                      icon="i-lucide-ellipsis"
                      class="size-11 justify-center rounded-xl sm:size-10"
                      :aria-label="`More actions for ${invoice.invoiceNumber}`"
                    />
                  </UDropdownMenu>
                </div>
              </li>
              <li v-if="group.key === 'paid' && paid.length > 1 && !search">
                <button
                  type="button"
                  class="flex min-h-12 w-full items-center justify-center gap-1 px-5 text-sm font-semibold text-primary hover:bg-elevated/50"
                  :aria-expanded="showAllPaid"
                  @click="showAllPaid = !showAllPaid"
                >
                  {{ showAllPaid ? 'Show less' : `Show all ${paid.length} paid invoices` }}
                  <UIcon
                    :name="showAllPaid ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                    class="size-4"
                  />
                </button>
              </li>
            </ul>
          </section>
        </template>
      </div>
      <EmptyState
        v-else
        title="No invoices match"
        description="Try a different search."
      />
    </template>

    <EmptyState
      v-else
      icon="i-lucide-file-text"
      title="No invoices yet"
      description="Open a project and choose Invoice on one of its payments."
    >
      <UButton
        to="/projects"
        color="neutral"
        variant="outline"
      >
        Go to projects
      </UButton>
    </EmptyState>

    <UModal
      :open="editingId !== null"
      title="Edit invoice"
      @update:open="(v) => { if (!v) editingId = null }"
    >
      <template #body>
        <form
          class="space-y-4"
          @submit.prevent="saveEdit"
        >
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField
              label="Issue date"
              required
            >
              <UInput
                v-model="editForm.issueDate"
                type="date"
                required
                class="w-full"
              />
            </UFormField>
            <UFormField label="Due date">
              <UInput
                v-model="editForm.dueDate"
                type="date"
                class="w-full"
              />
            </UFormField>
          </div>

          <fieldset class="space-y-3">
            <legend class="float-start py-0.5 text-sm font-medium text-highlighted">
              Line items
            </legend>
            <div class="mt-0! flex justify-end">
              <UButton
                color="neutral"
                variant="outline"
                icon="i-lucide-plus"
                @click="addLineItem"
              >
                Add line
              </UButton>
            </div>
            <div
              v-for="(item, index) in editForm.lineItems"
              :key="index"
              class="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[minmax(0,1fr)_9rem_auto]"
            >
              <UInput
                v-model="item.description"
                placeholder="What the client is paying for"
                :aria-label="`Line ${index + 1} description`"
                required
                class="col-span-2 sm:col-span-1"
              />
              <MoneyInput
                v-model="item.amount"
                :aria-label="`Line ${index + 1} amount`"
                class="w-full"
              />
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-trash-2"
                :aria-label="`Remove line ${index + 1}`"
                :disabled="editForm.lineItems.length <= 1"
                @click="removeLineItem(index)"
              />
            </div>
            <p class="flex justify-between border-t border-default pt-3 text-sm">
              <span class="text-muted">Total</span>
              <span class="font-semibold text-highlighted tabular-nums">{{ money(editTotal) }}</span>
            </p>
          </fieldset>

          <div class="flex justify-end gap-2 pt-2">
            <UButton
              color="neutral"
              variant="ghost"
              @click="editingId = null"
            >
              Cancel
            </UButton>
            <UButton
              type="submit"
              :loading="busy === 'save'"
            >
              Save
            </UButton>
          </div>
        </form>
      </template>
    </UModal>
  </div>
</template>
