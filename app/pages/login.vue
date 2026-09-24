<script setup lang="ts">
definePageMeta({ layout: 'blank' })

const { fetch: refreshSession } = useUserSession()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const needsSetup = ref(false)

onMounted(async () => {
  const status = await $fetch('/api/auth/setup-status')
  needsSetup.value = status.needsSetup
  if (status.needsSetup) {
    await router.push('/setup')
  }
})

async function handleLogin() {
  loading.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: email.value, password: password.value }
    })
    await refreshSession()
    await router.push('/')
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Could not sign in. Check your email and password.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
    <div class="w-full max-w-sm">
      <AppLogo class="mb-8 justify-center" />
      <div class="card p-6 sm:p-8">
        <h1 class="text-xl font-semibold tracking-tight text-highlighted">
          Sign in
        </h1>
        <p class="mt-1 text-sm text-muted">
          Welcome back. Let's see who owes you.
        </p>

        <form
          class="mt-6 space-y-4"
          @submit.prevent="handleLogin"
        >
          <UFormField
            label="Email"
            required
          >
            <UInput
              v-model="email"
              type="email"
              autocomplete="email"
              placeholder="you@example.com"
              required
              class="w-full"
              autofocus
            />
          </UFormField>

          <UFormField
            label="Password"
            required
          >
            <PasswordInput
              v-model="password"
              autocomplete="current-password"
              required
              class="w-full"
            />
          </UFormField>

          <p
            v-if="error"
            class="text-sm text-error"
            role="alert"
          >
            {{ error }}
          </p>

          <UButton
            type="submit"
            block
            size="lg"
            :loading="loading"
          >
            Sign in
          </UButton>
        </form>
      </div>

      <p
        v-if="needsSetup"
        class="mt-6 text-center text-sm text-muted"
      >
        No account yet? <NuxtLink
          to="/setup"
          class="font-medium text-primary hover:underline"
        >Run setup</NuxtLink>
      </p>
    </div>
  </div>
</template>
