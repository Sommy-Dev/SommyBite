<template>
  <div class="space-y-6 pb-20 md:pb-8">
    <header>
      <h1 class="text-3xl font-semibold tracking-tight text-text-primary md:text-4xl">Checkout</h1>
      <Stepper
        class="mt-4"
        :steps="['Contact', 'Delivery', 'Payment']"
        :current="step"
      />
    </header>

    <EmptyState
      v-if="!loading && lines.length === 0"
      title="Your Cart is empty"
      message="Add something tasty before checking out."
      icon="cart"
    >
      <template #action>
        <Button variant="primary" icon="grid" @click="$router.push('/shop')">Browse menu</Button>
      </template>
    </EmptyState>

    <template v-else>
      <div class="grid gap-8 lg:grid-cols-[1fr_380px]">
        <form class="space-y-6" novalidate @submit.prevent="pay">
          <!-- Step 0: Contact -->
          <section
            v-if="step === 0"
            aria-labelledby="contact-heading"
            class="rounded-lg border border-border-subtle bg-white p-4 shadow-sm md:p-6"
          >
            <h2 id="contact-heading" class="text-xl font-semibold tracking-tight text-text-primary">
              Contact details
            </h2>

            <!-- Inline auth: cart survives login, items are never lost -->
            <div v-if="!auth.user" class="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p class="flex items-start gap-2 text-sm text-amber-900">
                <Icon name="info" :size="18" class="mt-0.5 shrink-0" />
                Sign in to place your order. Your cart stays saved either way.
              </p>
              <div class="mt-3 grid gap-2">
                <Input
                  v-model="authEmail"
                  label="Email"
                  type="email"
                  autocomplete="email"
                  placeholder="you@example.com"
                  @update:model-value="authTouched.email = false"
                />
                <Input
                  v-model="authPassword"
                  label="Password"
                  type="password"
                  autocomplete="current-password"
                  placeholder="Your password"
                  show-password-toggle
                />
                <p v-if="authError" class="flex items-start gap-1.5 text-sm text-red-600" role="alert">
                  <Icon name="exclamation-circle" :size="16" />
                  {{ authError }}
                </p>
                <div class="flex flex-wrap items-center gap-3">
                  <Button variant="primary" :loading="authBusy" @click="signIn">Sign in</Button>
                  <Button variant="ghost" @click="$router.push({ path: '/auth', query: { next: '/checkout' } })">
                    Create an account
                  </Button>
                </div>
              </div>
            </div>

            <div v-else class="mt-4 space-y-4">
              <Input
                v-model="form.name"
                label="Full name"
                autocomplete="name"
                :error="errors.name"
                required
                @blur="validate('name')"
                @update:model-value="touched.name = true"
              />
              <div class="grid gap-4 sm:grid-cols-2">
                <Input
                  v-model="form.email"
                  label="Email"
                  type="email"
                  autocomplete="email"
                  :error="errors.email"
                  required
                  @blur="validate('email')"
                  @update:model-value="touched.email = true"
                />
                <Input
                  v-model="form.phone"
                  label="Phone"
                  type="tel"
                  inputmode="tel"
                  autocomplete="tel"
                  help="For delivery updates."
                  :error="errors.phone"
                  required
                  @blur="validate('phone')"
                  @update:model-value="touched.phone = true"
                />
              </div>
            </div>

            <div class="mt-6 flex justify-end">
              <Button
                variant="primary"
                icon="arrow-right"
                :disabled="!auth.user || !contactValid"
                @click="nextFromContact"
              >
                Continue to delivery
              </Button>
            </div>
            <p v-if="auth.user && !contactValid" class="mt-2 text-right text-sm text-text-secondary">
              {{ firstContactError }}
            </p>
          </section>

          <!-- Step 1: Delivery -->
          <section
            v-if="step === 1"
            aria-labelledby="delivery-heading"
            class="rounded-lg border border-border-subtle bg-white p-4 shadow-sm md:p-6"
          >
            <h2 id="delivery-heading" class="text-xl font-semibold tracking-tight text-text-primary">
              Delivery address
            </h2>
            <p class="mt-1 text-sm text-text-secondary">Where should we bring your order?</p>
            <div class="mt-4 space-y-4">
              <Input
                v-model="form.address"
                label="Street address"
                autocomplete="street-address"
                help="House number, street, estate."
                :error="errors.address"
                required
                @blur="validate('address')"
                @update:model-value="touched.address = true"
              />
              <div class="grid gap-4 sm:grid-cols-2">
                <Input
                  v-model="form.city"
                  label="City"
                  autocomplete="address-level2"
                  :error="errors.city"
                  required
                  @blur="validate('city')"
                  @update:model-value="touched.city = true"
                />
                <Select
                  v-model="form.state"
                  label="State"
                  :options="stateOptions"
                  placeholder="Select state"
                  :error="errors.state"
                  required
                  @blur="validate('state')"
                  @update:model-value="touched.state = true"
                />
              </div>
              <Textarea
                v-model="form.notes"
                label="Delivery notes (optional)"
                placeholder="Gate code, landmarks, allergies"
                help="Anything the rider should know."
              />
            </div>
            <div class="mt-6 flex justify-between">
              <Button variant="ghost" icon="arrow-left" @click="step = 0">Back to contact</Button>
              <Button variant="primary" icon="arrow-right" :disabled="!deliveryValid" @click="step = 2">
                Continue to payment
              </Button>
            </div>
            <p v-if="!deliveryValid" class="mt-2 text-right text-sm text-text-secondary">
              {{ firstDeliveryError }}
            </p>
          </section>

          <!-- Step 2: Payment -->
          <section
            v-if="step === 2"
            aria-labelledby="payment-heading"
            class="rounded-lg border border-border-subtle bg-white p-4 shadow-sm md:p-6"
          >
            <h2 id="payment-heading" class="text-xl font-semibold tracking-tight text-text-primary">
              Payment
            </h2>
            <p class="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
              <Icon name="lock" :size="16" class="text-emerald-600" />
              Secured by Paystack and Flutterwave. Card details never touch our servers.
            </p>

            <fieldset class="mt-4 grid gap-3 sm:grid-cols-2">
              <legend class="sr-only">Payment method</legend>
              <label
                v-for="method in paymentMethods"
                :key="method.id"
                class="relative flex cursor-pointer items-start gap-3 rounded-lg border-2 bg-white p-4 transition-colors duration-150"
                :class="form.paymentMethod === method.id ? 'border-orange-700 bg-orange-50' : 'border-border-default hover:border-border-strong'"
              >
                <input
                  v-model="form.paymentMethod"
                  type="radio"
                  name="payment-method"
                  :value="method.id"
                  class="mt-1 h-4 w-4 accent-orange-700"
                />
                <span>
                  <span class="flex items-center gap-2 text-base font-semibold text-text-primary">
                    <Icon name="wallet" :size="20" class="text-text-tertiary" />
                    {{ method.name }}
                  </span>
                  <span class="mt-0.5 block text-sm text-text-secondary">{{ method.note }}</span>
                </span>
              </label>
            </fieldset>

            <div
              v-if="payState === 'failed'"
              class="mt-4 rounded-lg border border-red-200 bg-red-50 p-4"
              role="alert"
            >
              <p class="flex items-start gap-2 text-sm font-medium text-red-800">
                <Icon name="exclamation-circle" :size="18" class="mt-0.5 shrink-0" />
                Payment failed. {{ payError }} Your cart is unchanged.
              </p>
            </div>

            <!-- Demo control: exercise the failed-payment state -->
            <label class="mt-4 flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed border-border-strong p-3">
              <span class="text-sm text-text-secondary">Demo: simulate a declined card</span>
              <Switch v-model="simulateFailure" label="Simulate a declined card payment" />
            </label>

            <div class="mt-6 flex justify-between">
              <Button
                variant="ghost"
                icon="arrow-left"
                :disabled="paying"
                @click="step = 1"
              >
                Back to delivery
              </Button>
              <Button
                variant="primary"
                size="lg"
                icon="lock"
                :loading="paying"
                :loading-label="payState === 'verifying' ? 'Verifying payment' : 'Processing payment'"
                :disabled="paying || !allValid"
                @click="pay"
              >
                Pay {{ naira(grandTotal) }}
              </Button>
            </div>
            <p v-if="!allValid" class="mt-2 text-right text-sm text-text-secondary" role="status">
              {{ firstOverallError }}
            </p>

            <div v-if="payState !== 'idle'" class="mt-4 space-y-2" aria-live="polite">
              <div class="flex items-center gap-2.5 text-sm" :class="payState === 'authorizing' ? 'text-text-secondary' : 'text-text-tertiary'">
                <Icon
                  v-if="payState === 'authorizing'"
                  name="refresh"
                  :size="16"
                  class="animate-spin"
                />
                <Icon v-else name="check" :size="16" class="text-emerald-600" />
                Redirecting to {{ methodName }}…
              </div>
              <div class="flex items-center gap-2.5 text-sm" :class="payState === 'verifying' ? 'text-text-secondary' : 'text-text-tertiary'">
                <Icon
                  v-if="payState === 'verifying'"
                  name="refresh"
                  :size="16"
                  class="animate-spin"
                />
                <Icon v-else name="check" :size="16" class="text-emerald-600" />
                Verifying payment with the bank…
              </div>
            </div>
          </section>
        </form>

        <!-- Sticky summary (collapsible on mobile) -->
        <aside aria-labelledby="checkout-summary-heading" class="lg:sticky lg:top-24 lg:self-start">
          <div class="rounded-lg border border-border-subtle bg-white shadow-sm">
            <button
              type="button"
              class="flex w-full items-center justify-between gap-2 p-4 text-left md:hidden"
              :aria-expanded="summaryOpen"
              aria-controls="checkout-summary"
              @click="summaryOpen = !summaryOpen"
            >
              <h2 id="checkout-summary-heading" class="text-base font-semibold text-text-primary">
                Order summary
              </h2>
              <span class="flex items-center gap-2">
                <span class="text-base font-semibold tabular-nums text-text-primary">{{ naira(totals.total) }}</span>
                <Icon :name="summaryOpen ? 'chevron-down' : 'chevron-right'" :size="18" class="text-text-tertiary" />
              </span>
            </button>
            <h2 id="checkout-summary-heading" class="hidden p-4 pb-0 text-base font-semibold text-text-primary md:block md:p-6 md:pb-0">
              Order summary
            </h2>
            <div
              id="checkout-summary"
              class="p-4 md:p-6"
              :class="[!summaryOpen && 'hidden md:block']"
            >
              <ul class="divide-y divide-border-subtle">
                <li v-for="line in lines" :key="line.productId" class="flex items-center gap-3 py-2.5">
                  <div class="aspect-square h-12 w-12 shrink-0 overflow-hidden rounded-md bg-surface-container-low">
                    <ProductImage
                      :emoji="line.product.emoji"
                      :hue="line.product.hue"
                      :src="line.product.image"
                      :alt="line.product.name"
                      class="h-full w-full"
                    />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium text-text-primary">{{ line.product.name }}</p>
                    <p class="text-xs tabular-nums text-text-secondary">{{ naira(line.product.price) }} × {{ line.qty }}</p>
                  </div>
                  <p class="text-sm font-semibold tabular-nums text-text-primary">{{ naira(line.lineTotal) }}</p>
                </li>
              </ul>
              <dl class="mt-4 space-y-2 border-t border-border-subtle pt-4 text-sm">
                <div class="flex justify-between">
                  <dt class="text-text-secondary">Subtotal</dt>
                  <dd class="tabular-nums text-text-primary">{{ naira(totals.subtotal) }}</dd>
                </div>

                <!-- Promo code -->
                <div class="flex items-start justify-between gap-2">
                  <dt class="text-text-secondary">Promo code</dt>
                  <dd class="text-right">
                    <div v-if="promo" class="flex items-center justify-end gap-2">
                      <span class="text-sm font-medium text-emerald-700">Promo applied: -{{ promo.percentOff }}%</span>
                      <button
                        type="button"
                        class="text-xs underline text-text-secondary hover:text-text-primary"
                        @click="removePromo"
                      >
                        Remove
                      </button>
                    </div>
                    <form v-else class="flex items-center gap-2" @submit.prevent="applyPromo">
                      <input
                        v-model="promoInput"
                        type="text"
                        inputmode="text"
                        placeholder="SOMMY20"
                        maxlength="20"
                        autocomplete="off"
                        class="w-28 rounded-md border border-border-subtle bg-white px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-orange-700 focus:ring-2 focus:ring-orange-700/20"
                      />
                      <Button size="sm" variant="secondary" :loading="promoBusy" type="submit">Apply</Button>
                    </form>
                    <p v-if="promoError" class="mt-1.5 text-sm text-red-600">Invalid or expired code</p>
                  </dd>
                </div>

                <div v-if="promo" class="flex justify-between">
                  <dt class="text-text-secondary">Discount</dt>
                  <dd class="tabular-nums text-red-600">-{{ naira(discount) }}</dd>
                </div>

                <div class="flex justify-between">
                  <dt class="text-text-secondary">Delivery</dt>
                  <dd class="tabular-nums text-text-primary">
                    {{ totals.deliveryFee === 0 ? 'Free' : naira(totals.deliveryFee) }}
                  </dd>
                </div>
                <div class="flex justify-between border-t border-border-subtle pt-2 text-base font-semibold">
                  <dt class="text-text-primary">Total</dt>
                  <dd class="tabular-nums text-text-primary">{{ naira(grandTotal) }}</dd>
                </div>
              </dl>
              <p class="mt-4 flex items-start gap-1.5 rounded-md bg-orange-50 px-3 py-2 text-xs leading-relaxed text-orange-800">
                <Icon name="lock" :size="14" class="mt-0.5 shrink-0" />
                We only mark your order as paid after the bank confirms it.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '../../components/Icon.vue'
