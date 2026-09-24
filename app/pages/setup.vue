<script setup lang="ts">
definePageMeta({ layout: 'blank' })

const { fetch: refreshSession } = useUserSession()
const router = useRouter()
const toast = useToast()

const step = ref(1)
const loading = ref(false)
const error = ref('')

const account = reactive({
  name: '',
  email: '',
  password: ''
})

const business = reactive({
  businessName: '',
  businessEmail: '',
  businessPhone: '',
  businessAddress: ''
})

onMounted(async () => {
  const { needsSetup } = await $fetch('/api/auth/setup-status')
  if (!needsSetup) {
    toast.add({ title: 'Setup already completed', color: 'warning' })
    await router.push('/login')
  }
})

async function createAccount() {
  loading.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/setup', { method: 'POST', body: account })
    await refreshSession()
    step.value = 2
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Setup failed'
  } finally {
    loading.value = false
  }
}

async function saveBusinessInfo() {
  loading.value = true
  try {
    await $fetch('/api/settings', { method: 'PATCH', body: business })
    step.value = 3
  } catch {
    toast.add({ title: 'Could not save business info', description: 'You can add it later in Settings.', color: 'warning' })
    step.value = 3
  } finally {
    loading.value = false
  }
}

function skipBusinessInfo() {
  step.value = 3
}

async function finish() {
  await router.push('/')
}
</script>

<template>
  <div class="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <AppLogo class="mb-8 justify-center" />

      <ol
        class="mb-4 grid grid-cols-3 gap-2"
        aria-label="Setup progress"
      >
        <li
          v-for="(label, i) in ['Account', 'Business', 'Done']"
          :key="label"
          :aria-current="step === i + 1 ? 'step' : undefined"
        >
          <span
            class="block h-1 rounded-full"
            :class="step > i ? 'bg-primary' : 'bg-accented'"
          />
          <span
            class="mt-1.5 block text-xs"
            :class="step === i + 1 ? 'font-semibold text-highlighted' : 'text-muted'"
          >{{ label }}</span>
        </li>
      </ol>

      <div class="card p-6 sm:p-8">
        <form
          v-if="step === 1"
          class="space-y-4"
          @submit.prevent="createAccount"
        >
          <div class="mb-6">
            <h1 class="text-xl font-semibold tracking-tight text-highlighted">
              Create your account
            </h1>
            <p class="mt-1 text-sm text-muted">
              This is a personal tool: one login, just for you.
            </p>
          </div>
          <UFormField
            label="Your name"
            required
          >
            <UInput
              v-model="account.name"
              autocomplete="name"
              required
              class="w-full"
              autofocus
            />
          </UFormField>
          <UFormField
            label="Email"
            required
          >
            <UInput
              v-model="account.email"
              type="email"
              autocomplete="email"
              placeholder="you@example.com"
              required
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Password"
            required
            description="At least 8 characters"
          >
            <PasswordInput
              v-model="account.password"
              autocomplete="new-password"
              required
              minlength="8"
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
            Create account
          </UButton>
        </form>

        <form
          v-else-if="step === 2"
          class="space-y-4"
          @submit.prevent="saveBusinessInfo"
        >
          <div class="mb-6">
            <h1 class="text-xl font-semibold tracking-tight text-highlighted">
              Your business
            </h1>
            <p class="mt-1 text-sm text-muted">
              Printed on your invoices. You can skip this and fill it in later from Settings.
            </p>
          </div>
          <UFormField label="Business name">
            <UInput
              v-model="business.businessName"
              class="w-full"
            />
          </UFormField>
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Business email">
              <UInput
                v-model="business.businessEmail"
                type="email"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Business phone">
              <UInput
                v-model="business.businessPhone"
                type="tel"
                class="w-full"
              />
            </UFormField>
          </div>
          <UFormField label="Business address">
            <UTextarea
              v-model="business.businessAddress"
              :rows="3"
              class="w-full"
            />
          </UFormField>
          <div class="flex gap-2 pt-2">
            <UButton
              color="neutral"
              variant="ghost"
              size="lg"
              :disabled="loading"
              @click="skipBusinessInfo"
            >
              Skip
            </UButton>
            <UButton
              type="submit"
              block
              size="lg"
              :loading="loading"
            >
              Save and continue
            </UButton>
          </div>
        </form>

        <div
          v-else
          class="text-center"
        >
          <UIcon
            name="i-lucide-circle-check"
            class="mx-auto size-10 text-primary"
          />
          <h1 class="mt-4 text-xl font-semibold tracking-tight text-highlighted">
            You're all set
          </h1>
          <p class="mt-1 text-sm text-muted">
            Next: add a client, create a project, and record its payments.
          </p>
          <UButton
            block
            size="lg"
            class="mt-6"
            @click="finish"
          >
            Go to Today
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
