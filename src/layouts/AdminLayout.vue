<template>
  <div class="min-h-screen bg-gray-50">
    <AdminNavbar />
    <div class="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 md:px-6">
      <!-- Sidebar: compact, data-dense admin nav -->
      <aside
        aria-label="Admin"
        class="hidden w-56 shrink-0 md:block"
      >
        <div class="sticky top-6 flex flex-col gap-1 rounded-lg border border-gray-100 bg-white p-3 shadow-sm">
          <router-link
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            :aria-current="isActive(link.to) ? 'page' : undefined"
            class="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-150"
            :class="isActive(link.to) ? 'bg-orange-50 text-orange-700' : 'text-gray-700 hover:bg-gray-50'"
          >
            <Icon :name="link.icon" :size="20" />
            {{ link.label }}
          </router-link>
          <div class="mt-4 border-t border-gray-100 pt-3">
            <router-link to="/" class="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-gray-50">
              <Icon name="arrow-left" :size="20" /> View storefront
            </router-link>
            <button
              type="button"
              class="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-gray-50"
              @click="signOut"
            >
              <Icon name="logout" :size="20" /> Sign out
            </button>
          </div>
          <div class="mt-3 flex items-center gap-2.5 rounded-md bg-gray-50 p-3">
            <span class="flex h-9 w-9 items-center justify-center rounded-full bg-orange-50 text-sm font-semibold text-orange-700">
              {{ initials }}
            </span>
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-gray-900">{{ auth.user?.name }}</p>
              <Badge tone="accent" icon="shield">Administrator</Badge>
            </div>
          </div>
        </div>
      </aside>

      <div class="min-w-0 flex-1">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '../components/Icon.vue'
import Badge from '../components/Badge.vue'
import AdminNavbar from '../components/AdminNavbar.vue'
import { auth, logout } from '../store/auth.js'
import { toast } from '../store/toast.js'

const router = useRouter()

const links = [
  { to: '/admin', label: 'Overview', icon: 'grid', exact: true },
  { to: '/admin/products', label: 'Products', icon: 'boxes' },
  { to: '/admin/categories', label: 'Categories', icon: 'tag' },
  { to: '/admin/orders', label: 'Orders', icon: 'receipt' },
]

const initials = computed(() =>
  (auth.user?.name || 'A')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
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
