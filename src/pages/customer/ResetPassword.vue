<template>
  <div class="mx-auto max-w-md space-y-6 py-8 md:py-16">
    <div class="text-center space-y-1">
      <h1 class="text-3xl font-semibold tracking-tight text-text-primary md:text-4xl">
        Reset password
      </h1>
      <p class="text-base text-text-secondary">
        Enter your new password below.
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
          v-model="form.password"
          label="New password"
          type="password"
          autocomplete="new-password"
          :error="errors.password"
          required
          @blur="touched.password = true; validate('password')"
          @update:model-value="touched.password = true"
        />
        <Input
          v-model="form.confirmPassword"
          label="Confirm password"
          type="password"
          autocomplete="new-password"
          :error="errors.confirmPassword"
          required
          @blur="touched.confirmPassword = true; validate('confirmPassword')"
          @update:model-value="touched.confirmPassword = true"
        />

        <p v-if="formError" class="flex items-start gap-1.5 rounded-md bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700" role="alert">
          <Icon name="exclamation-circle" :size="18" class="mt-0.5 shrink-0" />
          {{ formError }}
        </p>

        <p v-if="success" class="flex items-start gap-2 rounded-md bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800" role="status">
          <Icon name="check-circle" :size="18" class="mt-0.5 shrink-0" />
          Password reset successfully.
        </p>

        <Button
          v-if="!success"
          variant="primary"
          size="lg"
          type="submit"
          class="w-full"
          :loading="busy"
          loading-label="Resetting password"
        >
          Reset password
        </Button>
        <Button
          v-else
          variant="primary"
          size="lg"
          class="w-full"
          @click="router.push('/auth')"
        >
          Sign in
        </Button>
      </form>

      <p v-if="!success" class="mt-4 text-sm text-text-secondary text-center">
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

const form = reactive({ password: '', confirmPassword: '' })
const errors = reactive({})
const touched = reactive({})
const formError = ref('')
const busy = ref(false)
const success = ref(false)

function validate(field) {
  const v = form[field]
  if (field === 'password') {
    const msg = v.length >= 6 ? '' : 'Use at least 6 characters.'
    if (msg) errors.password = msg
    else delete errors.password
    return !msg
  }
  if (field === 'confirmPassword') {
    const msg = v && v === form.password ? '' : 'Passwords do not match.'
    if (msg) errors.confirmPassword = msg
    else delete errors.confirmPassword
    return !msg
  }
  return true
}

async function submit() {
  formError.value = ''
  success.value = false
  if (!supabaseConfigured) {
    formError.value =
      'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env, then restart the dev server.'
    return
  }
  touched.password = true
  touched.confirmPassword = true
  if (!validate('password') || !validate('confirmPassword')) return

  busy.value = true
  try {
    await supabase.auth.updateUser({ password: form.password })
    success.value = true
  } catch (e) {
    formError.value = e.message || 'Something went wrong. Try again in a moment.'
  } finally {
    busy.value = false
  }
}
</script>
