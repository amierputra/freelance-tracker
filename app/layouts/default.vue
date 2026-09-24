<script setup lang="ts">
const { user, clear } = useUserSession()
const router = useRouter()

// Shares the cached /api/dashboard request with the Today page
const { data: dashboard } = useFetch('/api/dashboard', { lazy: true })
const overdueCount = computed(() => dashboard.value?.overduePayments.length ?? 0)

const links = [
  { label: 'Today', to: '/', icon: 'i-lucide-inbox' },
  { label: 'Clients', to: '/clients', icon: 'i-lucide-users' },
  { label: 'Projects', to: '/projects', icon: 'i-lucide-briefcase' },
  { label: 'Invoices', to: '/invoices', icon: 'i-lucide-file-text' },
  { label: 'Settings', to: '/settings', icon: 'i-lucide-settings' }
]

const userMenu = computed(() => [
  [{ label: user.value?.name, type: 'label' as const }],
  [{ label: 'Getting Started', icon: 'i-lucide-list-checks', to: '/onboarding' }],
  [{ label: 'Sign out', icon: 'i-lucide-log-out', onSelect: handleLogout }]
])

async function handleLogout() {
  await clear()
  await router.push('/login')
}

const initials = computed(() => initialsOf(user.value?.name))
</script>

<template>
  <UApp>
    <div class="min-h-dvh lg:grid lg:grid-cols-[13rem_1fr]">
      <!-- Desktop sidebar -->
      <aside class="hidden lg:flex flex-col sticky top-0 h-dvh border-r border-default bg-(--app-sidebar) px-4 py-6">
        <NuxtLink
          to="/"
          class="px-3 pb-8"
        >
          <AppLogo />
        </NuxtLink>

        <nav class="flex flex-col gap-0.5">
          <NuxtLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-toned transition-colors hover:bg-elevated/70 hover:text-highlighted"
            exact-active-class="bg-primary/10 text-primary! font-semibold"
            :active-class="link.to === '/' ? '' : 'bg-primary/10 text-primary! font-semibold'"
          >
            <UIcon
              :name="link.icon"
              class="size-4 shrink-0"
            />
            {{ link.label }}
            <span
              v-if="link.to === '/' && overdueCount"
              class="ms-auto rounded-full bg-error px-2 text-xs font-semibold text-inverted"
              :aria-label="`${overdueCount} overdue`"
            >{{ overdueCount }}</span>
          </NuxtLink>
        </nav>

        <div class="mt-auto flex items-center gap-1 pt-3">
          <UDropdownMenu
            :items="userMenu"
            :content="{ side: 'top', align: 'start' }"
          >
            <UButton
              color="neutral"
              variant="ghost"
              class="min-w-0 flex-1"
            >
              <span class="grid size-7 shrink-0 place-items-center rounded-full bg-accented text-xs font-bold text-highlighted">{{ initials }}</span>
              <span class="truncate">{{ user?.name }}</span>
            </UButton>
          </UDropdownMenu>
          <UColorModeButton />
        </div>
      </aside>

      <!-- Mobile top bar -->
      <header class="lg:hidden sticky top-0 z-20 flex h-14 items-center justify-between border-b border-default bg-(--app-sidebar)/95 px-5 backdrop-blur">
        <NuxtLink to="/">
          <AppLogo />
        </NuxtLink>
        <div class="flex items-center gap-1">
          <UColorModeButton />
          <UDropdownMenu :items="[...userMenu, [{ label: 'Settings', icon: 'i-lucide-settings', to: '/settings' }]]">
            <UButton
              color="neutral"
              variant="ghost"
              square
              :aria-label="user?.name"
            >
              <span class="grid size-7 place-items-center rounded-full bg-accented text-xs font-bold text-highlighted">{{ initials }}</span>
            </UButton>
          </UDropdownMenu>
        </div>
      </header>

      <main class="min-w-0 pb-24 lg:pb-0">
        <div class="mx-auto max-w-6xl px-5 py-7 sm:px-8 lg:py-12">
          <slot />
        </div>
      </main>

      <!-- Mobile tab bar -->
      <nav class="lg:hidden fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-default bg-(--app-sidebar)/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <NuxtLink
          v-for="link in links.slice(0, 4)"
          :key="link.to"
          :to="link.to"
          class="relative flex flex-col items-center gap-1 py-3 text-xs font-medium text-muted"
          exact-active-class="text-primary! font-semibold"
          :active-class="link.to === '/' ? '' : 'text-primary! font-semibold'"
        >
          <UIcon
            :name="link.icon"
            class="size-5"
          />
          {{ link.label }}
          <template v-if="link.to === '/' && overdueCount">
            <span
              class="absolute top-1.5 left-1/2 ms-2 size-2 rounded-full bg-error"
              aria-hidden="true"
            />
            <span class="sr-only">, {{ overdueCount }} overdue</span>
          </template>
        </NuxtLink>
      </nav>
    </div>
  </UApp>
</template>
