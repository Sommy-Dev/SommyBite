<template>
  <!-- Desktop top app bar. Mobile uses the BottomNav tab bar instead. -->
  <header class="hidden md:block sticky top-0 z-30 border-b border-border-subtle bg-white/95 backdrop-blur-md">
    <div class="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:gap-4 md:px-6">
      <!-- Brand: text logo + small flame icon -->
      <router-link to="/" class="flex items-center gap-2.5" aria-label="SommyBite home">
        <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
          <Icon name="fire" :size="20" />
        </span>
        <span class="text-xl font-heading font-bold tracking-tight text-text-primary">
          {{ brand }}
        </span>
      </router-link>

      <!-- Location -->
      <div class="hidden items-center gap-1.5 text-sm text-text-secondary xl:flex">
        <Icon name="pin" :size="16" class="shrink-0 text-primary" />
        <span>{{ location?.address || 'Lagos, Nigeria' }}</span>
      </div>

      <!-- Desktop primary nav -->
      <nav aria-label="Primary" class="hidden items-center gap-1 md:flex">
        <router-link
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          :aria-current="isActive(link.to) ? 'page' : undefined"
          class="rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150"
          :class="isActive(link.to) ? 'text-primary' : 'text-text-secondary hover:text-text-primary'"
        >
          {{ link.label }}
        </router-link>
      </nav>

      <div class="flex-1" />

      <!-- Desktop search -->
      <div class="hidden w-64 lg:block">
        <SearchField v-model="searchQuery" placeholder="Search the menu" @update:model-value="onSearch" />
      </div>

      <!-- Mobile search toggle -->
      <button
        type="button"
        aria-label="Search"
        :aria-expanded="searchOpen"
        class="flex h-10 w-10 items-center justify-center rounded-md text-text-tertiary transition-colors duration-150 hover:bg-gray-100 md:hidden"
        @click="searchOpen = !searchOpen"
      >
        <Icon name="search" :size="20" />
      </button>

      <!-- Cart -->
      <button
        type="button"
        aria-label="Open cart"
        class="relative flex h-10 w-10 items-center justify-center rounded-md text-text-tertiary transition-colors duration-150 hover:bg-gray-100"
        @click="openCart"
      >
        <Icon name="cart" :size="22" />
        <span
          v-if="count > 0"
          class="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold tabular-nums text-white"
          :aria-label="`${count} items in cart`"
        >{{ count > 99 ? '99+' : count }}</span>
      </button>

      <!-- Account -->
      <div v-if="auth.user" class="relative">
        <button
          type="button"
          :aria-expanded="accountOpen"
          aria-haspopup="menu"
          class="flex h-10 items-center gap-2 rounded-md px-2 text-sm font-medium text-text-secondary transition-colors duration-150 hover:bg-gray-100"
          @click="accountOpen = !accountOpen"
        >
          <span class="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 text-sm font-semibold text-primary">
            {{ initials }}
          </span>
          <span class="hidden max-w-24 truncate sm:block">{{ auth.user.name }}</span>
          <Icon name="chevрон-down" :size="16" class="text-text-tertiary" />
        </button>
        <transition name="slide-in-down">
          <div
            v-if="accountOpen"
            role="menu"
            class="absolute right-0 mt-1 w-56 origin-top-right rounded-xl bg-white py-1 shadow-lg ring-1 ring-border-subtle"
            @keydown.esc="accountOpen = false"
          >
            <p class="border-b border-border-subtle px-4 py-2.5">
              <span class="block truncate text-sm font-semibold text-text-primary">{{ auth.user.name }}</span>
              <span class="block truncate text-sm text-text-secondary">{{ auth.user.email }}</span>
            </p>
            <router-link
              to="/orders"
              role="menuitem"
              class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary transition-colors duration-150 hover:bg-gray-100"
              @click="accountOpen = false"
            >
              <Icon name="receipt" :size="18" class="text-text-tertiary" /> My orders
            </router-link>
            <button
              type="button"
              role="menuitem"
              class="flex w-full items-center gap-2.5 rounded-md px-4 py-2.5 text-left text-sm text-text-secondary transition-colors duration-150 hover:bg-gray-100"
              @click="signOut"
            >
              <Icon name="logout" :size="18" class="text-text-tertiary" /> Sign out
            </button>
          </div>
        </transition>
      </div>
      <Button v-else variant="ghost" size="sm" @click="goAuth">Sign in</Button>
    </div>

    <!-- Mobile collapsible search -->
    <transition name="slide-in-down">
      <div v-if="searchOpen" class="border-t border-border-subtle px-4 py-3 md:hidden">
        <SearchField v-model="searchQuery" placeholder="Search the menu" @update:model-value="onSearch" />
      </div>
    </transition>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Icon from './Icon.vue'
import Button from './Button.vue'
import SearchField from './SearchField.vue'
import { cartCount, openDrawer } from '../store/cart.js'
import { auth, logout } from '../store/auth.js'
import { toast } from '../store/toast.js'
import { BRAND, BRAND_TAGLINE, LOCATION } from '../config/site.js'

const router = useRouter()
const route = useRoute()

const links = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '/orders', label: 'Orders' },
  { to: '/contact', label: 'Contact' },
]

const brand = BRAND
const location = LOCATION
const searchQuery = ref('')
const searchOpen = ref(false)
const accountOpen = ref(false)

const count = cartCount
const initials = computed(() =>
  (auth.user?.name || 'G')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
)

function isActive(to) {
  return route.path === to || (to !== '/' && route.path.startsWith(to))
}

function onSearch() {
  if (route.path !== '/shop') {
    router.push({ path: '/shop', query: { q: searchQuery.value } })
  } else {
    router.replace({ path: '/shop', query: { q: searchQuery.value } })
  }
}

function openCart() {
  openDrawer()
}

function goAuth() {
  router.push({ path: '/auth', query: { next: route.fullPath } })
}

function signOut() {
  logout()
  accountOpen.value = false
  toast({ title: 'Signed out', message: 'See you soon.', duration: 2600 })
  router.push('/')
}

function onDocClick(e) {
  if (!e.target.closest('[aria-haspopup="menu"]') && !e.target.closest('[role="menu"]')) {
    accountOpen.value = false
  }
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>
