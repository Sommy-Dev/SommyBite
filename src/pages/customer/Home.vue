<template>
  <div class="space-y-1">
    <!-- Hero with SOMMY20 promo -->
    <HeroBanner />

    <!-- Trust / value pillars -->
    <TrustBadges />

    <!-- Category chips (filter the featured grid below) -->
    <CategoryChips v-model="activeCategory" :categories="categories" />

    <!-- Chef's Daily Special spotlight -->
    <ChefSpecial :product="chefSpecial" />

    <!-- Featured dishes grid -->
    <section class="px-4 py-3 md:px-6">
      <div class="mb-3 flex items-center justify-between">
        <div>
          <h3 class="font-headline-md text-lg font-semibold text-text-primary">
            Featured Dishes
          </h3>
          <p class="font-body-sm text-sm text-text-secondary">
            Signature culinary favorites prepared fresh
          </p>
        </div>
        <span
          class="font-badge-xs text-xs bg-surface-container px-2 py-1 rounded-full text-text-secondary"
          >{{ featured.length }} Items</span
        >
      </div>

      <ErrorState
        v-if="loadError"
        title="Could not load the menu"
        :message="loadError"
        @retry="load"
      />

      <div
        v-else-if="loading"
        class="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4"
        aria-busy="true">
        <div
          v-for="i in 4"
          :key="i"
          class="overflow-hidden rounded-2xl bg-surface-white shadow-sm">
          <Skeleton class="aspect-[4/3] w-full rounded-none" />
          <div class="space-y-2 p-3">
            <Skeleton class="h-3 w-3/4" />
            <Skeleton class="h-3 w-1/2" />
            <div class="flex items-center justify-between pt-1">
              <Skeleton class="h-5 w-16" />
              <Skeleton class="h-9 w-9 rounded-xl" />
            </div>
          </div>
        </div>
      </div>

      <EmptyState
        v-else-if="!featured.length"
        title="Nothing in this category"
        message="No dishes match the selected category — pick another or browse all."
        icon="boxes"
      />

      <div
        v-else
        class="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4">
        <ProductCard v-for="p in featured" :key="p.id" :product="p" />
      </div>
    </section>

    <!-- Delivery tracker micro-card -->
    <section class="px-4 pb-5 md:px-6">
      <div
        class="bg-orange-50 rounded-xl p-4 flex items-center justify-between gap-3 shadow-sm">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center flex-shrink-0 shadow-sm">
            <Icon name="truck" :size="20" />
          </div>
          <div>
            <h4 class="font-headline-sm text-sm font-semibold text-text-primary">
              Instant Kitchen Dispatch
            </h4>
            <p class="font-body-sm text-xs text-text-secondary">
              Orders dispatched in under 12 minutes
            </p>
          </div>
        </div>
        <router-link
          :to="{ path: '/orders' }"
          class="font-label-sm text-sm font-semibold text-orange-700 flex items-center gap-0.5 flex-shrink-0"
          >Track
          <Icon name="chevron-right" :size="16" />
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Icon from '../../components/Icon.vue'
import Skeleton from '../../components/Skeleton.vue'
import EmptyState from '../../components/EmptyState.vue'
import ErrorState from '../../components/ErrorState.vue'
import ProductCard from '../../components/ProductCard.vue'
import HeroBanner from '../../components/HeroBanner.vue'
import TrustBadges from '../../components/TrustBadges.vue'
import CategoryChips from '../../components/CategoryChips.vue'
import ChefSpecial from '../../components/ChefSpecial.vue'
import * as api from '../../lib/api.js'

const products = ref([])
const categories = ref([])
const activeCategory = ref('')
const loading = ref(true)
const loadError = ref('')

const chefSpecial = computed(() => products.value.find((p) => p.chefSpecial))

const featured = computed(() => {
  let list
  if (activeCategory.value) {
    list = products.value.filter((p) => p.categoryId === activeCategory.value)
  } else {
    list = products.value
      .filter((p) => p.featured)
      .sort((a, b) => b.rating - a.rating)
  }
  return list.slice(0, 4)
})

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const [cats, items] = await Promise.all([
      api.listCategories(),
      api.listProducts(),
    ])
    categories.value = cats
    products.value = items
  } catch (e) {
    loadError.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
