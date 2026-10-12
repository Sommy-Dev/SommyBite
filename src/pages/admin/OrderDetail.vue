<template>
  <div class="space-y-6">
    <div v-if="loading" class="space-y-4" aria-busy="true">
      <Skeleton class="h-16 rounded-lg" />
      <Skeleton class="h-64 rounded-lg" />
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
      message="It may have been removed or the link is incomplete."
      icon="receipt"
    >
      <template #action>
        <Button variant="secondary" icon="receipt" @click="$router.push('/admin/orders')">Back to orders</Button>
      </template>
    </EmptyState>

    <template v-else>
      <header class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <nav class="flex items-center gap-1.5 text-sm text-gray-500" aria-label="Breadcrumb">
            <router-link to="/admin/orders" class="transition-colors duration-150 hover:text-orange-700">Orders</router-link>
            <Icon name="chevron-right" :size="14" class="text-gray-400" />
            <span class="font-medium text-gray-900">{{ orderNumber(order) }}</span>
          </nav>
          <h1 class="mt-1 text-2xl font-semibold tracking-tight text-gray-900 md:text-3xl">
            Order {{ orderNumber(order) }}
          </h1>
          <p class="mt-1 text-sm text-gray-500">Placed {{ formatDateTime(order.createdAt) }}</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <StatusBadge :status="order.status" />
          <StatusBadge :status="paymentBadge" />
        </div>
      </header>

      <div class="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div class="space-y-6">
          <!-- Customer -->
          <section aria-labelledby="customer-heading" class="rounded-lg border border-gray-100 bg-white p-4 shadow-sm md:p-6">
            <h2 id="customer-heading" class="text-lg font-semibold tracking-tight text-gray-900">Customer</h2>
            <dl class="mt-3 space-y-2.5 text-sm">
              <div class="flex items-center gap-2.5">
                <Icon name="user" :size="18" class="shrink-0 text-gray-400" />
                <dt class="w-24 text-gray-500">Name</dt>
                <dd class="font-medium text-gray-900">{{ order.customer.name }}</dd>
              </div>
              <div class="flex items-center gap-2.5">
                <Icon name="phone" :size="18" class="shrink-0 text-gray-400" />
                <dt class="w-24 text-gray-500">Phone</dt>
                <dd class="font-medium tabular-nums text-gray-900">{{ order.customer.phone || 'Not provided' }}</dd>
              </div>
              <div class="flex items-center gap-2.5">
                <Icon name="mail" :size="18" class="shrink-0 text-gray-400" />
                <dt class="w-24 text-gray-500">Email</dt>
                <dd class="font-medium text-gray-900">{{ order.customer.email }}</dd>
              </div>
            </dl>
            <div class="mt-4 rounded-lg bg-gray-50 p-4">
              <p class="flex items-start gap-2 text-sm">
                <Icon name="pin" :size="18" class="mt-0.5 shrink-0 text-gray-400" />
                <span>
                  <span class="font-semibold text-gray-900">Delivery address</span>
                  <span class="block mt-0.5 text-gray-600">
                    {{ order.delivery.address }}, {{ order.delivery.city }}, {{ order.delivery.state }}
                  </span>
                  <span v-if="order.delivery.notes" class="mt-1 block text-gray-500">
                    Note: {{ order.delivery.notes }}
                  </span>
                </span>
              </p>
            </div>
          </section>

          <!-- Items -->
          <section aria-labelledby="items-heading" class="rounded-lg border border-gray-100 bg-white p-4 shadow-sm md:p-6">
            <h2 id="items-heading" class="text-lg font-semibold tracking-tight text-gray-900">Items</h2>
            <ul class="mt-4 divide-y divide-gray-100">
              <li v-for="item in order.items" :key="item.productId" class="flex items-center gap-3 py-3">
                <div class="aspect-square h-14 w-14 shrink-0 overflow-hidden rounded-md bg-gray-100">
                  <ProductImage :emoji="item.emoji" :hue="item.hue" :alt="item.name" class="h-full w-full" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-semibold text-gray-900">{{ item.name }}</p>
                  <p class="text-sm tabular-nums text-gray-500">{{ naira(item.price) }} × {{ item.qty }}</p>
                </div>
                <p class="text-sm font-semibold tabular-nums text-gray-900">{{ naira(item.price * item.qty) }}</p>
              </li>
            </ul>
            <dl class="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm">
              <div class="flex justify-between">
                <dt class="text-gray-500">Subtotal</dt>
                <dd class="tabular-nums text-gray-900">{{ naira(order.subtotal) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-500">Delivery</dt>
                <dd class="tabular-nums text-gray-900">{{ order.deliveryFee === 0 ? 'Free' : naira(order.deliveryFee) }}</dd>
              </div>
              <div class="flex justify-between border-t border-gray-100 pt-2 text-base font-semibold">
                <dt class="text-gray-900">Total</dt>
                <dd class="tabular-nums text-gray-900">{{ naira(order.total) }}</dd>
              </div>
            </dl>
          </section>

          <!-- Timeline -->
          <section aria-labelledby="timeline-heading" class="rounded-lg border border-gray-100 bg-white p-4 shadow-sm md:p-6">
            <h2 id="timeline-heading" class="text-lg font-semibold tracking-tight text-gray-900">Timeline</h2>
            <ol class="mt-4 space-y-3">
              <li v-for="(t, i) in order.timeline" :key="i" class="flex items-center gap-3">
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                  <Icon name="check" :size="16" />
                </span>
                <p class="text-sm font-medium capitalize text-gray-900">{{ statusLabel(t.status) }}</p>
                <p class="ml-auto text-sm tabular-nums text-gray-500">{{ formatDateTime(t.at) }}</p>
              </li>
            </ol>
          </section>
        </div>

        <!-- Status actions -->
        <aside class="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <section aria-labelledby="status-heading" class="rounded-lg border border-gray-100 bg-white p-4 shadow-sm md:p-6">
            <h2 id="status-heading" class="text-lg font-semibold tracking-tight text-gray-900">Move order</h2>
            <p class="mt-1 text-sm leading-relaxed text-gray-500">
              Only the next valid steps are offered — an order cannot skip stages.
            </p>

            <div v-if="!isCancelled && !isDelivered" class="mt-4 space-y-3">
              <label :for="statusSelectId" class="text-sm font-medium text-gray-700">
                Move from <span class="font-semibold text-gray-900">{{ statusLabel(order.status) }}</span> to
              </label>
              <Select
                :id="statusSelectId"
                v-model="nextStatus"
                :options="nextStatusOptions"
                :error="statusError"
              />
              <p v-if="nextStatusOptions.length === 0" class="rounded-md bg-gray-50 px-3 py-2.5 text-sm text-gray-500">
                No further steps for this order.
              </p>
              <Button
                v-else
                variant="primary"
                class="w-full"
                icon="check"
                :loading="updating"
                loading-label="Updating order"
                @click="applyStatus"
              >
                Update status
              </Button>
              <p class="text-xs leading-relaxed text-gray-400">
                The customer sees the new status immediately. This cannot be undone — use Cancel order instead.
              </p>
            </div>

            <p v-else-if="isCancelled" class="mt-4 rounded-md bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
              This order was cancelled.
            </p>
            <p v-else class="mt-4 rounded-md bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800">
              Delivered. Nothing left to do — nice work.
            </p>

            <Button
              v-if="canCancel"
              variant="destructive"
              class="mt-4 w-full"
              icon="x"
              @click="cancelOpen = true"
            >
              Cancel order
            </Button>
          </section>

          <section aria-labelledby="payment-heading" class="rounded-lg border border-gray-100 bg-white p-4 shadow-sm md:p-6">
            <h2 id="payment-heading" class="text-lg font-semibold tracking-tight text-gray-900">Payment</h2>
            <dl class="mt-3 space-y-2.5 text-sm">
              <div class="flex items-center justify-between">
                <dt class="text-gray-500">Method</dt>
                <dd class="font-medium text-gray-900">{{ methodName }}</dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-gray-500">Status</dt>
                <dd><StatusBadge :status="paymentBadge" /></dd>
              </div>
              <div v-if="order.paidAt" class="flex items-center justify-between">
                <dt class="text-gray-500">Paid at</dt>
                <dd class="tabular-nums text-gray-900">{{ formatDateTime(order.paidAt) }}</dd>
              </div>
            </dl>
            <p class="mt-4 flex items-start gap-2 rounded-md bg-orange-50 px-3 py-2.5 text-xs leading-relaxed text-orange-800">
              <Icon name="lock" :size="14" class="mt-0.5 shrink-0" />
              Payment status is verified server-side. Never mark an order paid without a confirmed reference.
            </p>
          </section>
        </aside>
      </div>
    </template>

    <!-- Cancel confirmation -->
    <Modal v-model="cancelOpen" title="Cancel order">
      <p class="text-sm leading-relaxed text-gray-600">
        Cancelling <span class="font-semibold text-gray-900">{{ orderNumber(order) }}</span> will stop
        preparation and notify the customer
        <template v-if="order.paymentStatus === 'paid'">and start a refund of {{ naira(order.total)}}</template>.
        This cannot be undone.
      </p>
      <template #footer>
        <Button variant="secondary" @click="cancelOpen = false">Keep order</Button>
        <Button variant="destructive" icon="x" :loading="cancelling" loading-label="Cancelling order" @click="confirmCancel">
          Cancel order
        </Button>
      </template>
    </Modal>
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
import Select from '../../components/Select.vue'
import Modal from '../../components/Modal.vue'
import ProductImage from '../../components/ProductImage.vue'
import { naira, orderNumber, formatDateTime } from '../../lib/format.js'
import * as api from '../../lib/api.js'
import { toast, errorToast } from '../../store/toast.js'
import { ORDER_STATUSES, STATUS_TRANSITIONS, PAYMENT_METHODS } from '../../data/catalog.js'

const route = useRoute()

const order = ref(null)
const loading = ref(true)
const error = ref('')

const nextStatus = ref('')
const statusError = ref('')
const updating = ref(false)

const cancelOpen = ref(false)
const cancelling = ref(false)

const statusSelectId = 'status-select'

const isCancelled = computed(() => order.value?.status === 'cancelled')
const isDelivered = computed(() => order.value?.status === 'delivered')
const canCancel = computed(() => ['pending', 'paid', 'preparing'].includes(order.value?.status))

const paymentBadge = computed(() => {
  const s = order.value?.paymentStatus
  if (s === 'paid') return 'paid'
  if (s === 'failed') return 'failed'
  if (s === 'refunded') return 'refunded'
  return 'pending'
})

const methodName = computed(
  () => PAYMENT_METHODS.find((m) => m.id === order.value?.paymentMethod)?.name || 'Card'
)

const nextStatusOptions = computed(() =>
  (STATUS_TRANSITIONS[order.value?.status] || []).map((s) => ({
    value: s,
    label: statusLabel(s),
  }))
)

watch(
  nextStatusOptions,
  (opts) => {
    if (opts.length && !opts.some((o) => o.value === nextStatus.value)) {
      nextStatus.value = opts[0].value
    }
  },
  { immediate: true }
)

function statusLabel(status) {
  return ORDER_STATUSES.find((s) => s.id === status)?.label || status
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    order.value = await api.getOrder(route.params.id)
    const opts = STATUS_TRANSITIONS[order.value.status] || []
    nextStatus.value = opts[0] || ''
  } catch (e) {
    error.value = e.message
    order.value = null
  } finally {
    loading.value = false
  }
}

async function applyStatus() {
  statusError.value = ''
  if (!nextStatus.value) {
    statusError.value = 'Choose a next step.'
    return
  }
  updating.value = true
  try {
    order.value = await api.updateOrderStatus(order.value.id, nextStatus.value)
    toast({
      title: `Order ${orderNumber(order.value)} moved to ${statusLabel(order.value.status)}`,
      tone: 'success',
      duration: 2600,
    })
  } catch (e) {
    errorToast('Status not updated', e.message)
  } finally {
    updating.value = false
  }
}

async function confirmCancel() {
  cancelling.value = true
  try {
    order.value = await api.updateOrderStatus(order.value.id, 'cancelled')
    cancelOpen.value = false
    toast({ title: 'Order cancelled', message: 'The customer has been notified.', tone: 'success' })
  } catch (e) {
    errorToast('Could not cancel', e.message)
  } finally {
    cancelling.value = false
  }
}

watch(
  () => route.params.id,
  () => load()
)

onMounted(load)
</script>
