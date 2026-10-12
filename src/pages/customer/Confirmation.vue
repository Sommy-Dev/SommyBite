<template>
  <div class="mx-auto max-w-2xl space-y-6 py-6 text-center">
    <template v-if="loading">
      <Skeleton class="mx-auto h-24 w-24 rounded-full" />
      <Skeleton class="mx-auto h-9 w-64" />
      <Skeleton class="mx-auto h-5 w-80" />
      <Skeleton class="h-72 w-full rounded-lg" />
    </template>

    <ErrorState
      v-else-if="error && order"
      title="We could not load this order"
      :message="error"
      @retry="load"
    />

    <EmptyState
      v-else-if="error"
      title="Order not found"
      message="This confirmation link may be incomplete. Check your orders for the latest update."
      icon="receipt"
    >
      <template #action>
        <Button variant="secondary" icon="receipt" @click="$router.push('/orders')">View my orders</Button>
      </template>
    </EmptyState>

    <template v-else-if="order">
      <!-- Peak moment: success hero -->
      <div class="space-y-3">
        <span
          class="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 animate-fade-in"
        >
          <svg viewBox="0 0 52 52" class="h-12 w-12" aria-hidden="true">
            <circle cx="26" cy="26" r="24" fill="none" stroke="#059669" stroke-width="2.5" class="animate-fade-in" />
            <path
              fill="none" stroke="#059669" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"
              d="M14 27l8 8 16-17"
              class="animate-fade-in"
            />
          </svg>
        </span>
        <h1 class="text-4xl font-semibold tracking-tight text-text-primary md:text-5xl">
          Order placed
        </h1>
        <p class="mx-auto max-w-md text-base leading-relaxed text-text-secondary">
          Thank you, {{ firstName }}. Payment of {{ naira(order.total) }} was confirmed.
          Your food is being prepared.
        </p>
      </div>

      <!-- Order number: the takeaway detail -->
      <div
        class="rounded-lg border border-emerald-200 bg-emerald-50 p-6"
      >
        <p class="text-sm font-medium text-emerald-800">Order number</p>
        <div class="mt-1 flex items-center justify-center gap-2">
          <p class="text-3xl font-semibold tabular-nums tracking-tight text-text-primary">
            {{ orderNumber(order) }}
          </p>
          <button
            type="button"
            aria-label="Copy order number"
            class="flex h-11 w-11 items-center justify-center rounded-md text-emerald-700 transition-colors duration-150 hover:bg-emerald-100"
            @click="copyNumber"
          >
            <Icon name="copy" :size="20" />
          </button>
        </div>
        <p class="mt-1 text-sm text-emerald-800">
          Saved to <span class="font-medium">{{ order.customer.email }}</span> — we sent a receipt by email.
        </p>
      </div>

      <!-- What happens next -->
      <div class="rounded-lg border border-border-subtle bg-white p-4 text-left shadow-sm md:p-6">
        <h2 class="text-lg font-semibold tracking-tight text-text-primary">What happens next</h2>
        <ol class="mt-4 space-y-4">
          <li class="flex items-start gap-3">
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-700">
              <Icon name="fire" :size="18" />
            </span>
            <div>
              <p class="text-sm font-semibold text-text-primary">Preparing your order</p>
              <p class="text-sm text-text-secondary">Freshly cooked, sealed hot, and packed for the ride.</p>
            </div>
          </li>
          <li class="flex items-start gap-3">
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-700">
              <Icon name="truck" :size="18" />
            </span>
            <div>
              <p class="text-sm font-semibold text-text-primary">Out for delivery</p>
              <p class="text-sm text-text-secondary">
                Estimated arrival: <span class="font-medium text-text-primary">{{ eta }}</span>
              </p>
            </div>
          </li>
          <li class="flex items-start gap-3">
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <Icon name="check-circle" :size="18" />
            </span>
            <div>
              <p class="text-sm font-semibold text-text-primary">Enjoy</p>
              <p class="text-sm text-text-secondary">
                Track every step under <router-link to="/orders" class="font-medium text-orange-700 underline-offset-2 hover:underline">My orders</router-link>.
              </p>
            </div>
          </li>
        </ol>
      </div>

      <!-- Summary -->
      <div class="rounded-lg border border-border-subtle bg-white p-4 text-left shadow-sm md:p-6">
        <h2 class="text-lg font-semibold tracking-tight text-text-primary">Order summary</h2>
        <ul class="mt-4 divide-y divide-border-subtle">
          <li v-for="item in order.items" :key="item.productId" class="flex items-center gap-3 py-2.5">
            <div class="aspect-square h-12 w-12 shrink-0 overflow-hidden rounded-md bg-surface-container-low">
              <ProductImage
                :emoji="item.emoji"
                :hue="item.hue"
                :alt="item.name"
                class="h-full w-full"
              />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-text-primary">{{ item.name }}</p>
              <p class="text-xs tabular-nums text-text-secondary">{{ naira(item.price) }} × {{ item.qty }}</p>
            </div>
            <p class="text-sm font-semibold tabular-nums text-text-primary">{{ naira(item.price * item.qty) }}</p>
          </li>
        </ul>
        <dl class="mt-4 space-y-2 border-t border-border-subtle pt-4 text-sm">
          <div class="flex justify-between">
            <dt class="text-text-secondary">Subtotal</dt>
            <dd class="tabular-nums text-text-primary">{{ naira(order.subtotal) }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-text-secondary">Delivery</dt>
            <dd class="tabular-nums text-text-primary">
              {{ order.deliveryFee === 0 ? 'Free' : naira(order.deliveryFee) }}
            </dd>
          </div>
          <div class="flex justify-between border-t border-border-subtle pt-2 text-base font-semibold">
            <dt class="text-text-primary">Total paid</dt>
            <dd class="tabular-nums text-text-primary">{{ naira(order.total) }}</dd>
          </div>
        </dl>
        <div class="mt-4 flex flex-wrap items-center gap-2">
          <StatusBadge status="paid" />
          <StatusBadge :status="statusFor(order)" />
          <Badge tone="neutral" icon="wallet">
            Paid with {{ methodName }}
          </Badge>
        </div>
        <p class="mt-4 rounded-md bg-gray-50 px-3 py-2.5 text-sm leading-relaxed text-text-secondary">
          <Icon name="pin" :size="16" class="mr-1.5 inline text-text-tertiary" />
          Delivering to: {{ order.delivery.address }}, {{ order.delivery.city }}, {{ order.delivery.state }}
        </p>
      </div>

      <!-- Clear next steps -->
      <div class="flex flex-col gap-3 pb-4 sm:flex-row sm:justify-center">
        <Button variant="primary" size="lg" icon="receipt" @click="$router.push('/orders')">
          View my orders
        </Button>
        <Button variant="secondary" size="lg" icon="grid" @click="$router.push('/shop')">
          Keep shopping
        </Button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Icon from '../../components/Icon.vue'
import Badge from '../../components/Badge.vue'
import Button from '../../components/Button.vue'
import Skeleton from '../../components/Skeleton.vue'
import EmptyState from '../../components/EmptyState.vue'
import ErrorState from '../../components/ErrorState.vue'
import StatusBadge from '../../components/StatusBadge.vue'
import ProductImage from '../../components/ProductImage.vue'
import { naira, orderNumber, deliveryWindow } from '../../lib/format.js'
import * as api from '../../lib/api.js'
import { auth } from '../../store/auth.js'
import { toast } from '../../store/toast.js'
import { PAYMENT_METHODS } from '../../data/catalog.js'

const route = useRoute()

const order = ref(null)
const loading = ref(true)
const error = ref('')
const eta = deliveryWindow()

const firstName = computed(() => (order.value?.customer?.name || 'there').split(' ')[0])
const methodName = computed(
  () => PAYMENT_METHODS.find((m) => m.id === order.value?.paymentMethod)?.name || 'card'
)

function statusFor(o) {
  return o.status === 'paid' ? 'preparing' : o.status
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    order.value = await api.getOrder(route.params.orderId, auth.user?.id || null)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function copyNumber() {
  const text = orderNumber(order.value)
  navigator.clipboard?.writeText(text).then(
    () => toast({ title: 'Order number copied', tone: 'success', duration: 2200 }),
    () => {}
  )
}

watch(
  () => route.params.orderId,
  () => load()
)

onMounted(load)
</script>
