<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
    <div class="w-full max-w-md space-y-6">
      <div class="text-center space-y-1">
        <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-900">
          <Icon name="shield" :size="28" class="text-white" />
        </div>
        <h1 class="mt-4 text-2xl font-semibold tracking-tight text-gray-900">Admin sign in</h1>
        <p class="text-sm text-gray-500">
          Staff only. Customer accounts cannot access this area.
        </p>
      </div>

      <div class="rounded-lg border border-gray-100 bg-white p-4 shadow-sm md:p-6">
        <form class="space-y-4" novalidate @submit.prevent="submit">
          <Input
            v-model="email"
            label="Work email"
            type="email"
            autocomplete="username"
            placeholder="admin@sommybite.com"
            :error="errors.email"
            required
            @blur="touched.email = true; validate('email')"
            @update:model-value="touched.email = true"
          />
          <Input
            v-model="password"
            label="Password"
            type="password"
            autocomplete="current-password"
            placeholder="Your password"
            show-password-toggle
            :error="errors.password"
            required
            @blur="touched.password = true; validate('password')"
            @update:model-value="touched.password = true"
          />

          <p v-if="formError" class="flex items-start gap-1.5 rounded-md bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700" role="alert">
            <Icon name="exclamation-circle" :size="18" class="mt-0.5 shrink-0" />
            {{ formError }}
          </p>

          <Button variant="primary" size="lg" class="w-full" :loading="busy" loading-label="Signing in">
            Sign in to dashboard
          </Button>
        </form>
      </div>

      <p class="flex items-center justify-center gap-1.5 text-center text-xs leading-relaxed text-gray-400">
        <Icon name="lock" :size="14" />
        This area is protected. Never share your admin password.
      </p>

      <div class="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm">
        <p class="font-medium text-gray-700">Demo credentials</p>
        <p class="mt-1 tabular-nums text-gray-500">admin@sommybite.com / admin1234</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Icon from '../../components/Icon.vue'
import Button from '../../components/Button.vue'
import Input from '../../components/Input.vue'
import { login } from '../../store/auth.js'
import { toast } from '../../store/toast.js'

const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const errors = reactive({})
const touched = reactive({})
const formError = ref('')
const busy = ref(false)

function validate(field) {
  const value = field === 'email' ? email.value : password.value
  let msg = ''
  if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    msg = 'Enter a valid email address.'
  }
  if (field === 'password' && !value) {
    msg = 'Enter your password.'
  }
  if (msg) errors[field] = msg
  else delete errors[field]
  return !msg
}

async function submit() {
  formError.value = ''
  let first = ''
  ;['email', 'password'].forEach((f) => {
    touched[f] = true
    const ok = validate(f)
    if (!ok && !first) first = errors[f]
  })
  if (first) return

  busy.value = true
  try {
    const user = await login(email.value, password.value)
    if (user.role !== 'admin') {
      // Signed in as a customer: send them to the storefront.
      formError.value = 'This account is a customer account. Use the storefront to sign in.'
      return
    }
    toast({ title: 'Welcome back, Admin', message: 'Signed in to the dashboard.', tone: 'success', duration: 2600 })
    router.push(route.query.next || '/admin')
  } catch (e) {
    formError.value = e.message
  } finally {
    busy.value = false
  }
}
</script>
