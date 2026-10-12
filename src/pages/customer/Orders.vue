<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-3xl font-semibold tracking-tight text-text-primary md:text-4xl">My orders</h1>
      <p class="mt-1 text-base text-text-secondary">
        Track every order, from kitchen to your door.
      </p>
    </header>

    <div v-if="loading" class="space-y-4" aria-busy="true">
      <Skeleton v-for="i in 3" :key="i" class="h-28 rounded-lg" />
    </div>

    <ErrorState
      v-else-if="error"
      title="We could not load your orders"
      :message="error"
      @retry="load"
    />

    <EmptyState
      v-else-if="!orders.length"
      title="No orders yet"
      message="When you place an order it will show up here with live status updates."
      icon="receipt"
    >
      <template #action>
        <Button variant="primary" icon="grid" @click="$router.push('/shop')">Browse menu</Button>
      </template>
    </EmptyState>

    <template v-else>
      <!-- Mobile: card list -->
      <ul class="space-y-4 md:hidden">
        <li v-for="order in orders" :key="order.id">
          <router-link
            :to="`/orders/${order.id}`"
            class="block rounded-lg border border-border-subtle bg-white p-4 shadow-sm transition-colors duration-150 hover:border-border-default"
          >
            <div class="flex items-center justify-between gap-2">
              <p class="text-base font-semibold tabular-nums text-text-primary">{{ orderNumber(order) }}</p>
              <StatusBadge :status="order.status" />
            </div>
            <p class="mt-1 text-sm text-text-secondary">{{ formatDate(order.createdAt) }}</p>
            <p class="mt-1 truncate text-sm text-text-secondary">
              {{ order.items.map((i) => `${i.qty} × ${i.name}`).join(', ') }}
            </p>
            <div class="mt-3 flex items-center justify-between border-t border-border-subtle pt-3">
              <p class="text-lg font-semibold tabular-nums text-text-primary">{{ naira(order.total) }}</p>
              <span class="flex items-center gap-1 text-sm font-semibold text-orange-700">
                Track order
                <Icon name="chevron-right" :size="16" />
              </span>
            </div>
          </router-link>
        </li>
      </ul>

      <!-- Desktop: table -->
      <div class="hidden overflow-hidden rounded-lg border border-border-subtle bg-white shadow-sm md:block">
        <table class="w-full text-left text-sm">
          <caption class="sr-only">Your orders with date, items, total and status</caption>
          <thead class="border-b border-border-subtle bg-gray-50 text-xs font-semibold uppercase tracking-wide text-text-secondary">
            <tr>
              <th scope="col" class="px-4 py-3">Order</th>
              <th scope="col" class="px-4 py-3">Date</th>
              <th scope="col" class="px-4 py-3">Items</th>
              <th scope="col" class="px-4 py-3 text-right">Total</th>
              <th scope="col" class="px-4 py-3">Status</th>
              <th scope="col" class="sr-only">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-subtle">
            <tr
              v-for="order in orders"
              :key="order.id"
              class="transition-colors duration-150 hover:bg-gray-50"
            >
              <td class="px-4 py-3 font-semibold tabular-nums text-text-primary">{{ orderNumber(order) }}</td>
              <td class="px-4 py-3 text-text-secondary">{{ formatDate(order.createdAt) }}</td>
              <td class="max-w-64 truncate px-4 py-3 text-text-secondary">
                {{ order.items.map((i) => `${i.qty} × ${i.name}`).join(', ') }}
              </td>
              <td class="px-4 py-3 text-right font-semibold tabular-nums text-text-primary">{{ naira(order.total) }}</td>
              <td class="px-4 py-3"><StatusBadge :status="order.status" /></td>
              <td class="px-4 py-3 text-right">
                <router-link
                  :to="`/orders/${order.id}`"
                  class="inline-flex items-center gap-1 rounded-md px-2 py-1.5 font-semibold text-orange-700 transition-colors duration-150 hover:bg-orange-50"
                >
                  Track <Icon name="chevron-right" :size="16" />
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Icon from '../../components/Icon.vue'
import Button from '../../components/Button.vue'
import Skeleton from '../../components/Skeleton.vue'
import EmptyState from '../../components/EmptyState.vue'
import ErrorState from '../../components/ErrorState.vue'
import StatusBadge from '../../components/StatusBadge.vue'
import { naira, orderNumber, formatDate } from '../../lib/format.js'
import * as api from '../../lib/api.js'
import { auth } from '../../store/auth.js'

const orders = ref([])
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    orders.value = await api.listOrders({ customerId: auth.user?.id })
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
