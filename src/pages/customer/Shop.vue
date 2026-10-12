<template>
  <div class="space-y-3">
    <!-- Sticky search + filter bar -->
    <div
      class="sticky top-16 z-30 bg-surface-white/95 backdrop-blur px-4 py-3 shadow-sm sm:px-6 border-b border-border-subtle">
      <div class="flex items-center gap-2">
        <SearchField
          v-model="query"
          placeholder="Search meals, ingredients, drinks..."
          class="flex-1"
        />

        <button
          type="button"
          aria-label="Filter food items"
          class="relative flex items-center justify-center gap-1.5 h-11 px-3.5 bg-orange-50 text-orange-700 font-label-md rounded-xl active:scale-95 transition-all shadow-sm"
          @click="filterOpen = true">
          <Icon name="filter" :size="18" />
          <span class="font-medium">Filters</span>
          <span
            v-if="activeFilterCount"
            class="w-5 h-5 rounded-full bg-orange-700 text-on-primary font-badge-xs flex items-center justify-center leading-none"
            >{{ activeFilterCount }}
          </span>
        </button>
      </div>

      <!-- Quick dietary chips -->
      <div class="mt-2 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <Chip
          v-for="d in diets"
          :key="d.id"
          :model-value="activeDiet === d.id"
          @update:model-value="setDiet(d.id)"
          class="whitespace-nowrap">
          <span class="flex items-center gap-1">{{ d.emoji }} {{ d.label }}</span>
        </Chip>
      </div>
    </div>

    <!-- Stats + sort -->
    <div class="px-4 flex items-center justify-between sm:px-6">
      <div class="flex items-center gap-1.5">
        <span class="font-headline-sm text-lg font-semibold text-text-primary">All Dishes</span>
        <span class="font-body-sm text-sm text-text-tertiary tabular-nums">({{ filtered.length }} items)</span>
      </div>
      <div class="relative inline-block">
        <button
          type="button"
          aria-haspopup="true"
          :aria-expanded="sortOpen"
          class="flex items-center gap-1 py-1.5 px-2.5 rounded-lg bg-surface-container-low text-text-secondary font-label-sm hover:text-text-primary transition-colors"
          @click="sortOpen = !sortOpen">
          <Icon name="sort" :size="16" class="text-text-tertiary" />
          <span>{{ currentSortLabel }}</span>
          <Icon name="chevron-down" :size="16" />
        </button>

        <transition name="fade">
          <div
            v-if="sortOpen"
            class="absolute right-0 mt-1 w-48 bg-surface-white rounded-xl shadow-lg p-1.5 z-40 flex flex-col gap-0.5">
            <button
              v-for="s in sortOptions"
              :key="s.value"
              :class="[
                'text-left w-full px-3 py-2 rounded-lg font-body-sm transition-colors',
                sort === s.value
                  ? 'text-orange-700 bg-orange-50 font-semibold'
                  : 'text-text-secondary hover:bg-surface-container-low',
              ]"
              type="button"
              @click="pickSort(s.value)">
              {{ s.label }}
            </button>
          </div>
        </transition>
      </div>
    </div>

    <!-- Grid -->
    <section class="px-4 sm:px-6">
      <div
        v-if="loading"
        class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
        aria-busy="true">
        <div
          v-for="i in 8"
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

      <ErrorState
        v-else-if="error"
        title="Could not load the menu"
        :message="error"
        @retry="load"
      />

      <EmptyState
        v-else-if="!filtered.length"
        title="No matches found"
        message="Nothing in the menu matches your search or filters. Try a different word or clear the filters."
        icon="search">
        <template #action>
          <Button variant="secondary" icon="refresh" @click="resetFilters">
            Clear filters
          </Button>
        </template>
      </EmptyState>

      <div
        v-else
        class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <ProductCard v-for="p in filtered" :key="p.id" :product="p" />
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Icon from '../../components/Icon.vue'
import Skeleton from '../../components/Skeleton.vue'
import EmptyState from '../../components/EmptyState.vue'
import ErrorState from '../../components/ErrorState.vue'
import ProductCard from '../../components/ProductCard.vue'
import SearchField from '../../components/SearchField.vue'
import Chip from '../../components/Chip.vue'
import Button from '../../components/Button.vue'
import Drawer from '../../components/Drawer.vue'
import DietCheckbox from '../../components/DietCheckbox.vue'
import { naira } from '../../lib/format.js'
import * as api from '../../lib/api.js'

