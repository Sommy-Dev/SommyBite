<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-3xl font-semibold tracking-tight text-text-primary md:text-4xl">Cart</h1>
      <p class="mt-1 text-base text-text-secondary">
        {{ lines.length }} item{{ lines.length === 1 ? '' : 's' }} in your cart
      </p>
    </header>

    <div v-if="loading" class="grid gap-8 lg:grid-cols-[1fr_360px]" aria-busy="true">
      <div class="space-y-4">
        <div v-for="i in 2" :key="i" class="flex gap-4 rounded-lg border border-border-subtle bg-white p-4 shadow-sm">
          <Skeleton class="aspect-square h-24 w-24 rounded-md" />
          <div class="flex-1 space-y-2">
            <Skeleton class="h-4 w-1/2" />
            <Skeleton class="h-4 w-1/3" />
            <Skeleton class="h-11 w-40" />
          </div>
        </div>
      </div>
      <Skeleton class="h-64 rounded-lg" />
    </div>

    <ErrorState
      v-else-if="error"
      title="We could not load your Cart"
      :message="error"
      @retry="checkStock"
    />

    <EmptyState
      v-else-if="!lines.length"
      title="Your Cart is empty"
      message="Browse the menu to add something tasty."
      icon="cart"
    >
      <template #action>
        <Button variant="primary" icon="grid" @click="$router.push('/shop')">Browse menu</Button>
      </template>
    </EmptyState>

    <template v-else>
      <div class="grid gap-8 lg:grid-cols-[1fr_360px]">
        <!-- Item rows -->
        <ul class="space-y-4">
          <li
            v-for="line in lines"
            :key="line.productId"
            class="flex gap-4 rounded-lg border border-border-subtle bg-white p-4 shadow-sm"
          >
            <router-link
              :to="`/product/${line.productId}`"
              class="aspect-square h-24 w-24 shrink-0 overflow-hidden rounded-md bg-surface-container-low"
              :aria-label="`View ${line.product.name}`"
            >
              <ProductImage
                :emoji="line.product.emoji"
                :hue="line.product.hue"
                :src="line.product.image"
                :alt="line.product.name"
                class="h-full w-full"
              />
            </router-link>
            <div class="flex min-w-0 flex-1 flex-col gap-2">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="truncate text-base font-semibold text-text-primary">{{ line.product.name }}</p>
                  <p class="text-sm tabular-nums text-text-secondary">{{ naira(line.product.price) }} each</p>
                </div>
                <button
                  type="button"
                  :aria-label="`Remove ${line.product.name} from cart`"
                  class="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-text-tertiary transition-colors duration-150 hover:bg-red-50 hover:text-red-600"
                  @click="remove(line)"
                >
                  <Icon name="trash" :size="20" />
                </button>
              </div>

              <p
                v-if="!line.available"
                class="flex items-center gap-1.5 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
                role="alert"
              >
                <Icon name="exclamation-circle" :size="16" />
                Sold out — it will be removed at checkout.
              </p>
              <p v-else-if="line.product.stock <= 5" class="text-sm font-medium text-amber-800">
                Only {{ line.product.stock }} left in stock.
              </p>

              <div class="mt-auto flex items-center justify-between gap-2 pt-1">
                <QuantityStepper
                  :model-value="line.qty"
                  :min="1"
                  :max="line.product.stock"
                  :label="line.product.name"
                  @update:model-value="(qty) => setQty(line.productId, qty)"
                />
                <p class="text-lg font-semibold tabular-nums text-text-primary">{{ naira(line.lineTotal) }}</p>
              </div>
            </div>
          </li>
        </ul>

        <!-- Summary -->
        <aside aria-labelledby="summary-heading" class="lg:sticky lg:top-24 lg:self-start">
          <div class="rounded-lg border border-border-subtle bg-white p-4 shadow-sm md:p-6">
            <h2 id="summary-heading" class="text-lg font-semibold tracking-tight text-text-primary">
              Order summary
            </h2>
            <dl class="mt-4 space-y-2.5 text-sm">
              <div class="flex justify-between">
                <dt class="text-text-secondary">Subtotal</dt>
                <dd class="tabular-nums text-text-primary">{{ naira(totals.subtotal) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-text-secondary">Delivery</dt>
                <dd class="tabular-nums text-text-primary">
                  {{ totals.deliveryFee === 0 ? 'Free' : naira(totals.deliveryFee) }}
                </dd>
              </div>
              <p v-if="freeDeliveryGap > 0" class="rounded-md bg-orange-50 px-3 py-2 text-sm text-orange-800">
                Add {{ naira(freeDeliveryGap) }} more for free delivery.
              </p>
              <p v-else class="rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                You have unlocked free delivery.
              </p>
              <div class="flex justify-between border-t border-border-subtle pt-2.5 text-lg font-semibold">
                <dt class="text-text-primary">Total</dt>
                <dd class="tabular-nums text-text-primary">{{ naira(totals.total) }}</dd>
              </div>
            </dl>
            <Button
              variant="primary"
              size="lg"
              class="mt-4 w-full"
              icon="arrow-right"
              :disabled="allSoldOut"
              @click="proceed"
            >
              Proceed to checkout
            </Button>
            <p v-if="allSoldOut" class="mt-2 text-center text-sm font-medium text-red-600" role="alert">
              All items in your cart are sold out. Browse the menu for alternatives.
            </p>
            <router-link
              to="/shop"
              class="mt-3 block text-center text-sm font-semibold text-orange-700 underline-offset-2 hover:underline"
            >
              Continue shopping
            </router-link>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '../../components/Icon.vue'
import Button from '../../components/Button.vue'
import Skeleton from '../../components/Skeleton.vue'
import EmptyState from '../../components/EmptyState.vue'
import ErrorState from '../../components/ErrorState.vue'
import QuantityStepper from '../../components/QuantityStepper.vue'
import ProductImage from '../../components/ProductImage.vue'
import { naira } from '../../lib/format.js'
import { cartLines, setQty, removeFromCart, restoreCartItem } from '../../store/cart.js'
import { toast } from '../../store/toast.js'
import * as api from '../../lib/api.js'

const router = useRouter()
const loading = ref(true)
const error = ref('')

const lines = computed(() => cartLines.value)
const totals = computed(() =>
  api.calculateTotals(lines.value.filter((l) => l.available).map((l) => ({ price: l.price, qty: l.qty })))
)
const freeDeliveryGap = computed(() => Math.max(0, totals.value.freeDeliveryOver - totals.value.subtotal))
const allSoldOut = computed(() => lines.value.length > 0 && lines.value.every((l) => !l.available))

// re-validate stock when the cart page opens (edge case: sold out while in cart)
async function checkStock() {
  loading.value = true
  error.value = ''
  try {
    await api.listProducts({})
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function remove(line) {
  const index = lines.value.findIndex((l) => l.productId === line.productId)
  const removed = removeFromCart(line.productId)
  if (!removed) return
  toast({
    title: `${line.product.name} removed from Cart`,
    action: {
      label: 'Undo',
      onClick: () => {
        if (restoreCartItem(removed, index)) {
          toast({ title: 'Item restored to Cart', tone: 'success', duration: 2200 })
        }
      },
    },
  })
}

function proceed() {
  router.push('/checkout')
}

onMounted(checkStock)
</script>
