<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-2xl font-semibold tracking-tight text-gray-900 md:text-3xl">Overview</h1>
      <p class="mt-1 text-sm text-gray-500">New orders, stock and today's activity at a glance.</p>
    </header>

    <div v-if="loading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
      <Skeleton v-for="i in 4" :key="i" class="h-28 rounded-lg" />
    </div>

    <ErrorState v-else-if="error" title="We could not load the dashboard" :message="error" @retry="load" />

    <template v-else>
      <!-- Stat cards -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="rounded-lg border border-gray-100 bg-white p-4 shadow-sm"
        >
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-gray-500">{{ stat.label }}</p>
            <span class="flex h-9 w-9 items-center justify-center rounded-lg" :class="stat.bg">
              <Icon :name="stat.icon" :size="20" :class="stat.iconClass" />
            </span>
          </div>
          <p class="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-gray-900">
            {{ stat.value }}
          </p>
          <p class="mt-1 text-xs font-medium" :class="stat.hintClass">{{ stat.hint }}</p>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-[1fr_360px]">
        <!-- Recent orders -->
        <section aria-labelledby="recent-heading" class="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
          <div class="flex items-center justify-between px-4 py-3 md:px-6">
            <h2 id="recent-heading" class="text-base font-semibold tracking-tight text-gray-900">
              Recent orders
            </h2>
            <router-link to="/admin/orders" class="text-sm font-semibold text-orange-700 underline-offset-2 hover:underline">
              View all
            </router-link>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <caption class="sr-only">Most recent customer orders</caption>
              <thead class="border-y border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th scope="col" class="px-4 py-2.5">Order</th>
                  <th scope="col" class="px-4 py-2.5">Customer</th>
                  <th scope="col" class="px-4 py-2.5">Total</th>
                  <th scope="col" class="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr
                  v-for="order in recentOrders"
                  :key="order.id"
                  class="transition-colors duration-150 hover:bg-gray-50"
                >
                  <td class="px-4 py-3">
                    <router-link
                      :to="`/admin/orders/${order.id}`"
                      class="font-semibold tabular-nums text-orange-700 underline-offset-2 hover:underline"
                    >
                      {{ orderNumber(order) }}
                    </router-link>
                  </td>
                  <td class="px-4 py-3 text-gray-700">{{ order.customer.name }}</td>
                  <td class="px-4 py-3 font-semibold tabular-nums text-gray-900">{{ naira(order.total) }}</td>
                  <td class="px-4 py-3"><StatusBadge :status="order.status" /></td>
                </tr>
                <tr v-if="!recentOrders.length">
                  <td colspan="4" class="px-4 py-8 text-center text-sm text-gray-500">
                    No orders yet. They will appear here as they come in.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Low stock alerts -->
        <section aria-labelledby="stock-heading" class="rounded-lg border border-gray-100 bg-white p-4 shadow-sm md:p-6">
          <h2 id="stock-heading" class="text-base font-semibold tracking-tight text-gray-900">
            Low stock
          </h2>
          <ul v-if="lowStock.length" class="mt-3 space-y-3">
            <li v-for="p in lowStock" :key="p.id" class="flex items-center gap-3">
              <div class="aspect-square h-11 w-11 shrink-0 overflow-hidden rounded-md bg-gray-100">
                <ProductImage :emoji="p.emoji" :hue="p.hue" :alt="p.name" class="h-full w-full" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-gray-900">{{ p.name }}</p>
                <p class="text-xs text-gray-500">
                  <span :class="p.stock === 0 ? 'font-semibold text-red-600' : 'font-semibold text-amber-800'">
                    {{ p.stock === 0 ? 'Sold out' : `${p.stock} left` }}
                  </span>
                </p>
              </div>
              <router-link
                :to="`/admin/products/${p.id}/edit`"
                class="rounded-md px-2 py-1.5 text-sm font-semibold text-orange-700 transition-colors duration-150 hover:bg-orange-50"
              >
                Restock
              </router-link>
            </li>
          </ul>
          <p v-else class="mt-3 flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800">
            <Icon name="check-circle" :size="18" />
            All products are well stocked.
          </p>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import Icon from '../../components/Icon.vue'
import Skeleton from '../../components/Skeleton.vue'
import ErrorState from '../../components/ErrorState.vue'
import StatusBadge from '../../components/StatusBadge.vue'
import ProductImage from '../../components/ProductImage.vue'
import { naira, orderNumber } from '../../lib/format.js'
import { adminListProducts, adminListOrders } from '../../lib/api.js'

const loading = ref(true)
const error = ref('')
const products = ref([])
const orders = ref([])

const stats = computed(() => {
  const today = new Date().toDateString()
  const newToday = orders.value.filter((o) => new Date(o.createdAt).toDateString() === today).length
  const pending = orders.value.filter((o) => ['pending', 'paid', 'preparing', 'out_for_delivery'].includes(o.status)).length
  const low = products.value.filter((p) => p.stock > 0 && p.stock <= 5).length
  const soldOut = products.value.filter((p) => p.stock <= 0).length
  const revenue = orders.value
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.total, 0)
  return [
    {
      label: 'New orders today',
      value: newToday,
      hint: newToday ? 'Fresh in the queue' : 'Nothing new yet',
      icon: 'receipt',
      bg: 'bg-orange-50',
      iconClass: 'text-orange-700',
      hintClass: 'text-gray-500',
    },
    {
      label: 'Open orders',
      value: pending,
      hint: pending ? 'Need attention' : 'All caught up',
      icon: 'clock',
      bg: 'bg-amber-50',
      iconClass: 'text-amber-700',
      hintClass: 'text-gray-500',
    },
    {
      label: 'Low stock items',
      value: low + soldOut,
      hint: soldOut ? `${soldOut} sold out` : low ? 'Restock soon' : 'Stock is healthy',
      icon: 'boxes',
      bg: 'bg-sky-50',
      iconClass: 'text-sky-700',
      hintClass: 'text-gray-500',
    },
    {
      label: 'Revenue (paid)',
      value: naira(revenue),
      hint: 'All time, verified',
      icon: 'wallet',
      bg: 'bg-emerald-50',
      iconClass: 'text-emerald-700',
      hintClass: 'text-gray-500',
    },
  ]
})

const recentOrders = computed(() => orders.value.slice(0, 6))
const lowStock = computed(() =>
  products.value.filter((p) => p.stock <= 5).sort((a, b) => a.stock - b.stock).slice(0, 6)
)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [p, o] = await Promise.all([adminListProducts(), adminListOrders()])
    products.value = p
    orders.value = o
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
