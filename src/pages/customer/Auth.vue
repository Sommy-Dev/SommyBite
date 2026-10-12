<template>
  <div class="mx-auto max-w-md space-y-6 py-8 md:py-16">
    <div class="text-center space-y-1">
      <h1 class="text-3xl font-semibold tracking-tight text-text-primary md:text-4xl">
        {{ mode === 'login' ? 'Sign in' : 'Create account' }}
      </h1>
      <p class="text-base text-text-secondary">
        {{ mode === 'login' ? 'Welcome back. Your cart is saved.' : 'Start ordering in under a minute.' }}
      </p>
    </div>

    <!-- Toggle: one screen, two modes -->
    <div role="tablist" aria-label="Authentication" class="grid grid-cols-2 gap-1 rounded-lg bg-surface-container-low p-1">
      <button
        type="button"
        role="tab"
        :aria-selected="String(mode === 'login')"
        class="rounded-md px-4 py-2.5 text-sm font-semibold transition-colors duration-150"
        :class="mode === 'login' ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-secondary'"
        @click="switchMode('login')"
      >
        Sign in
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="String(mode === 'register')"
        class="rounded-md px-4 py-2.5 text-sm font-semibold transition-colors duration-150"
        :class="mode === 'register' ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-secondary'"
        @click="switchMode('register')"
      >
        Create account
      </button>
    </div>

    <div class="rounded-lg border border-border-subtle bg-white p-4 shadow-sm md:p-6">
      <form class="space-y-4" novalidate @submit.prevent="submit">
        <Input
          v-if="mode === 'register'"
          v-model="form.name"
          label="Full name"
          autocomplete="name"
          :error="errors.name"
          required
          @blur="touched.name = true; validate('name')"
          @update:model-value="touched.name = true"
        />
        <Input
          v-model="form.email"
          label="Email"
          type="email"
          autocomplete="email"
          :error="errors.email"
          required
          @blur="touched.email = true; validate('email')"
          @update:model-value="touched.email = true"
        />
        <Input
          v-model="form.password"
          :label="mode === 'register' ? 'Password' : 'Password'"
          type="password"
          :autocomplete="mode === 'register' ? 'new-password' : 'current-password'"
          :help="mode === 'register' ? 'At least 6 characters.' : ''"
          :error="errors.password"
          show-password-toggle
          required
          @blur="touched.password = true; validate('password')"
          @update:model-value="touched.password = true"
        />

        <p v-if="formError" class="flex items-start gap-1.5 rounded-md bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700" role="alert">
          <Icon name="exclamation-circle" :size="18" class="mt-0.5 shrink-0" />
          {{ formError }}
        </p>

        <Button variant="primary" size="lg" class="w-full" :loading="busy" :loading-label="mode === 'login' ? 'Signing in' : 'Creating account'">
          {{ mode === 'login' ? 'Sign in' : 'Create account' }}
        </Button>
      </form>

      <div class="mt-4 flex items-center justify-between text-sm">
        <button
          v-if="mode === 'login'"
          type="button"
          class="font-semibold text-orange-700 underline-offset-2 hover:underline"
          @click="resetOpen = true"
        >
          Reset your password
        </button>
        <span v-else class="text-text-tertiary" />
        <p class="text-text-secondary">
          {{ mode === 'login' ? 'New here?' : 'Have an account?' }}
          <button
            type="button"
            class="font-semibold text-orange-700 underline-offset-2 hover:underline"
            @click="switchMode(mode === 'login' ? 'register' : 'login')"
          >
            {{ mode === 'login' ? 'Create one' : 'Sign in' }}
          </button>
        </p>
      </div>
    </div>

    <!-- Demo credentials (demo build only) -->
    <div class="rounded-lg border border-dashed border-border-strong bg-white p-4">
      <p class="flex items-start gap-2 text-sm text-text-secondary">
        <Icon name="info" :size="18" class="mt-0.5 shrink-0" />
        Demo build — use these credentials:
      </p>
      <dl class="mt-2 space-y-1 text-sm tabular-nums text-text-secondary">
        <div class="flex justify-between gap-2">
          <dt class="text-text-secondary">Customer</dt>
          <dd>demo@sommybite.com / demo1234</dd>
        </div>
        <div class="flex justify-between gap-2">
          <dt class="text-text-secondary">Admin</dt>
          <dd>admin@sommybite.com / admin1234</dd>
        </div>
      </dl>
    </div>

    <!-- Password reset -->
    <Modal v-model="resetOpen" title="Reset your password">
      <p class="text-sm leading-relaxed text-text-secondary">
        Enter the email on your account and we will send a reset link.
      </p>
      <form class="mt-4 space-y-4" @submit.prevent="requestReset">
        <Input
          v-model="resetEmail"
          label="Email"
          type="email"
          autocomplete="email"
          placeholder="you@example.com"
          :error="resetError"
          required
        />
        <Button variant="primary" class="w-full" :loading="resetBusy" loading-label="Sending link">
          Send reset link
        </Button>
      </form>
      <div v-if="resetSent" class="mt-4 rounded-md bg-emerald-50 p-4">
        <p class="flex items-start gap-2 text-sm font-medium text-emerald-800">
          <Icon name="check-circle" :size="18" class="mt-0.5 shrink-0" />
          Reset link sent. Check your inbox for the next step.
        </p>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Icon from '../../components/Icon.vue'
