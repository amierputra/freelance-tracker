<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { data, error: loadError, refresh } = await useFetch('/api/dashboard')
if (loadError.value) throw createError({ statusCode: loadError.value.statusCode, statusMessage: loadError.value.statusMessage, fatal: true })
const action = useAction()
const { busy } = action
const markPaid = useMarkPaid(refresh, action)

const DAY = 86400000

function shortDate(d: string) {
  return new Date(d).toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short' })
}

function daysBetween(from: string, to: string) {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / DAY)
}

const todayLabel = computed(() => data.value
  ? new Date(data.value.today).toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long' })
  : '')

const overdue = computed(() => data.value?.overduePayments ?? [])
const ready = computed(() => data.value?.readyToInvoice ?? [])
const late = computed(() => data.value?.lateProjects ?? [])

// Payments and deadlines due in the next 7 days, merged by date
const thisWeek = computed(() => {
  if (!data.value) return []
  const payments = data.value.dueThisWeek.map(p => ({
    key: `p${p.id}`, kind: 'payment' as const, date: p.dueDate!, title: `${p.label} — ${p.projectTitle}`,
    sub: `${p.clientName}${p.status === 'sent' ? ' · invoice sent' : ''}`, amount: p.amount, to: `/projects/${p.projectId}`
  }))
  const deadlines = data.value.deadlinesThisWeek.map(p => ({
    key: `d${p.id}`, kind: 'deadline' as const, date: p.deadline!, title: `Deadline — ${p.title}`,
    sub: p.clientName ?? '', amount: null, to: `/projects/${p.id}`
  }))
  return [...payments, ...deadlines].sort((a, b) => a.date.localeCompare(b.date))
})

const total = computed(() => overdue.value.length + late.value.length + ready.value.length + thisWeek.value.length)

// Late projects already have their own section in the queue
const onTrack = computed(() => data.value?.activeProjects.filter(p => !late.value.some(l => l.id === p.id)) ?? [])

const nextDeadline = computed(() => data.value?.activeProjects.find(p => p.deadline && p.deadline >= data.value!.today))

const collected = computed(() => {
  if (!data.value) return []
  const base = new Date(data.value.today)
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(base.getFullYear(), base.getMonth() - 5 + i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return {
      key,
      label: d.toLocaleDateString('en-MY', { month: 'short' }),
      total: data.value!.collected.find(c => c.month === key)?.total ?? 0
    }
  })
  const max = Math.max(...months.map(m => m.total), 1)
  return months.map(m => ({ ...m, pct: (m.total / max) * 100 }))
})

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

const compact = (n: number) => n ? n.toLocaleString('en-MY', { notation: 'compact', maximumFractionDigits: 1 }) : '0'

const collectedLabel = computed(() => collected.value.map(m => `${m.label} ${money(m.total)}`).join(', '))

onMounted(() => refresh())
</script>

