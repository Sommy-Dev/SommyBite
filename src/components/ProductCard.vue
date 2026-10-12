<template>
  <article
    :class="[
      'bg-surface-white rounded-2xl shadow-sm overflow-hidden flex flex-col transition-transform active:scale-[0.99] group',
      soldOut && 'opacity-75',
    ]">
    <!-- Stitch card image: 4/3, hover scale, stock badge + heart -->
    <div class="relative w-full aspect-[4/3] bg-surface-container overflow-hidden">
      <router-link :to="`/product/${product.id}`" class="absolute inset-0 z-0" />
      <div class="relative z-1 flex h-full w-full">
        <ProductImage
          :emoji="product.emoji"
          :hue="product.hue"
          :src="product.image"
          :alt="product.name"
          class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <!-- stock badge -->
      <span
        class="absolute top-2 left-2 px-2 py-0.5 rounded-full font-badge-xs text-[10px] flex items-center gap-1 shadow-sm">
        <span
          :class="[
            'w-1.5 h-1.5 rounded-full',
            stockBadgeClass.dot,
          ]"></span>
        <span :class="stockBadgeClass.text">{{ stockLabel }}</span>
      </span>

      <!-- favorite heart (UI-only, persisted to localStorage) -->
      <button
        :aria-label="fav ? 'Remove from favourites' : 'Add to favourites'"
        class="absolute top-2 right-2 z-20 w-8 h-8 rounded-full bg-surface-white/80 backdrop-blur-md flex items-center justify-center text-text-secondary hover:text-primary active:scale-90 transition-transform shadow-sm"
        @click.stop="toggleFav">
        <Icon
          name="heart"
          :size="18"
          :class="fav ? 'text-primary' : 'text-text-secondary'"
        />
      </button>
    </div>

    <div class="p-3 flex flex-col justify-between flex-1 gap-2.5">
      <div class="min-w-0">
        <h3
          class="font-headline-sm text-sm font-semibold text-text-primary line-clamp-2 group-hover:text-primary transition-colors">
          {{ product.name }}
        </h3>
        <p class="font-body-sm text-xs text-text-secondary line-clamp-1 mt-0.5">
          {{ product.description }}
        </p>
      </div>

      <div class="flex items-center justify-between gap-1 mt-auto">
        <span class="font-price-md text-lg font-bold tabular-nums text-text-primary">
          {{ naira(product.price) }}
        </span>
        <button
          :aria-label="soldOut ? `${product.name} is sold out` : `Add ${product.name}`"
          class="h-9 w-9 rounded-xl bg-primary text-on-primary flex items-center justify-center active:scale-95 transition-all shadow-sm hover:bg-orange-800"
          :class="{ 'cursor-not-allowed opacity-60': soldOut }"
          @click.stop="add"
          type="button">
          <Icon :name="soldOut ? 'block' : 'plus'" :size="20" />
        </button>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import Icon from './Icon.vue'
import ProductImage from './ProductImage.vue'
import { naira } from '../lib/format.js'
import { addToCart, openDrawer } from '../store/cart.js'
import { toast } from '../store/toast.js'
import { isFav, toggleFav } from '../store/favourites.js'

const props = defineProps({ product: { type: Object, required: true } })

const fav = computed(() => isFav(props.product.id))
const availability = computed(() =>
  props.product.stock <= 0 ? 'sold_out' : props.product.stock <= 5 ? 'low_stock' : 'in_stock'
)
const soldOut = computed(() => availability.value === 'sold_out')

const stockBadgeClass = computed(() => {
  if (availability.value === 'sold_out')
    return { dot: 'bg-text-tertiary', text: 'text-text-secondary' }
  if (availability.value === 'low_stock')
    return { dot: 'bg-amber-500', text: 'text-amber-800' }
  return { dot: 'bg-emerald-600', text: 'text-emerald-700' }
})

const stockLabel = computed(() => {
  if (availability.value === 'sold_out') return 'Sold out'
  if (availability.value === 'low_stock') return `Low stock (${props.product.stock} left)`
  return 'In stock'
})

function add() {
  const result = addToCart(props.product.id, 1)
  if (result.ok) {
    toast({ title: `${props.product.name} added to Cart`, tone: 'success', duration: 2600 })
    openDrawer()
  } else {
    toast({ title: result.reason, tone: 'error' })
  }
}
</script>
