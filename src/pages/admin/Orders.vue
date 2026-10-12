<template>
  <div class="space-y-4">
    <header>
      <h1 class="text-2xl font-semibold tracking-tight text-gray-900 md:text-3xl">Orders</h1>
      <p class="mt-1 text-sm text-gray-500">
        {{ orders.length }} order{{ orders.length === 1 ? '' : 's' }}
        <template v-if="statusFilter !== 'all'"> · {{ statusLabel }}</template>
        <template v-if="query"> · “{{ query }}”</template>
      </p>
    </header>

    <!-- Status filter + search -->
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div class="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter orders by status">
        <Chip
          v-for="option in statusOptions"
          :key="option.value"
          :model-value="statusFilter === option.value"
          @update:model-value="statusFilter = option.value"
        >
          {{ option.label }}
        </Chip>
      </div>
      <div class="w-full lg:ml-auto lg:w-72">
        <SearchField
          v-model="query"
          placeholder="Search by order number"
          aria-label="Search orders by number"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm" aria-busy="true">
      <div class="space-y-3 p-4">
        <div v-for="i in 6" :key="i" class="flex items-center gap-4">
          <Skeleton class="h-4 w-24" />
          <Skeleton class="h-4 w-32" />
          <Skeleton class="h-4 w-16" />
          <div class="flex-1" />
          <Skeleton class="h-6 w-24 rounded-full" />
        </div>
      </div>
    </div>

    <ErrorState v-else-if="error" title="We could not load orders" :message="error" @retry="load" />

    <EmptyState
      v-else-if="!filtered.length"
      :title="query ? 'No orders match that number' : 'No orders in this view'"
      :message="query ? 'Check the number and try again.' : 'Orders will appear here as customers place them.'"
      icon="receipt"
    >
      <template #action>
        <Button v-if="query" variant="secondary" icon="refresh" @click="query = ''">Clear search</Button>
      </template>
    </EmptyState>

    <!-- Orders table -->
    <div v-else class="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <caption class="sr-only">Customer orders with status, totals and actions</caption>
          <thead class="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th scope="col" class="px-4 py-3">Order</th>
              <th scope="col" class="px-4 py-3">Customer</th>
              <th scope="col" class="px-4 py-3">Date</th>
              <th scope="col" class="px-4 py-3 text-right">Items</th>
              <th scope="col" class="px-4 py-3 text-right">Total</th>
              <th scope="col" class="px-4 py-3">Status</th>
              <th scope="col" class="sr-only">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="order in filtered"
              :key="order.id"
              class="cursor-pointer transition-colors duration-150 hover:bg-gray-50"
              @click="$router.push(`/admin/orders/${order.id}`)"
            >
              <td class="px-4 py-3 font-semibold tabular-nums text-orange-700">{{ orderNumber(order) }}</td>
              <td class="px-4 py-3">
                <p class="font-medium text-gray-900">{{ order.customer.name }}</p>
                <p class="text-xs text-gray-400">{{ order.customer.phone || 'No phone' }}</p>
              </td>
              <td class="px-4 py-3 text-gray-500">{{ formatDate(order.createdAt) }}</td>
              <td class="px-4 py-3 text-right tabular-nums text-gray-900">
                {{ order.items.reduce((n, i) => n + i.qty, 0) }}
              </td>
              <td class="px-4 py-3 text-right font-semibold tabular-nums text-gray-900">{{ naira(order.total) }}</td>
              <td class="px-4 py-3">
                <div class="flex flex-wrap items-center gap-1.5">
                  <StatusBadge :status="order.status" />
                  <StatusBadge v-if="order.paymentStatus === 'failed'" status="failed" />
                </div>
              </td>
              <td class="px-4 py-3 text-right">
                <span class="inline-flex items-center gap-1 rounded-md px-2 py-1.5 font-semibold text-orange-700 hover:bg-orange-50">
                  Open <Icon name="chevron-right" :size="16" />
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import Icon from '../../components/Icon.vue'
import Button from '../../components/Button.vue'
import Chip from '../../components/Chip.vue'
import SearchField from '../../components/SearchField.vue'
import Skeleton from '../../components/Skeleton.vue'
import EmptyState from '../../components/EmptyState.vue'
import ErrorState from '../../components/ErrorState.vue'
import StatusBadge from '../../components/StatusBadge.vue'
import { naira, orderNumber, formatDate } from '../../lib/format.js'
import * as api from '../../lib/api.js'
import { ORDER_STATUSES } from '../../data/catalog.js'

const orders = ref([])
const loading = ref(true)
const error = ref('')
const statusFilter = ref('all')
const query = ref('')

const statusOptions = computed(() => [
  { value: 'all', label: 'All' },
  ...ORDER_STATUSES.map((s) => ({ value: s.id, label: s.label })),
])

const statusLabel = computed(() =>
  statusOptions.value.find((o) => o.value === statusFilter.value)?.label || ''
)

const filtered = computed(() => {
  let items = orders.value
  if (statusFilter.value !== 'all') items = items.filter((o) => o.status === statusFilter.value)
  const needle = query.value.trim().toLowerCase()
  if (needle) items = items.filter((o) => orderNumber(o).toLowerCase().includes(needle))
  return items
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    orders.value = await api.listOrders({})
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