import Button from '../../components/Button.vue'
import Input from '../../components/Input.vue'
import Select from '../../components/Select.vue'
import Textarea from '../../components/Textarea.vue'
import Switch from '../../components/Switch.vue'
import Stepper from '../../components/Stepper.vue'
import EmptyState from '../../components/EmptyState.vue'
import ProductImage from '../../components/ProductImage.vue'
import { naira } from '../../lib/format.js'
import * as api from '../../lib/api.js'
import { auth, login, saveDeliveryProfile } from '../../store/auth.js'
import { cartLines, cartTotals, clearCart } from '../../store/cart.js'
import { toast } from '../../store/toast.js'
import { PAYMENT_METHODS } from '../../data/catalog.js'

const router = useRouter()

const loading = ref(false)
const step = ref(0)
const summaryOpen = ref(false)

const form = ref({
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  notes: '',
  paymentMethod: 'paystack',
})

const errors = ref({})
const touched = ref({})

const authEmail = ref('')
const authPassword = ref('')
const authError = ref('')
const authBusy = ref(false)

const payState = ref('idle') // idle | authorizing | verifying | failed
const payError = ref('')
const paying = computed(() => payState.value === 'authorizing' || payState.value === 'verifying')
const simulateFailure = ref(false)

const lines = computed(() => cartLines.value.filter((l) => l.available))
const totals = computed(() => cartTotals.value)
const paymentMethods = PAYMENT_METHODS