const route = useRoute()
const router = useRouter()

const products = ref([])
const loading = ref(true)
const error = ref('')

const query = ref(route.query.q || '')
const activeDiet = ref('')
const sort = ref(route.query.sort || 'recommended')
const sortOpen = ref(false)
const filterOpen = ref(false)
const maxPrice = ref(0)

const diets = [
  { id: '', emoji: '🔥', label: 'All', tag: null },
  { id: 'popular', emoji: '🔥', label: 'Popular', tag: 'popular' },
  { id: 'vegetarian', emoji: '🌱', label: 'Vegetarian', tag: 'vegetarian' },
  { id: 'spicy', emoji: '🌶️', label: 'Spicy', tag: 'spicy' },
  { id: 'high-protein', emoji: '🥩', label: 'High Protein', tag: 'high-protein' },
]

const sortOptions = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'top_rated', label: 'Top Rated' },
  { value: 'name', label: 'Name (A–Z)' },
]

const currentSortLabel = computed(() => {
  const s = sortOptions.find((o) => o.value === sort.value)
  return s ? s.label : 'Sort'
})

const priceCap = computed(() =>
  products.value.length ? Math.max(...products.value.map((p) => p.price)) : 10000
)

const activeFilterCount = computed(() => {
  let n = 0
  if (query.value) n++
  if (activeDiet.value) n++
  if (maxPrice.value && maxPrice.value < priceCap.value) n++
  return n
})

const filtered = computed(() => {
  let list = products.value
  if (query.value) {
    const needle = query.value.toLowerCase()
    list = list.filter((p) => p.name.toLowerCase().includes(needle) || (p.description || '').toLowerCase().includes(needle))
  }
  if (activeDiet.value) {
    const diet = diets.find((d) => d.id === activeDiet.value)
    if (diet && diet.tag) {
      list = list.filter((p) => (p.tags || []).includes(diet.tag))
    }
  }
  if (maxPrice.value) {
    list = list.filter((p) => p.price <= maxPrice.value)
  }

  const sorted = [...list]
  switch (sort.value) {
    case 'price_asc':
      sorted.sort((a, b) => a.price - b.price)
      break
    case 'price_desc':
      sorted.sort((a, b) => b.price - a.price)
      break
    case 'top_rated':
      sorted.sort((a, b) => b.rating - a.rating)
      break
    case 'name':
      sorted.sort((a, b) => a.name.localeCompare(b.name))
      break
    default:
      sorted.sort((a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating)
  }
  return sorted
})

watch(priceCap, () => {
  if (!maxPrice.value || maxPrice.value > priceCap.value) {
    maxPrice.value = priceCap.value
  }
})

function setDiet(id) {
  activeDiet.value = id
}

function pickSort(value) {
  sort.value = value
  sortOpen.value = false
  syncQuery({ sort: value !== 'recommended' ? value : undefined })
}

function resetFilters() {
  activeDiet.value = ''
  query.value = ''
  maxPrice.value = priceCap.value
}

let searchTimer = null
watch(query, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(syncQuery, 350)
})

function syncQuery(overrides = {}) {
  const q = { ...route.query }
  if (query.value) q.q = query.value
  else delete q.q
  const s = overrides.sort !== undefined ? overrides.sort : sort.value
  if (s && s !== 'recommended') q.sort = s
  else delete q.sort
  router.replace({ path: '/shop', query: q })
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [items] = await Promise.all([api.listProducts({ sort: sort.value })])
    products.value = items
    if (!maxPrice.value || maxPrice.value > priceCap.value) {
      maxPrice.value = priceCap.value
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
