<template>
  <footer class="border-t border-border-subtle bg-surface-white mt-auto">
    <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <!-- Brand -->
        <div class="space-y-4">
          <router-link to="/" class="flex items-center gap-2.5">
            <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
              <Icon name="fire" :size="22" />
            </span>
            <span class="text-xl font-heading font-bold tracking-tight text-text-primary">{{ brand }}</span>
          </router-link>
          <p class="max-w-xs text-sm leading-relaxed text-text-secondary">{{ tagline }}</p>
          <Badge tone="promo" icon="lock">Secure checkout</Badge>
        </div>

        <!-- Quick links -->
        <nav aria-label="Footer" class="space-y-4">
          <h2 class="text-xs font-semibold uppercase tracking-wide text-text-secondary">Shop</h2>
          <ul class="space-y-2.5">
            <li><router-link to="/shop" class="text-sm text-text-secondary transition-colors hover:text-primary">Menu</router-link></li>
            <li><router-link to="/about" class="text-sm text-text-secondary hover:text-primary">Our story</router-link></li>
            <li><router-link to="/contact" class="text-sm text-text-secondary hover:text-primary">Contact</router-link></li>
            <li><router-link to="/orders" class="text-sm text-text-secondary hover:text-primary">Track order</router-link></li>
          </ul>
        </nav>

        <!-- Contact -->
        <div class="space-y-4">
          <h2 class="text-xs font-semibold uppercase tracking-wide text-text-secondary">Contact</h2>
          <ul class="space-y-3.5 text-sm text-text-secondary">
            <li class="flex items-start gap-3">
              <Icon name="phone" :size="20" class="mt-0.5 shrink-0 text-text-tertiary" />
              <span>{{ location.phone }}</span>
            </li>
            <li class="flex items-start gap-3">
              <Icon name="mail" :size="20" class="mt-0.5 shrink-0 text-text-tertiary" />
              <span>{{ location.email }}</span>
            </li>
            <li class="flex items-start gap-3">
              <Icon name="pin" :size="20" class="mt-0.5 shrink-0 text-text-tertiary" />
              <span>{{ location.address }}</span>
            </li>
            <li class="flex items-start gap-3">
              <Icon name="clock" :size="20" class="mt-0.5 shrink-0 text-text-tertiary" />
              <span>{{ location.hours }}</span>
            </li>
          </ul>
        </div>

        <!-- Payments + delivery -->
        <div class="space-y-4">
          <h2 class="text-xs font-semibold uppercase tracking-wide text-text-secondary">Payments</h2>
          <div class="flex items-center gap-2.5">
            <Badge tone="info" icon="wallet">Pay on delivery</Badge>
            <Badge tone="promo">Or card online</Badge>
          </div>
          <p class="flex items-start gap-2.5 text-sm text-text-secondary">
            <Icon name="lock" :size="18" class="mt-0.5 shrink-0 text-text-tertiary" />
            Paid with Paystack or Flutterwave. Card details never touch our servers.
          </p>
          <div class="rounded-lg bg-orange-50 px-4 py-3">
            <p class="text-sm font-semibold text-text-primary">Free delivery</p>
            <p class="mt-1 text-sm text-text-secondary">
              Orders over ₦{{ freeOver }}. ₦{{ fee }} flat under that.
            </p>
          </div>
        </div>
      </div>

      <div class="mt-10 border-t border-border-subtle pt-6 text-center text-sm text-text-tertiary">
        © {{ year }} {{ brand }}. All rights reserved. · Prices in Nigerian Naira (₦).
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'
import Icon from '../components/Icon.vue'
import Badge from '../components/Badge.vue'
import { BRAND, BRAND_TAGLINE, LOCATION } from '../config/site.js'
import { DELIVERY_FEE, FREE_DELIVERY_OVER } from '../data/catalog.js'

const brand = BRAND
const tagline = BRAND_TAGLINE
const location = LOCATION
const year = new Date().getFullYear()
const fee = computed(() => DELIVERY_FEE.toLocaleString('en-NG'))
const freeOver = computed(() => FREE_DELIVERY_OVER.toLocaleString('en-NG'))
</script>
