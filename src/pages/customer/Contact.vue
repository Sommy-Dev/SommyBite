<template>
  <div class="space-y-8">
    <header>
      <h1 class="text-3xl font-semibold tracking-tight text-text-primary md:text-4xl">Contact us</h1>
      <p class="mt-1 text-base text-text-secondary">
        Questions, feedback or a problem with an order? We reply within minutes.
      </p>
    </header>

    <div class="grid gap-8 lg:grid-cols-[360px_1fr]">
      <!-- Business details -->
      <aside class="space-y-4">
        <section aria-labelledby="details-heading" class="rounded-lg border border-border-subtle bg-white p-4 shadow-sm md:p-6">
          <h2 id="details-heading" class="text-lg font-semibold tracking-tight text-text-primary">Business details</h2>
          <ul class="mt-4 space-y-3.5 text-sm text-text-secondary">
            <li class="flex items-start gap-3">
              <Icon name="phone" :size="20" class="mt-0.5 shrink-0 text-orange-700" />
              <span>
                <span class="block font-semibold text-text-primary">Phone</span>
                <a href="tel:+2348012345678" class="transition-colors duration-150 hover:text-orange-700">+234 801 234 5678</a>
              </span>
            </li>
            <li class="flex items-start gap-3">
              <Icon name="mail" :size="20" class="mt-0.5 shrink-0 text-orange-700" />
              <span>
                <span class="block font-semibold text-text-primary">Email</span>
                <a href="mailto:hello@sommybite.com" class="transition-colors duration-150 hover:text-orange-700">hello@sommybite.com</a>
              </span>
            </li>
            <li class="flex items-start gap-3">
              <Icon name="pin" :size="20" class="mt-0.5 shrink-0 text-orange-700" />
              <span>
                <span class="block font-semibold text-text-primary">Address</span>
                12 Kitchen Lane, Lekki, Lagos
              </span>
            </li>
            <li class="flex items-start gap-3">
              <Icon name="clock" :size="20" class="mt-0.5 shrink-0 text-orange-700" />
              <span>
                <span class="block font-semibold text-text-primary">Hours</span>
                Open daily, 10:00 AM – 10:00 PM
              </span>
            </li>
          </ul>
        </section>

        <!-- Map placeholder -->
        <div
          class="flex aspect-4/3 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong bg-surface-container-low"
          role="img"
          aria-label="Map placeholder — 12 Kitchen Lane, Lekki, Lagos"
        >
          <Icon name="pin" :size="40" class="text-text-tertiary" />
          <p class="text-sm font-medium text-text-secondary">Map placeholder</p>
          <p class="text-xs text-text-tertiary">12 Kitchen Lane, Lekki, Lagos</p>
        </div>
      </aside>

      <!-- Contact form -->
      <section aria-labelledby="form-heading" class="rounded-lg border border-border-subtle bg-white p-4 shadow-sm md:p-6">
        <h2 id="form-heading" class="text-lg font-semibold tracking-tight text-text-primary">Send us a message</h2>

        <div
          v-if="sent"
          class="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4"
          role="status"
        >
          <p class="flex items-start gap-2 text-sm font-medium text-emerald-800">
            <Icon name="check-circle" :size="18" class="mt-0.5 shrink-0" />
            Message sent. We will get back to you within one business day.
          </p>
          <Button variant="ghost" size="sm" class="mt-2" icon="refresh" @click="reset">Send another message</Button>
        </div>

        <form v-else class="mt-4 space-y-4" novalidate @submit.prevent="submit">
          <div class="grid gap-4 sm:grid-cols-2">
            <Input
              v-model="form.name"
              label="Your name"
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
          </div>
          <Input
            v-model="form.orderNo"
            label="Order number (optional)"
            placeholder="FD-01024"
            help="Include this if your message is about a specific order."
          />
          <Textarea
            v-model="form.message"
            label="Message"
            :error="errors.message"
            required
            maxlength="500"
            help="Up to 500 characters."
            @blur="touched.message = true; validate('message')"
            @update:model-value="touched.message = true"
          />
          <p v-if="formError" class="flex items-start gap-1.5 rounded-md bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700" role="alert">
            <Icon name="exclamation-circle" :size="18" class="mt-0.5 shrink-0" />
            {{ formError }}
          </p>
          <Button variant="primary" size="lg" icon="send" :loading="busy" loading-label="Sending message">
            Send message
          </Button>
        </form>
      </section>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import Icon from '../../components/Icon.vue'
import Button from '../../components/Button.vue'
import Input from '../../components/Input.vue'
import Textarea from '../../components/Textarea.vue'
import * as api from '../../lib/api.js'

const form = reactive({ name: '', email: '', orderNo: '', message: '' })
const errors = reactive({})
const touched = reactive({})
const busy = ref(false)
const sent = ref(false)
const formError = ref('')

const rules = {
  name: (v) => (v.trim().length >= 2 ? '' : 'Enter your name.'),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Enter a valid email address.'),
  message: (v) => (v.trim().length >= 10 ? '' : 'Tell us a little more (10+ characters).'),
}

function validate(field) {
  const msg = rules[field](form[field])
  if (msg) errors[field] = msg
  else delete errors[field]
  return !msg
}

async function submit() {
  formError.value = ''
  const fields = ['name', 'email', 'message']
  let first = ''
  fields.forEach((f) => {
    touched[f] = true
    const ok = validate(f)
    if (!ok && !first) first = errors[f]
  })
  if (first) return
  busy.value = true
  try {
    await api.submitContact({ ...form })
    sent.value = true
  } catch {
    formError.value = 'We could not send your message. Try again in a moment.'
  } finally {
    busy.value = false
  }
}

function reset() {
  sent.value = false
  form.name = ''
  form.email = ''
  form.orderNo = ''
  form.message = ''
}
</script>
