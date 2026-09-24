<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { clear } = useUserSession()
const router = useRouter()
const colorMode = useColorMode()
const { error: loadError, data: settings } = await useFetch('/api/settings')
if (loadError.value) throw createError({ statusCode: loadError.value.statusCode, statusMessage: loadError.value.statusMessage, fatal: true })

const invoiceItems = computed(() => [
  {
    to: '/settings/business',
    icon: 'i-lucide-building-2',
    title: 'Business',
    summary: settings.value?.businessName || 'Not set yet'
  },
  {
    to: '/settings/bank',
    icon: 'i-lucide-landmark',
    title: 'Bank details',
    summary: settings.value?.bankName
      ? `${settings.value.bankName}${settings.value.bankAccountNumber ? ` · ${settings.value.bankAccountNumber}` : ''}`
      : 'Not set yet'
  },
  {
    to: '/settings/invoicing',
    icon: 'i-lucide-file-text',
    title: 'Invoicing',
    summary: `Next invoice ${settings.value?.invoicePrefix || 'INV'}-${String(settings.value?.nextInvoiceNumber ?? 1).padStart(4, '0')}`
  }
])

const modes = [
  { value: 'light', label: 'Light', icon: 'i-lucide-sun' },
  { value: 'dark', label: 'Dark', icon: 'i-lucide-moon' },
  { value: 'system', label: 'System', icon: 'i-lucide-monitor' }
]

async function signOut() {
  await clear()
  await router.push('/login')
}
</script>

<template>
  <div class="max-w-2xl">
    <PageHeader
      title="Settings"
      description="Everything under Invoice details is printed on the invoices you generate."
    />

    <div class="space-y-8">
      <section>
        <SectionHeading
          title="Invoice details"
          class="mb-3 px-1"
        />
        <ul class="card overflow-hidden divide-y divide-default">
          <li
            v-for="item in invoiceItems"
            :key="item.to"
          >
            <NuxtLink
              :to="item.to"
              class="flex min-h-16 items-center gap-4 px-5 py-4 transition-colors hover:bg-elevated/50"
            >
              <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <UIcon
                  :name="item.icon"
                  class="size-5"
                />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block font-semibold text-highlighted">{{ item.title }}</span>
                <span class="block truncate text-sm text-muted">{{ item.summary }}</span>
              </span>
              <UIcon
                name="i-lucide-chevron-right"
                class="size-5 shrink-0 text-dimmed"
              />
            </NuxtLink>
          </li>
        </ul>
      </section>

      <section>
        <SectionHeading
          title="App"
          class="mb-3 px-1"
        />
        <ul class="card overflow-hidden divide-y divide-default">
          <li class="flex min-h-16 flex-wrap items-center gap-4 px-5 py-4">
            <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-elevated text-toned">
              <UIcon
                name="i-lucide-palette"
                class="size-5"
              />
            </span>
            <span
              id="appearance-label"
              class="flex-1 font-semibold text-highlighted"
            >Appearance</span>
            <div
              class="flex rounded-xl bg-elevated p-1"
              role="radiogroup"
              aria-labelledby="appearance-label"
            >
              <button
                v-for="m in modes"
                :key="m.value"
                type="button"
                role="radio"
                :aria-checked="colorMode.preference === m.value"
                class="flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors"
                :class="colorMode.preference === m.value ? 'bg-default text-highlighted shadow-sm' : 'text-muted hover:text-highlighted'"
                @click="colorMode.preference = m.value"
              >
                <UIcon
                  :name="m.icon"
                  class="size-4"
                />
                {{ m.label }}
              </button>
            </div>
          </li>
          <li>
            <NuxtLink
              to="/onboarding"
              class="flex min-h-16 items-center gap-4 px-5 py-4 transition-colors hover:bg-elevated/50"
            >
              <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-elevated text-toned">
                <UIcon
                  name="i-lucide-list-checks"
                  class="size-5"
                />
              </span>
              <span class="flex-1 font-semibold text-highlighted">Getting started</span>
              <UIcon
                name="i-lucide-chevron-right"
                class="size-5 shrink-0 text-dimmed"
              />
            </NuxtLink>
          </li>
        </ul>
      </section>

      <button
        type="button"
        class="card flex min-h-14 w-full items-center justify-center gap-2 px-5 font-semibold text-error transition-colors hover:bg-error/5"
        @click="signOut"
      >
        <UIcon
          name="i-lucide-log-out"
          class="size-5"
        />
        Sign out
      </button>
    </div>
  </div>
</template>