const promo = ref(null) // { code, percentOff, discount } once applied
const promoInput = ref('')
const promoBusy = ref(false)
const promoError = ref('')

const discount = computed(() => promo.value?.discount || 0)
const grandTotal = computed(() => totals.value.subtotal - discount.value + totals.value.deliveryFee)
const methodName = computed(
  () => paymentMethods.find((m) => m.id === form.value.paymentMethod)?.name || 'the payment page'
)

const stateOptions = [
  'Lagos', 'Abuja FCT', 'Oyo', 'Ogun', 'Rivers', 'Delta', 'Anambra', 'Enugu', 'Kano', 'Kaduna',
].map((s) => ({ value: s, label: s }))

/* ---------- validation ---------- */

const rules = {
  name: (v) => (v.trim().length >= 2 ? '' : 'Enter your full name.'),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Enter a valid email address.'),
  phone: (v) => (v.replace(/\D/g, '').length >= 7 ? '' : 'Enter a valid phone number.'),
  address: (v) => (v.trim().length >= 5 ? '' : 'Enter your street address.'),
  city: (v) => (v.trim().length >= 2 ? '' : 'Enter your city.'),
  state: (v) => (v ? '' : 'Select your state.'),
}

function validate(field) {
  const msg = rules[field] ? rules[field](form.value[field]) : ''
  if (msg) errors.value[field] = msg
  else delete errors.value[field]
  return !msg
}

