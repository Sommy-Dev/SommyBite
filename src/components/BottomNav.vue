<template>
  <!-- Mobile-only bottom tab bar (Home, Shop, Orders, Contact).
       Hidden on desktop where AppHeader carries the navigation. -->
  <nav
    aria-label="Mobile"
    class="fixed bottom-0 left-0 right-0 z-50 grid h-16 grid-cols-4 border-t border-gray-200 bg-white md:hidden"
  >
    <router-link
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      :aria-current="isActive(item) ? 'page' : undefined"
      class="flex flex-col items-center justify-center gap-1 transition-colors duration-150"
      :class="isActive(item) ? 'text-orange-700 font-semibold' : 'text-gray-600 hover:text-orange-700'"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="shrink-0"
      >
        <path :d="ICONS[item.icon]" />
      </svg>
      <span class="text-[11px] font-medium">{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

const ICONS = {
  home: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75',
  grid: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z',
  receipt: 'M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z',
  mail: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75',
}

const items = [
  { to: '/', label: 'Home', icon: 'home', exact: true },
  { to: '/shop', label: 'Shop', icon: 'grid' },
  { to: '/orders', label: 'Orders', icon: 'receipt' },
  { to: '/contact', label: 'Contact', icon: 'mail' },
]

function isActive(item) {
  return item.exact ? route.path === item.to : route.path.startsWith(item.to)
}
</script>