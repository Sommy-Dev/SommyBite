<template>
  <div class="space-y-4">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight text-gray-900 md:text-3xl">Products</h1>
        <p class="mt-1 text-sm text-gray-500">{{ products.length }} items in the menu</p>
      </div>
      <router-link to="/admin/products/new">
        <Button variant="primary" icon="plus">Add product</Button>
      </router-link>
    </header>

    <div class="w-full max-w-sm">
      <SearchField v-model="query" placeholder="Search products" />
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm" aria-busy="true">
      <div class="space-y-3 p-4">
        <div v-for="i in 6" :key="i" class="flex items-center gap-3">
          <Skeleton class="h-11 w-11 rounded-md" />
          <div class="flex-1 space-y-2">
            <Skeleton class="h-4 w-1/3" />
            <Skeleton class="h-3 w-1/4" />
          </div>
          <Skeleton class="h-7 w-14 rounded-full" />
          <Skeleton class="h-11 w-20" />
        </div>
      </div>
    </div>

    <ErrorState
      v-else-if="error"
      title="We could not load products"
      :message="error"
      @retry="load"
    />

    <EmptyState
      v-else-if="!filtered.length"
      :title="query ? 'No products match' : 'No products yet'"
      :message="query ? 'Try a different search word.' : 'Add your first product to start selling.'"
      icon="boxes"
    >
      <template #action>
        <Button v-if="!query" variant="primary" icon="plus" @click="$router.push('/admin/products/new')">
          Add product
        </Button>
        <Button v-else variant="secondary" icon="refresh" @click="query = ''">Clear search</Button>
      </template>
    </EmptyState>

    <!-- Products table -->
    <div v-else class="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <caption class="sr-only">Product list with price, stock, availability and actions</caption>
          <thead class="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th scope="col" class="px-4 py-3">Product</th>
              <th scope="col" class="px-4 py-3">Category</th>
              <th scope="col" class="px-4 py-3 text-right">Price</th>
              <th scope="col" class="px-4 py-3 text-right">Stock</th>
              <th scope="col" class="px-4 py-3">Available</th>
              <th scope="col" class="sr-only">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="product in filtered"
              :key="product.id"
              class="transition-colors duration-150 hover:bg-gray-50"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="aspect-square h-11 w-11 shrink-0 overflow-hidden rounded-md bg-gray-100">
                    <ProductImage :emoji="product.emoji" :hue="product.hue" :alt="product.name" class="h-full w-full" />
                  </div>
                  <div class="min-w-0">
                    <router-link
                      :to="`/product/${product.id}`"
                      class="block truncate font-semibold text-gray-900 hover:text-orange-700"
                    >
                      {{ product.name }}
                    </router-link>
                    <p class="text-xs text-gray-400">
                      {{ product.stock <= 0 ? 'Sold out' : product.stock <= 5 ? `Only ${product.stock} left` : `${product.stock} in stock` }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-gray-500">{{ categoryName(product.categoryId) }}</td>
              <td class="px-4 py-3 text-right font-semibold tabular-nums text-gray-900">{{ naira(product.price) }}</td>
              <td class="px-4 py-3 text-right tabular-nums text-gray-900">
                <span :class="product.stock === 0 ? 'font-semibold text-red-600' : product.stock <= 5 ? 'font-semibold text-amber-800' : ''">
                  {{ product.stock }}
                </span>
              </td>
              <td class="px-4 py-3">
                <Switch
                  :model-value="product.stock > 0"
                  :label="`${product.name} availability`"
                  @update:model-value="(v) => toggleAvailability(product, v)"
                />
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-1">
                  <router-link
                    :to="`/admin/products/${product.id}/edit`"
                    class="flex h-11 w-11 items-center justify-center rounded-md text-gray-500 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900"
                    :aria-label="`Edit ${product.name}`"
                  >
                    <Icon name="pencil" :size="18" />
                  </router-link>
                  <button
                    type="button"
                    class="flex h-11 w-11 items-center justify-center rounded-md text-gray-500 transition-colors duration-150 hover:bg-red-50 hover:text-red-600"
                    :aria-label="`Delete ${product.name}`"
                    @click="remove(product)"
                  >
                    <Icon name="trash" :size="18" />
                  </button>
                </div>
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
import SearchField from '../../components/SearchField.vue'
import Skeleton from '../../components/Skeleton.vue'
import EmptyState from '../../components/EmptyState.vue'
import ErrorState from '../../components/ErrorState.vue'
import Switch from '../../components/Switch.vue'
import ProductImage from '../../components/ProductImage.vue'
import { naira } from '../../lib/format.js'
import {
  adminListProducts,
  adminUpdateProduct,
  adminDeleteProduct,
  adminCreateProduct,
  listCategories,
} from '../../lib/api.js'
import { toast, errorToast } from '../../store/toast.js'

const products = ref([])
const categories = ref([])
const loading = ref(true)
const error = ref('')
const query = ref('')

const filtered = computed(() => {
  const needle = query.value.trim().toLowerCase()
  if (!needle) return products.value
  return products.value.filter((p) => p.name.toLowerCase().includes(needle))
})

function categoryName(id) {
  return categories.value.find((c) => c.id === id)?.name || 'Uncategorized'
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [p, c] = await Promise.all([adminListProducts(), listCategories()])
    products.value = p
    categories.value = c
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function toggleAvailability(product, available) {
  const prevStock = product.stock
  const nextStock = available ? Math.max(1, prevStock) : 0
  // optimistic UI: feedback within 100ms
  product.stock = nextStock
  try {
    await adminUpdateProduct(product.id, { stock: nextStock })
    toast({
      title: available ? `${product.name} is now available` : `${product.name} hidden from menu`,
      tone: 'success',
      duration: 2600,
    })
  } catch (e) {
    product.stock = prevStock // roll back
    errorToast('Could not update availability', e.message)
  }
}

function remove(product) {
  const index = products.value.findIndex((p) => p.id === product.id)
  // optimistic removal
  products.value.splice(index, 1)
  adminDeleteProduct(product.id).catch(async () => {
    products.value.splice(index, 0, product) // roll back on failure
  })
  toast({
    title: `${product.name} deleted`,
    action: {
      label: 'Undo',
      onClick: async () => {
        await adminCreateProduct(product) // restore
        await load()
        toast({ title: `${product.name} restored`, tone: 'success', duration: 2200 })
      },
    },
  })
}

onMounted(load)
</script>