function validateAll(fields) {
  let first = ''
  fields.forEach((f) => {
    touched.value[f] = true
    const ok = validate(f)
    if (!ok && !first) first = errors.value[f]
  })
  return first
}

const contactValid = computed(() =>
  ['name', 'email', 'phone'].every((f) => !rules[f](form.value[f]))
)
const deliveryValid = computed(() =>
  ['address', 'city', 'state'].every((f) => !rules[f](form.value[f]))
)
const allValid = computed(() => contactValid.value && deliveryValid.value)

const firstContactError = computed(() => validateAllVisible(['name', 'email', 'phone']))
const firstDeliveryError = computed(() => validateAllVisible(['address', 'city', 'state']))
const firstOverallError = computed(() =>
  !contactValid.value
    ? validateAllVisible(['name', 'email', 'phone'])
    : !deliveryValid.value
      ? validateAllVisible(['address', 'city', 'state'])
      : ''
)

function validateAllVisible(fields) {
  for (const f of fields) {
    const msg = rules[f](form.value[f])
    if (msg) return msg
  }
  return ''
}

/* ---------- auth (cart survives login) ---------- */

async function signIn() {
  authError.value = ''
  if (!authEmail.value.trim()) {
    authError.value = 'Enter your email address.'
    return
  }
  if (!authPassword.value) {
    authError.value = 'Enter your password.'
    return
  }
  authBusy.value = true
  try {
    const user = await login(authEmail.value, authPassword.value)
    prefillFromProfile(user)
    toast({ title: 'Welcome back', message: `Signed in as ${user.name}.`, tone: 'success', duration: 2600 })
  } catch (e) {
    authError.value = e.message
  } finally {
    authBusy.value = false
  }
}

