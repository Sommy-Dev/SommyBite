<template>
  <!-- Chef's Daily Special spotlight with a live countdown timer. -->
  <section v-if="product" class="px-4 py-2 md:px-6">
    <div
      class="bg-surface-white rounded-xl shadow-sm p-4 flex flex-col gap-3 relative overflow-hidden">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
          <span class="font-label-sm text-xs font-bold text-orange-700 uppercase tracking-wider">
            {{ label }}
          </span>
        </div>
        <div
          class="bg-orange-50 text-orange-800 px-2 py-0.5 rounded-md flex items-center gap-1 font-badge-xs text-[10px]">
          <Icon name="clock" :size="13" />
          <span class="tabular-nums font-semibold">{{ countdown }}</span>
        </div>
      </div>

      <div class="flex gap-3 items-center">
        <div class="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container relative">
          <ProductImage
            :emoji="product.emoji"
            :hue="product.hue"
            :src="product.image"
            :alt="product.name"
            class="h-full w-full"
          />
          <span
            class="absolute top-1 left-1 bg-primary text-on-primary font-badge-xs text-[10px] px-1.5 py-0.5 rounded"
            >Special</span
          >
        </div>

        <div class="flex flex-col flex-1 justify-between min-w-0">
          <div>
            <h4 class="font-headline-sm text-sm font-semibold text-text-primary truncate">
              {{ product.name }}
            </h4>
            <p class="font-body-sm text-xs text-text-secondary line-clamp-1 mt-0.5">
              {{ product.description }}
            </p>
          </div>
          <div class="flex items-center justify-between mt-2 pt-1">
            <span class="font-price-md text-lg font-bold tabular-nums text-text-primary">
              {{ naira(product.price) }}
            </span>
            <button
              :aria-label="`Add ${product.name} to cart`"
              class="bg-primary text-on-primary px-3.5 py-1.5 rounded-md hover:bg-orange-800 active:scale-95 transition-all shadow-sm flex items-center gap-1"
              @click="add"
            >
              <Icon name="plus" :size="16" />
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import Icon from './Icon.vue'
import ProductImage from './ProductImage.vue'
import { naira } from '../lib/format.js'
import { addToCart, openDrawer } from '../store/cart.js'
import { toast } from '../store/toast.js'
import { CHEF_SPECIAL } from '../config/site.js'

const props = defineProps({ product: { type: Object, required: true } })
const label = CHEF_SPECIAL.label

const countdown = ref('00:00:00')
let timer = null

function tick() {
  const now = new Date()
  const end = new Date()
  end.setHours(23, 59, 59, 0)
  const diff = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000))
  const h = String(Math.floor(diff / 3600)).padStart(2, '0')
  const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0')
  const s = String(diff % 60).padStart(2, '0')
  countdown.value = `${h}:${m}:${s} left`
}

onMounted(() => {
  tick()
  timer = setInterval(tick, 1000)
})
onBeforeUnmount(() => clearInterval(timer))

function add() {
  const result = addToCart(props.product.id, 1)
  if (result.ok) {
    toast({
      title: `${props.product.name} added to Cart`,
      tone: 'success',
      duration: 2600,
    })
    openDrawer()
  } else {
    toast({ title: result.reason, tone: 'error' })
  }
}
</script>