<template>
  <div
    v-if="data"
    class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] xl:gap-12"
  >
    <!-- Queue -->
    <div class="min-w-0">
      <header>
        <p class="text-sm text-muted">
          {{ todayLabel }}
        </p>
        <h1 class="mt-1 text-[1.75rem] leading-tight font-bold tracking-tight text-highlighted text-balance">
          {{ total ? `${total} ${total === 1 ? 'thing needs' : 'things need'} you` : 'Nothing needs you today' }}
        </h1>
        <p
          v-if="nextDeadline"
          class="mt-1.5 text-sm text-muted"
        >
          Next deadline {{ daysBetween(data.today, nextDeadline.deadline!) === 0 ? 'today' : `in ${plural(daysBetween(data.today, nextDeadline.deadline!), 'day')}` }}
        </p>
      </header>

      <!-- Owed -->
      <section
        class="card mt-6 p-5 sm:p-6"
        aria-label="Owed to you"
      >
        <p class="text-sm text-muted">
          Owed to you
        </p>
        <p class="mt-0.5 text-[2.25rem] leading-tight font-bold tracking-tight text-highlighted tabular-nums">
          {{ money(data.outstandingBalance) }}
        </p>
        <template v-if="data.outstandingBalance">
          <div
            class="mt-4 flex h-2 gap-0.5 overflow-hidden rounded-full bg-elevated"
            role="img"
            :aria-label="`${money(data.overdueTotal)} overdue of ${money(data.outstandingBalance)}`"
          >
            <span
              class="rounded-full bg-error"
              :style="{ flexGrow: data.overdueTotal }"
            />
            <span :style="{ flexGrow: data.outstandingBalance - data.overdueTotal }" />
          </div>
          <div class="mt-2.5 flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm tabular-nums">
            <span :class="data.overdueTotal ? 'text-error' : 'text-muted'">
              <span class="font-bold">{{ money(data.overdueTotal) }}</span> overdue
            </span>
            <span class="text-muted">{{ money(data.outstandingBalance - data.overdueTotal) }} not due yet</span>
          </div>
        </template>
        <p
          v-else
          class="mt-1 text-sm text-muted"
        >
          Nothing owed right now.
        </p>
      </section>

      <div class="mt-10 space-y-10">
        <!-- Overdue -->
        <section v-if="overdue.length">
          <SectionHeading
            title="Overdue"
            :count="overdue.length"
            tone="error"
            class="mb-3 px-1"
          />
          <ul class="space-y-3">
            <li
              v-for="p in overdue"
              :key="p.id"
              class="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
            >
              <NuxtLink
                :to="`/projects/${p.projectId}`"
                class="group min-w-0 flex-1"
              >
                <span class="flex items-start justify-between gap-4">
                  <span class="min-w-0">
                    <span class="block font-semibold text-highlighted group-hover:underline">{{ p.label }} — {{ p.projectTitle }}</span>
                    <span class="mt-0.5 block text-sm text-muted">
                      {{ p.clientName }}<template v-if="p.dueDate"> · <span class="font-semibold text-error">{{ plural(daysBetween(p.dueDate, data.today), 'day') }} late</span></template>
                    </span>
                  </span>
                  <span class="font-bold whitespace-nowrap text-highlighted tabular-nums">{{ money(p.amount) }}</span>
                </span>
              </NuxtLink>
              <UButton
                :loading="busy === `pay${p.id}`"
                size="lg"
                class="h-11 w-full justify-center rounded-xl sm:w-32"
                @click="markPaid(p)"
              >
                Mark paid
              </UButton>
            </li>
          </ul>
        </section>

        <!-- Late projects -->
        <section v-if="late.length">
          <SectionHeading
            title="Past deadline"
            :count="late.length"
            tone="error"
            class="mb-3 px-1"
          />
          <ul class="space-y-3">
            <li
              v-for="p in late"
              :key="p.id"
            >
              <NuxtLink
                :to="`/projects/${p.id}`"
                class="card flex items-center justify-between gap-4 p-5 transition-shadow hover:shadow-lg"
              >
                <span class="min-w-0">
                  <span class="block truncate font-semibold text-highlighted">{{ p.title }}</span>
                  <span class="mt-0.5 block truncate text-sm text-muted">{{ p.clientName }} · was due {{ shortDate(p.deadline!) }}</span>
                </span>
                <span class="text-sm font-semibold whitespace-nowrap text-error">{{ plural(daysBetween(p.deadline!, data.today), 'day') }} late</span>
              </NuxtLink>
            </li>
          </ul>
        </section>

        <!-- Ready to invoice -->
        <section v-if="ready.length">
          <SectionHeading
            title="Ready to invoice"
            :count="ready.length"
            class="mb-3 px-1"
          />
          <ul class="space-y-3">
            <li
              v-for="p in ready"
              :key="p.id"
              class="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
            >
              <NuxtLink
                :to="`/projects/${p.projectId}`"
                class="group min-w-0 flex-1"
              >
                <span class="flex items-start justify-between gap-4">
                  <span class="min-w-0">
                    <span class="block font-semibold text-highlighted group-hover:underline">{{ p.label }} — {{ p.projectTitle }}</span>
                    <span class="mt-0.5 block text-sm text-muted">{{ p.clientName }} · {{ p.dueDate ? `due ${shortDate(p.dueDate)}` : 'no due date' }}</span>
                  </span>
                  <span class="font-bold whitespace-nowrap text-highlighted tabular-nums">{{ money(p.amount) }}</span>
                </span>
              </NuxtLink>
              <UButton
                :to="`/projects/${p.projectId}?invoice=${p.id}`"
                color="neutral"
                variant="soft"
                size="lg"
                class="h-11 w-full justify-center rounded-xl sm:w-40"
              >
                Generate invoice
              </UButton>
            </li>
          </ul>
        </section>

        <!-- This week -->
        <section v-if="thisWeek.length">
          <SectionHeading
            title="Next 7 days"
            :count="thisWeek.length"
            class="mb-3 px-1"
          />
          <ul class="space-y-3">
            <li
              v-for="item in thisWeek"
              :key="item.key"
            >
              <NuxtLink
                :to="item.to"
                class="card flex items-center justify-between gap-4 p-5 transition-shadow hover:shadow-lg"
              >
                <span class="min-w-0">
                  <span class="block truncate font-semibold text-highlighted">{{ item.title }}</span>
                  <span class="mt-0.5 block truncate text-sm text-muted">{{ shortDate(item.date) }}<template v-if="item.sub"> · {{ item.sub }}</template></span>
                </span>
                <span
                  class="whitespace-nowrap tabular-nums"
                  :class="item.amount === null ? 'text-sm text-muted' : 'font-bold text-highlighted'"
                >
                  {{ item.amount === null ? (daysBetween(data.today, item.date) === 0 ? 'Today' : plural(daysBetween(data.today, item.date), 'day')) : money(item.amount) }}
                </span>
              </NuxtLink>
            </li>
          </ul>
        </section>

        <EmptyState
          v-if="!total"
          icon="i-lucide-circle-check"
          icon-class="text-primary"
          title="All clear"
          description="No overdue payments, nothing to invoice, and no deadlines this week."
        />

        <OnboardingChecklist />
      </div>
    </div>

    <!-- Summary -->
    <aside class="space-y-6 lg:pt-[5.25rem]">
      <section class="card p-5 sm:p-6">
        <SectionHeading title="Collected">
          <span class="ms-auto text-sm font-normal text-muted">Last 6 months</span>
        </SectionHeading>
        <div
          class="mt-5 flex h-32 items-end gap-2"
          role="img"
          :aria-label="`Collected per month: ${collectedLabel}`"
        >
          <div
            v-for="(m, i) in collected"
            :key="m.key"
            class="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
            aria-hidden="true"
          >
            <span class="text-[0.6875rem] font-medium text-muted tabular-nums">{{ compact(m.total) }}</span>
            <span
              class="w-full rounded-md"
              :class="i === collected.length - 1 ? 'bg-primary' : 'bg-elevated'"
              :style="{ height: `max(${m.pct * 0.75}%, 4px)` }"
            />
            <span class="text-xs text-muted">{{ m.label }}</span>
          </div>
        </div>
        <p class="mt-4 text-sm text-muted">
          This month <span class="float-end font-bold text-highlighted tabular-nums">{{ money(collected.at(-1)?.total ?? 0) }}</span>
        </p>
      </section>

      <section
        v-if="onTrack.length || !late.length"
        class="card p-5 sm:p-6"
      >
        <SectionHeading
          :title="late.length ? 'Other active projects' : 'Active projects'"
          :count="onTrack.length"
          class="mb-3"
        />
        <ul
          v-if="onTrack.length"
          class="-mx-2 text-sm"
        >
          <li
            v-for="p in onTrack"
            :key="p.id"
          >
            <NuxtLink
              :to="`/projects/${p.id}`"
              class="flex min-h-11 items-center justify-between gap-3 rounded-xl px-2 hover:bg-elevated/60"
            >
              <span class="truncate font-medium text-highlighted">{{ p.title }}</span>
              <span class="shrink-0 text-muted">{{ p.status === 'lead' ? 'Lead' : p.deadline ? `Due ${formatDate(p.deadline, false)}` : projectStatus[p.status]?.label }}</span>
            </NuxtLink>
          </li>
        </ul>
        <p
          v-else
          class="text-sm text-muted"
        >
          No active projects. <NuxtLink
            to="/projects/new"
            class="font-semibold text-primary hover:underline"
          >Start one</NuxtLink>
        </p>
      </section>
    </aside>
  </div>
</template>