function prefillFromProfile(user) {
  const u = user || {}
  // Prefill saved details; empty fields are filled, never overwritten with blanks.
  if (!form.value.name && u.name) form.value.name = u.name
  if (!form.value.email && u.email) form.value.email = u.email
  if (!form.value.phone && u.phone) form.value.phone = u.phone
  const profile = api.getUserProfileSync?.(u.id)
  if (profile) {
    if (!form.value.address && profile.address) form.value.address = profile.address
    if (!form.value.city && profile.city) form.value.city = profile.city
    if (!form.value.state && profile.state) form.value.state = profile.state
  }
}

/* ---------- flow ---------- */

function nextFromContact() {
  const first = validateAll(['name', 'email', 'phone'])
  if (first) return
  step.value = 1
}

watch(step, (s) => {
  if (s === 2) {
    validateAll(['name', 'email', 'phone', 'address', 'city', 'state'])
  }
})

/* ---------- payment ---------- */

let doubleSubmitGuard = false

/* ---------- promo code ---------- */

async function applyPromo() {
  promoError.value = ''
  const code = promoInput.value.trim().toUpperCase()
  if (!code) {
    promoError.value = 'Enter a promo code.'
    return
  }
  promoBusy.value = true
  try {
    const res = await api.validatePromoCode(code, totals.value.subtotal)
    promo.value = { code: res.code, percentOff: res.percentOff, discount: res.discount }
    toast({
      title: 'Promo applied',
      message: `-${res.percentOff}% = -${naira(res.discount)} off your order`,
      tone: 'success',
      duration: 2600,
    })
  } catch (e) {
    promo.value = null
    promoError.value = 'Invalid or expired code'
  } finally {
    promoBusy.value = false
  }
}

function removePromo() {
  promo.value = null
  promoInput.value = ''
  promoError.value = ''
}

async function pay() {
  if (doubleSubmitGuard || paying.value) return // prevent double submission
  const first = validateAll(['name', 'email', 'phone', 'address', 'city', 'state'])
  if (first) {
    toast({ title: 'Check the form', message: first, tone: 'error' })
    return
  }
  doubleSubmitGuard = true
  payState.value = 'authorizing'
  payError.value = ''

  // Persist delivery details to the profile for next-time prefill.
  if (auth.user) {
    saveDeliveryProfile(auth.user.id, {
      phone: form.value.phone,
      address: form.value.address,
      city: form.value.city,
      state: form.value.state,
    }).catch(() => {})
  }

  let order
  try {
    order = await api.createOrder({
      customerId: auth.user?.id || null,
      customer: { name: form.value.name, email: form.value.email, phone: form.value.phone },
      delivery: {
        address: form.value.address,
        city: form.value.city,
        state: form.value.state,
        notes: form.value.notes,
      },
      items: lines.value.map((l) => ({
        productId: l.productId,
        name: l.product.name,
        price: l.product.price,
        qty: l.qty,
        emoji: l.product.emoji,
        hue: l.product.hue,
      })),
       subtotal: totals.value.subtotal,
       deliveryFee: totals.value.deliveryFee,
       total: totals.value.total,
       promoCode: promo.value?.code || null,
       paymentMethod: form.value.paymentMethod,
     })
  } catch (e) {
    // e.g. stock changed while checking out — actionable, items preserved
    payState.value = 'failed'
    payError.value = e.message
    doubleSubmitGuard = false
    toast({ title: 'Order not placed', message: e.message, tone: 'error' })
    return
  }

  try {
    const result = await api.processPayment(order.id, form.value.paymentMethod, {
      fail: simulateFailure.value,
    })
    if (result.status === 'paid') {
      clearCart()
      payState.value = 'idle'
      doubleSubmitGuard = false
      toast({ title: 'Order placed', message: `Payment confirmed for ${naira(order.total)}.`, tone: 'success' })
      router.push({ name: 'confirmation', params: { orderId: order.id } })
    } else {
      payState.value = 'failed'
      payError.value = result.reason
      doubleSubmitGuard = false
    }
  } catch (e) {
    payState.value = 'failed'
    payError.value = e.message
    doubleSubmitGuard = false
  }
}

onMounted(() => {
  if (cartLines.value.length === 0) {
    router.replace('/cart')
    return
  }
  prefillFromProfile(auth.user)
})
</script>
