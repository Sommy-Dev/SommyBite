<template>
  <header class="sticky top-0 z-40 border-b border-gray-100 bg-white md:hidden">
    <div class="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
      <router-link to="/admin" class="flex items-center gap-2.5" aria-label="SommyBite admin home">
        <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900 text-lg font-semibold text-white">
          B
        </span>
        <span class="text-base font-semibold tracking-tight text-gray-900">Admin</span>
      </router-link>
      <div class="flex-1" />
      <Badge tone="accent" icon="shield">Administrator</Badge>
      <button
        type="button"
        :aria-expanded="menuOpen"
        aria-haspopup="menu"
        aria-label="Account menu"
        class="flex h-11 w-11 items-center justify-center rounded-md text-gray-700 transition-colors duration-150 hover:bg-gray-50"
        @click="menuOpen = !menuOpen"
      >
        <Icon name="dots" :size="22" />
      </button>
    </div>
    <!-- mobile admin nav: horizontal scroll row -->
    <nav aria-label="Admin" class="border-t border-gray-100 px-2 py-2">
      <div class="flex gap-1 overflow-x-auto">
        <router-link
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          :aria-current="isActive(link.to) ? 'page' : undefined"
          class="whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition-colors duration-150"
          :class="isActive(link.to) ? 'bg-orange-50 text-orange-700' : 'text-gray-600 hover:bg-gray-50'"
        >
          {{ link.label }}
        </router-link>
      </div>
    </nav>
    <transition name="fade">
      <div
        v-if="menuOpen"
        role="menu"
        class="absolute inset-x-0 top-16 z-50 border-b border-gray-100 bg-white px-4 py-2 shadow-lg animate-slide-in-down"
        @keydown.esc="menuOpen = false"
      >
        <router-link
          to="/"
          role="menuitem"
          class="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          @click="menuOpen = false"
        >
          <Icon name="arrow-left" :size="20" /> View storefront
        </router-link>
        <button
          type="button"
          role="menuitem"
          class="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50"
          @click="signOut"
        >
          <Icon name="logout" :size="20" /> Sign out
        </button>
        <div class="flex items-center gap-2.5 rounded-md bg-gray-50 p-3">
          <span class="flex h-9 w-9 items-center justify-center rounded-full bg-orange-50 text-sm font-semibold text-orange-700">
            {{ initials }}
          </span>
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold text-gray-900">{{ auth.user?.name }}</p>
            <p class="truncate text-sm text-gray-500">{{ auth.user?.email }}</p>
          </div>
        </div>
      </div>
    </transition>
  </header>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Icon from './Icon.vue'
import Badge from './Badge.vue'
import { auth, logout } from '../store/auth.js'
import { toast } from '../store/toast.js'

const router = useRouter()
const menuOpen = ref(false)

const links = [
  { to: '/admin', label: 'Overview' },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/orders', label: 'Orders' },
]

const initials = computed(() =>
  (auth.user?.name || 'A').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
)

function isActive(to) {
  if (to === '/admin') return router.currentRoute.value.path === '/admin'
  return router.currentRoute.value.path.startsWith(to)
}

function signOut() {
  logout()
  toast({ title: 'Signed out', message: 'Admin session ended.', duration: 2600 })
  router.push('/admin/login')
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 150ms ease-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
