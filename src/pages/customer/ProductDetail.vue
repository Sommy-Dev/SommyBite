<template>
  <div class="space-y-8 pb-20 md:pb-8">
    <template v-if="loading">
      <Skeleton class="h-4 w-48" />
      <div class="grid gap-8 lg:grid-cols-2">
        <Skeleton class="aspect-4/3 w-full rounded-lg" />
        <div class="space-y-4">
          <Skeleton class="h-6 w-24" />
          <Skeleton class="h-9 w-3/4" />
          <Skeleton class="h-8 w-28" />
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-5/6" />
          <Skeleton class="h-14 w-full" />
          <Skeleton class="h-12 w-full" />
        </div>
      </div>
    </template>

    <ErrorState
      v-else-if="error"
      :title="notFound ? 'Meal not found' : 'We could not load this meal'"
      :message="error"
      @retry="load"
    >
      <template #action v-if="notFound">
        <Button variant="secondary" icon="grid" @click="$router.push('/shop')">Browse the menu</Button>
      </template>
    </ErrorState>

    <template v-else-if="product">
      <!-- Breadcrumb -->
      <nav aria-label="Breadcrumb" class="flex items-center gap-1.5 text-sm text-text-secondary">
        <router-link to="/shop" class="transition-colors duration-150 hover:text-orange-700">Shop</router-link>
        <Icon name="chevron-right" :size="14" class="text-text-tertiary" />
        <span>{{ categoryName }}</span>
        <Icon name="chevron-right" :size="14" class="text-text-tertiary" />
        <span class="font-medium text-text-primary">{{ product.name }}</span>
      </nav>

      <div class="grid gap-8 lg:grid-cols-2">
        <!-- Gallery -->
        <div class="space-y-3">
          <div class="aspect-4/3 w-full overflow-hidden rounded-lg bg-surface-container-low shadow-sm">
            <ProductImage
              :emoji="product.emoji"
              :hue="product.hue"
              :src="product.image"
              :alt="product.name"
              class="h-full w-full"
            />
          </div>
          <div class="grid grid-cols-4 gap-3" role="group" aria-label="Product images">
            <button
              v-for="thumb in gallery"
              :key="thumb"
              type="button"
              :aria-label="`View image ${thumb}`"
              :aria-pressed="String(selectedImage === thumb)"
              class="aspect-square overflow-hidden rounded-md border-2 bg-surface-container-low transition-colors duration-150 focus-visible:outline-none"
              :class="selectedImage === thumb ? 'border-orange-700' : 'border-transparent hover:border-border-strong'"
              @click="selectedImage = thumb"
            >
              <ProductImage
                :emoji="product.emoji"
                :hue="product.hue"
                :src="product.image"
                :alt="`${product.name} view ${thumb}`"
                class="h-full w-full"
              />
            </button>
          </div>
        </div>

        <!-- Details -->
        <div class="space-y-5">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <Badge tone="accent">{{ categoryName }}</Badge>
              <StatusBadge :status="availability" />
            </div>
            <h1 class="mt-3 text-2xl font-semibold tracking-tight text-text-primary md:text-4xl">
              {{ product.name }}
            </h1>
            <p class="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-text-primary">
              {{ naira(product.price) }}
            </p>
            <p v-if="product.stock > 0 && product.stock <= 5" class="mt-1 text-sm font-medium text-amber-800">
              Only {{ product.stock }} left today — order soon.
            </p>
          </div>

          <p class="text-base leading-relaxed text-text-secondary">{{ product.description }}</p>

          <dl class="space-y-2 rounded-lg border border-border-subtle bg-white p-4 text-sm shadow-sm">
            <div class="flex items-center justify-between">
              <dt class="flex items-center gap-2 text-text-secondary">
                <Icon name="truck" :size="18" class="text-text-tertiary" /> Delivery
              </dt>
              <dd class="font-medium text-text-primary">45–75 minutes</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="flex items-center gap-2 text-text-secondary">
                <Icon name="leaf" :size="18" class="text-text-tertiary" /> Freshness
              </dt>
              <dd class="font-medium text-text-primary">Cooked to order</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="flex items-center gap-2 text-text-secondary">
                <Icon name="lock" :size="18" class="text-text-tertiary" /> Payment
              </dt>
              <dd class="font-medium text-text-primary">Secure checkout</dd>
            </div>
          </dl>

          <div class="flex flex-wrap items-center gap-4">
            <QuantityStepper
              v-model="quantity"
              :min="1"
              :max="product.stock"
              :label="`Quantity of ${product.name}`"
            />
            <Button
              variant="primary"
              size="lg"
              icon="cart"
              class="min-w-48 flex-1"
              :disabled="product.stock <= 0"
              @click="add"
            >
              Add to cart
            </Button>
          </div>
          <p class="text-sm text-text-secondary">
            Free delivery on orders over ₦10,000. Flat ₦500 under that.
          </p>
        </div>
      </div>

      <!-- Related -->
      <section aria-labelledby="related-heading" class="pt-4">
        <h2 id="related-heading" class="mb-4 text-xl font-semibold tracking-tight text-text-primary md:text-2xl">
          You may also like
        </h2>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ProductCard v-for="p in related" :key="p.id" :product="p" />
        </div>
      </section>
    </template>

    <!-- Sticky mobile add-to-cart bar -->
    <div
      v-if="product && !loading && !error"
      class="fixed inset-x-0 bottom-16 z-30 border-t border-border-subtle bg-white p-3 md:hidden"
    >
      <div class="flex items-center gap-3">
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold text-text-primary">{{ product.name }}</p>
          <p class="text-base font-semibold tabular-nums text-text-primary">{{ naira(product.price) }}</p>
        </div>
        <Button
          variant="primary"
          icon="cart"
          class="flex-1"
          :disabled="product.stock <= 0"
          @click="add"
        >
          {{ product.stock <= 0 ? 'Sold out' : 'Add to cart' }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Icon from '../../components/Icon.vue'
import Badge from '../../components/Badge.vue'
import Button from '../../components/Button.vue'
import Skeleton from '../../components/Skeleton.vue'
import ErrorState from '../../components/ErrorState.vue'
import QuantityStepper from '../../components/QuantityStepper.vue'
import StatusBadge from '../../components/StatusBadge.vue'
import ProductCard from '../../components/ProductCard.vue'
import ProductImage from '../../components/ProductImage.vue'
import { naira } from '../../lib/format.js'
import * as api from '../../lib/api.js'
import { addToCart, openDrawer } from '../../store/cart.js'
import { toast } from '../../store/toast.js'

const route = useRoute()

const product = ref(null)
const allProducts = ref([])
const loading = ref(true)
const error = ref('')
const notFound = ref(false)
const quantity = ref(1)
const selectedImage = ref(1)

const gallery = [1, 2, 3, 4]

const availability = computed(() => {
  if (!product.value) return 'in_stock'
  const s = product.value.stock
  return s <= 0 ? 'sold_out' : s <= 5 ? 'low_stock' : 'in_stock'
})

const categoryName = computed(() => {
  const cat = api.getCategorySync(product.value?.categoryId)
  return cat ? cat.name : 'Menu item'
})

const related = computed(() =>
  allProducts.value
    .filter((p) => p.id !== product.value?.id && p.categoryId === product.value?.categoryId)
    .concat(allProducts.value.filter((p) => p.id !== product.value?.id && p.categoryId !== product.value?.categoryId))
    .slice(0, 4)
)

async function load() {
  loading.value = true
  error.value = ''
  notFound.value = false
  try {
    const [p, all] = await Promise.all([
      api.getProduct(route.params.id),
      api.listProducts({}),
    ])
    product.value = p
    allProducts.value = all
    quantity.value = 1
  } catch (e) {
    error.value = e.message
    notFound.value = e.code === 'not_found'
  } finally {
    loading.value = false
  }
}

function add() {
  const result = addToCart(product.value.id, quantity.value)
  if (result.ok) {
    toast({
      title: `${product.value.name} added to Cart`,
      tone: 'success',
      duration: 2600,
    })
    openDrawer()
  } else {
    toast({ title: result.reason, tone: 'error' })
  }
}

watch(
  () => route.params.id,
  () => load()
)

onMounted(load)
</script>
