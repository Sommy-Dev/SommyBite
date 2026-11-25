<template>
  <div class="mx-auto max-w-md space-y-6 py-8 md:py-16">
    <div class="text-center space-y-1">
      <h1 class="text-3xl font-semibold tracking-tight text-text-primary md:text-4xl">
        Forgot password
      </h1>
      <p class="text-base text-text-secondary">
        Enter your email and we will send a reset link.
      </p>
    </div>

    <p
      v-if="!supabaseConfigured"
      class="flex items-start gap-1.5 rounded-md bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700"
      role="alert"
    >
      <Icon name="exclamation-circle" :size="18" class="mt-0.5 shrink-0" />
      Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env, then restart the dev server.
    </p>

    <div class="rounded-lg border border-border-subtle bg-white p-4 shadow-sm md:p-6">
      <form class="space-y-4" novalidate @submit.prevent="submit">
        <Input
          v-model="form.email"
          label="Email"
          type="email"
          autocomplete="email"
          placeholder="you@example.com"
          :error="errors.email"
          required
          @blur="touched.email = true; validate('email')"
          @update:model-value="touched.email = true"
        />

        <p v-if="formError" class="flex items-start gap-1.5 rounded-md bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700" role="alert">
          <Icon name="exclamation-circle" :size="18" class="mt-0.5 shrink-0" />
          {{ formError }}
        </p>

        <p v-if="sent" class="flex items-start gap-2 rounded-md bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800" role="status">
          <Icon name="check-circle" :size="18" class="mt-0.5 shrink-0" />
          If this email exists, a reset link has been sent. Check your inbox.
        </p>

        <Button
          variant="primary"
          size="lg"
          type="submit"
          class="w-full"
          :loading="busy"
          loading-label="Sending link"
        >
          Send reset link
        </Button>
      </form>

      <p class="mt-4 text-sm text-text-secondary text-center">
        Remember your password?
        <button
          type="button"
          class="font-semibold text-orange-700 underline-offset-2 hover:underline"
          @click="router.push('/auth')"
        >
          Sign in
        </button>
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import Input from '../../components/Input.vue'
import Button from '../../components/Button.vue'
import Icon from '../../components/Icon.vue'
import { supabase, supabaseConfigured } from '../../lib/supabase.js'

const router = useRouter()

const form = reactive({ email: '' })
const errors = reactive({})
const touched = reactive({})
const formError = ref('')
const busy = ref(false)
const sent = ref(false)

function validate(field) {
  if (field !== 'email') return true
  const msg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ? ''
    : 'Enter a valid email address.'
  if (msg) errors.email = msg
  else delete errors.email
  return !msg
}

async function submit() {
  formError.value = ''
  sent.value = false
  if (!supabaseConfigured) {
    formError.value =
      'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env, then restart the dev server.'
    return
  }
  touched.email = true
  if (!validate('email')) return

  busy.value = true
  try {
    await supabase.auth.resetPasswordForEmail(form.email.trim(), {
      redirectTo: window.location.origin + '/reset-password',
    })
    sent.value = true
  } catch (e) {
    formError.value = e.message || 'Something went wrong. Try again in a moment.'
  } finally {
    busy.value = false
  }
}
</script>
