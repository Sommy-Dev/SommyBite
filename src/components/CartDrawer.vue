<template>
  <Drawer
    :model-value="modelValue"
    title="Cart"
    :count="cartCount"
    @update:model-value="$emit('update:modelValue', $event)"
    @close="$emit('update:modelValue', false)"
  >
    <div v-if="cartCount === 0" class="p-4">
      <EmptyState
        title="Your Cart is empty"
        message="Browse the menu to add something tasty."
        icon="cart"
      >
        <template #action>
          <Button variant="primary" icon="grid" @click="$emit('browse')">Browse menu</Button>
        </template>
      </EmptyState>
    </div>

    <ul v-else class="divide-y divide-gray-100">
      <li v-for="line in cartLines" :key="line.productId" class="flex gap-3 p-4">
        <router-link
          :to="`/product/${line.productId}`"
          class="aspect-square h-20 w-20 shrink-0 overflow-hidden rounded-md bg-gray-100"
          :aria-label="`View ${line.product.name}`"
          @click="$emit('update:modelValue', false)"
        >
          <ProductImage
            :emoji="line.product.emoji"
            :hue="line.product.hue"
            :src="line.product.image"
            :alt="line.product.name"
            class="h-full w-full"
          />
        </router-link>
        <div class="flex min-w-0 flex-1 flex-col gap-1.5">
          <div class="flex items-start justify-between gap-2">
            <p class="truncate text-sm font-semibold text-gray-900">{{ line.product.name }}</p>
            <Button
              variant="ghost"
              size="sm"
              icon="trash"
              :aria-label="`Remove ${line.product.name} from cart`"
              @click="remove(line)"
            />
          </div>
          <p v-if="!line.available" class="flex items-center gap-1.5 text-xs font-medium text-red-600" role="alert">
            <Icon name="exclamation-circle" :size="14" />
            Sold out — removed at checkout
          </p>
          <p v-else-if="line.product.stock <= 5" class="text-xs font-medium text-amber-800">
            Only {{ line.product.stock }} left
          </p>
          <div class="mt-auto flex items-center justify-between gap-2 pt-1">
            <QuantityStepper
              v-model="line.qty"
              :max="line.product.stock"
              :min="1"
              :label="line.product.name"
              @update:model-value="(qty) => setQty(line.productId, qty)"
            />
            <p class="text-base font-semibold tabular-nums text-gray-900">{{ naira(line.lineTotal) }}</p>
          </div>
        </div>
      </li>
    </ul>

    <template #footer>
      <div v-if="cartCount > 0" class="space-y-3">
        <dl class="space-y-1.5 text-sm">
          <div class="flex justify-between">
            <dt class="text-gray-500">Subtotal</dt>
            <dd class="tabular-nums text-gray-900">{{ naira(totals.subtotal) }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-gray-500">Delivery</dt>
            <dd class="tabular-nums text-gray-900">
              {{ totals.deliveryFee === 0 ? 'Free' : naira(totals.deliveryFee) }}
            </dd>
          </div>
          <div class="flex justify-between border-t border-gray-100 pt-1.5 text-base font-semibold">
            <dt class="text-gray-900">Total</dt>
            <dd class="tabular-nums text-gray-900">{{ naira(totals.total) }}</dd>
          </div>
        </dl>
        <p v-if="totals.deliveryFee > 0 && freeDeliveryGap > 0" class="rounded-md bg-orange-50 px-3 py-2 text-sm text-orange-800">
          Add {{ naira(freeDeliveryGap) }} more for free delivery.
        </p>
        <Button
          variant="primary"
          size="lg"
          class="w-full"
          icon="arrow-right"
          :disabled="allSoldOut"
          @click="checkout"
        >
          Proceed to checkout
        </Button>
      </div>
    </template>
  </Drawer>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Drawer from './Drawer.vue'
import Button from './Button.vue'
import EmptyState from './EmptyState.vue'
import ProductImage from './ProductImage.vue'
import QuantityStepper from './QuantityStepper.vue'
import Icon from './Icon.vue'
import { naira } from '../lib/format.js'
import { cartLines, cartCount, cartTotals, setQty, removeFromCart, restoreCartItem } from '../store/cart.js'
import { toast } from '../store/toast.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'browse'])
const router = useRouter()

const lines = cartLines
const totals = cartTotals
const count = cartCount

const freeDeliveryGap = computed(() => Math.max(0, totals.value.freeDeliveryOver - totals.value.subtotal))

const allSoldOut = computed(() => lines.value.length > 0 && lines.value.every((l) => !l.available))

function remove(line) {
  const index = cartLines.value.findIndex((l) => l.productId === line.productId)
  const removed = removeFromCart(line.productId)
  if (!removed) return
  toast({
    title: `${line.product.name} removed from Cart`,
    tone: 'default',
    action: {
      label: 'Undo',
      onClick: () => {
        const restored = restoreCartItem(removed, index)
        if (restored) toast({ title: 'Item restored to Cart', tone: 'success', duration: 2200 })
      },
    },
  })
}

function checkout() {
  emit('update:modelValue', false)
  router.push('/checkout')
}
</script>
