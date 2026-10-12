<template>
  <div class="min-h-screen bg-gray-50">
    <a href="#main" class="skip-link">Skip to main content</a>
    <AppHeader />
    <!-- pb-16 keeps content visible above the mobile bottom bar (hidden on desktop) -->
    <main
      id="main"
      tabindex="-1"
      class="mx-auto w-full max-w-7xl px-4 pb-16 py-6 sm:px-6 md:pb-0 md:py-8 lg:px-8"
    >
      <router-view />
    </main>
    <Footer />
    <BottomNav @open-cart="openCart" />
    <CartDrawer
      :model-value="cart.drawerOpen"
      @update:model-value="(v) => (cart.drawerOpen = v)"
      @browse="onBrowse"
    />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import Footer from '../components/Footer.vue'
import BottomNav from '../components/BottomNav.vue'
import CartDrawer from '../components/CartDrawer.vue'
import { cart } from '../store/cart.js'

const router = useRouter()

function openCart() {
  cart.drawerOpen = true
}

function onBrowse() {
  router.push('/shop')
}
</script>
