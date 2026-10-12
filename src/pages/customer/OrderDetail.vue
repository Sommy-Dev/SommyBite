<template>
  <div class="space-y-6">
    <div v-if="loading" class="space-y-4" aria-busy="true">
      <Skeleton class="h-16 rounded-lg" />
      <Skeleton class="h-72 rounded-lg" />
      <Skeleton class="h-48 rounded-lg" />
    </div>

    <ErrorState
      v-else-if="error"
      title="We could not load this order"
      :message="error"
      @retry="load"
    />

    <EmptyState
      v-else-if="!order"
      title="Order not found"
      message="This order may have been placed on another account."
      icon="receipt"
    >
      <template #action>
        <Button variant="secondary" icon="receipt" @click="$router.push('/orders')">Back to my orders</Button>
      </template>
    </EmptyState>

    <template v-else>
      <header class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <nav class="flex items-center gap-1.5 text-sm text-text-secondary" aria-label="Breadcrumb">
            <router-link to="/orders" class="transition-colors duration-150 hover:text-orange-700">My orders</router-link>
            <Icon name="chevron-right" :size="14" class="text-text-tertiary" />
            <span class="font-medium text-text-primary">{{ orderNumber(order) }}</span>
          </nav>
          <h1 class="mt-1 text-2xl font-semibold tracking-tight text-text-primary md:text-3xl">
            Order {{ orderNumber(order) }}
          </h1>
          <p class="mt-1 text-sm text-text-secondary">Placed {{ formatDateTime(order.createdAt) }}</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <StatusBadge :status="order.status" />
          <StatusBadge :status="paymentBadge" />
        </div>
      </header>

      <!-- Status timeline -->
      <section
        aria-labelledby="timeline-heading"
        class="rounded-lg border border-border-subtle bg-white p-4 shadow-sm md:p-6"
      >
        <h2 id="timeline-heading" class="text-lg font-semibold tracking-tight text-text-primary">
          Order progress
        </h2>
        <ol class="mt-5 space-y-0">
          <li
            v-for="(t, i) in timeline"
            :key="t.status"
            class="relative flex gap-4 pb-6 last:pb-0"
          >
            <span
              v-if="i < timeline.length - 1"
              class="absolute left-[17px] top-10 h-full w-0.5 bg-gray-200"
              aria-hidden="true"
            />
            <span
              :class="[
                'z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2',
                t.done
                  ? 'border-emerald-600 bg-emerald-600 text-white'
                  : t.current
                    ? 'border-orange-700 bg-white text-orange-700'
                    : 'border-border-default bg-white text-text-tertiary',
              ]"
            >
              <Icon
                :name="t.done ? 'check' : t.icon"
                :size="18"
              />
            </span>
            <div class="pt-1">
              <p :class="t.done || t.current ? 'text-sm font-semibold text-text-primary' : 'text-sm font-medium text-text-tertiary'">
                {{ t.label }}
              </p>
              <p class="text-sm text-text-secondary">
                <template v-if="t.at">{{ formatDateTime(t.at) }}</template>
                <template v-else-if="t.current">In progress</template>
                <template v-else>Waiting</template>
              </p>
            </div>
          </li>
        </ol>
      </section>

      <div class="grid gap-6 lg:grid-cols-[1fr_360px]">
        <!-- Items -->
        <section aria-labelledby="items-heading" class="rounded-lg border border-border-subtle bg-white p-4 shadow-sm md:p-6">
          <h2 id="items-heading" class="text-lg font-semibold tracking-tight text-text-primary">Items</h2>
          <ul class="mt-4 divide-y divide-border-subtle">
            <li v-for="item in order.items" :key="item.productId" class="flex items-center gap-3 py-3">
              <div class="aspect-square h-14 w-14 shrink-0 overflow-hidden rounded-md bg-surface-container-low">
                <ProductImage
                  :emoji="item.emoji"
                  :hue="item.hue"
                  :alt="item.name"
                  class="h-full w-full"
                />
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-text-primary">{{ item.name }}</p>
                <p class="text-sm tabular-nums text-text-secondary">{{ naira(item.price) }} × {{ item.qty }}</p>
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
              <dd class="tabular-nums text-text-primary">{{ order.deliveryFee === 0 ? 'Free' : naira(order.deliveryFee) }}</dd>
            </div>
            <div class="flex justify-between border-t border-border-subtle pt-2 text-base font-semibold">
              <dt class="text-text-primary">Total</dt>
              <dd class="tabular-nums text-text-primary">{{ naira(order.total) }}</dd>
            </div>
          </dl>
        </section>

        <!-- Delivery + support -->
        <aside class="space-y-6">
          <section aria-labelledby="delivery-heading" class="rounded-lg border border-border-subtle bg-white p-4 shadow-sm md:p-6">
            <h2 id="delivery-heading" class="text-lg font-semibold tracking-tight text-text-primary">Delivery</h2>
            <address class="mt-3 space-y-2 not-italic text-sm text-text-secondary">
              <p class="flex items-start gap-2.5">
                <Icon name="user" :size="18" class="mt-0.5 shrink-0 text-text-tertiary" />
                {{ order.customer.name }}
              </p>
              <p class="flex items-start gap-2.5">
                <Icon name="phone" :size="18" class="mt-0.5 shrink-0 text-text-tertiary" />
                {{ order.customer.phone }}
              </p>
              <p class="flex items-start gap-2.5">
                <Icon name="pin" :size="18" class="mt-0.5 shrink-0 text-text-tertiary" />
                {{ order.delivery.address }}, {{ order.delivery.city }}, {{ order.delivery.state }}
              </p>
              <p v-if="order.delivery.notes" class="flex items-start gap-2.5">
                <Icon name="info" :size="18" class="mt-0.5 shrink-0 text-text-tertiary" />
                {{ order.delivery.notes }}
              </p>
            </address>
            <p class="mt-3 rounded-md bg-orange-50 px-3 py-2 text-sm text-orange-800">
              Paid with {{ methodName }}.
            </p>
          </section>

          <section aria-labelledby="help-heading" class="rounded-lg border border-border-subtle bg-white p-4 shadow-sm md:p-6">
            <h2 id="help-heading" class="text-lg font-semibold tracking-tight text-text-primary">Need help?</h2>
            <p class="mt-2 text-sm leading-relaxed text-text-secondary">
              Questions about this order? Our support team replies within minutes.
            </p>
            <div class="mt-3 space-y-2">
              <a
                href="tel:+2348012345678"
                class="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-semibold text-orange-700 transition-colors duration-150 hover:bg-orange-50"
              >
                <Icon name="phone" :size="18" /> Call +234 801 234 5678
              </a>
              <a
                href="mailto:hello@sommybite.com"
                class="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-semibold text-orange-700 transition-colors duration-150 hover:bg-orange-50"
              >
                <Icon name="mail" :size="18" /> Email hello@sommybite.com
              </a>
            </div>
          </section>
        </aside>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Icon from '../../components/Icon.vue'