import Button from '../../components/Button.vue'
import Input from '../../components/Input.vue'
import Modal from '../../components/Modal.vue'
import { login, register } from '../../store/auth.js'
import { toast } from '../../store/toast.js'
import * as api from '../../lib/api.js'

const route = useRoute()
const router = useRouter()

const mode = ref('login')
const form = reactive({ name: '', email: '', password: '' })
const errors = reactive({})
const touched = reactive({})
const formError = ref('')
const busy = ref(false)

const resetOpen = ref(false)
const resetEmail = ref('')
const resetError = ref('')
const resetBusy = ref(false)
const resetSent = ref(false)

const rules = {
  name: (v) => (mode.value === 'register' && v.trim().length < 2 ? 'Enter your full name.' : ''),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Enter a valid email address.'),
  password: (v) =>
    mode.value === 'register' && v.length < 6 ? 'Use at least 6 characters.' : v.length < 1 ? 'Enter your password.' : '',
}

function validate(field) {
  const msg = rules[field](form[field])
  if (msg) errors[field] = msg
  else delete errors[field]
  return !msg
}

function switchMode(next) {
  mode.value = next
  formError.value = ''
  Object.keys(errors).forEach((k) => delete errors[k])
  Object.keys(touched).forEach((k) => delete touched[k])
}

async function submit() {
  formError.value = ''
  const fields = mode.value === 'register' ? ['name', 'email', 'password'] : ['email', 'password']
  let first = ''
  fields.forEach((f) => {
    touched[f] = true
    const ok = validate(f)
    if (!ok && !first) first = errors[f]
  })
  if (first) return

  busy.value = true
  try {
    const user =
      mode.value === 'login'
        ? await login(form.email, form.password)
        : await register(form.name, form.email, form.password)
    toast({
      title: mode.value === 'login' ? 'Welcome back' : 'Account created',
      message: `Signed in as ${user.name}.`,
      tone: 'success',
      duration: 2600,
    })
    const next = route.query.next || '/'
    router.push(next === '/checkout' ? '/checkout' : next)
  } catch (e) {
    formError.value = e.message
  } finally {
    busy.value = false
  }
}

async function requestReset() {
  resetError.value = ''
  resetSent.value = false
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail.value.trim())) {
    resetError.value = 'Enter a valid email address.'
    return
  }
  resetBusy.value = true
  try {
    await api.requestPasswordReset(resetEmail.value)
    resetSent.value = true
  } catch {
    resetError.value = 'Something went wrong. Try again in a moment.'
  } finally {
    resetBusy.value = false
  }
}
</script>
