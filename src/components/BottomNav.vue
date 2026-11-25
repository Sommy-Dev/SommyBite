<template>
  <!-- Mobile-only bottom tab bar (Home, Shop, Orders, Contact).
       Hidden on desktop where AppHeader carries the navigation. -->
  <nav
    aria-label="Mobile"
    class="fixed inset-x-0 bottom-0 z-30 grid h-16 grid-cols-4 border-t border-border-subtle bg-white/95 backdrop-blur-xl pb-safe md:hidden"
  >
    <NavItem to="/" icon="home" label="Home" :exact="true" />
    <NavItem to="/shop" icon="grid" label="Shop" />
    <NavItem to="/orders" icon="receipt" label="Orders" />
    <NavItem to="/contact" icon="mail" label="Contact" />
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Icon from './Icon.vue'

const route = useRoute()

const NavItem = {
  props: {
    to: { type: String, required: true },
    icon: { type: String, default: 'info' },
    label: { type: String, required: true },
    exact: { type: Boolean, default: false },
  },
  setup(props) {
    const active = computed(() =>
      props.exact ? route.path === props.to : route.path.startsWith(props.to)
    )
    return { active }
  },
  template: `
    <router-link
      :to="to"
      :aria-current="active ? 'page' : undefined"
      class="flex flex-col items-center justify-center gap-1 transition-colors duration-150"
      :class="active ? 'text-primary font-semibold' : 'text-text-tertiary hover:text-text-primary'"
    >
      <Icon :name="icon" :size="22" />
      <span class="text-[11px] font-medium">{{ label }}</span>
    </router-link>
  `,
}
</script>