import Button from '../../components/Button.vue'
import Skeleton from '../../components/Skeleton.vue'
import EmptyState from '../../components/EmptyState.vue'
import ErrorState from '../../components/ErrorState.vue'
import StatusBadge from '../../components/StatusBadge.vue'
import ProductImage from '../../components/ProductImage.vue'
import { naira, orderNumber, formatDateTime } from '../../lib/format.js'
import * as api from '../../lib/api.js'
import { auth } from '../../store/auth.js'
import { PAYMENT_METHODS } from '../../data/catalog.js'

const route = useRoute()

const order = ref(null)
const loading = ref(true)
const error = ref('')

const paymentBadge = computed(() => {
  const s = order.value?.paymentStatus
  if (s === 'paid') return 'paid'
  if (s === 'failed') return 'failed'
  if (s === 'refunded') return 'refunded'
  return 'pending'
})

const methodName = computed(
  () => PAYMENT_METHODS.find((m) => m.id === order.value?.paymentMethod)?.name || 'card'
)

const STEPS = [
  { status: 'pending', label: 'Order placed', icon: 'receipt' },
  { status: 'paid', label: 'Payment confirmed', icon: 'wallet' },
  { status: 'preparing', label: 'Preparing', icon: 'fire' },
  { status: 'out_for_delivery', label: 'Out for delivery', icon: 'truck' },
  { status: 'delivered', label: 'Delivered', icon: 'check-circle' },
]

const timeline = computed(() => {
  if (!order.value) return []
  if (order.value.status === 'cancelled') {
    return [
      { status: 'cancelled', label: 'Order cancelled', icon: 'x', done: true, at: lastAt('cancelled') },
      ...STEPS.slice(0, 1).map((s) => ({ ...s, done: true, at: lastAt(s.status) })),
    ]
  }
  const reached = order.value.timeline.map((t) => t.status)
  let currentMarked = false
  return STEPS.map((s) => {
    const done = reached.includes(s.status) && s.status !== order.value.status
    const isCurrent = s.status === order.value.status
    if (isCurrent && !currentMarked) currentMarked = true
    return {
      ...s,
      done: done || (isCurrent && order.value.status === 'delivered'),
      current: isCurrent && order.value.status !== 'delivered',
      at: lastAt(s.status),
    }
  })
})

function lastAt(status) {
  const events = order.value.timeline.filter((t) => t.status === status)
  return events.length ? events[events.length - 1].at : null
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    order.value = await api.getOrder(route.params.id, auth.user?.id || null)
  } catch (e) {
    error.value = e.message
    if (e.code === 'not_found' && !order.value) order.value = null
  } finally {
    loading.value = false
  }
}

watch(
  () => route.params.id,
  () => load()
)

onMounted(load)
</script>
