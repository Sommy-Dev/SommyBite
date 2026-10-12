<template>
  <!-- Mobile-only bottom tab bar (Home, Shop, Cart, Orders).
       Hidden on desktop where AppHeader carries the navigation. -->
  <nav
    aria-label="Mobile"
    class="fixed inset-x-0 bottom-0 z-30 grid h-16 grid-cols-4 border-t border-border-subtle bg-surface-white/95 backdrop-blur-xl pb-safe md:hidden"
  >
    <NavItem to="/" icon="home" label="Home" :exact="true" />
    <NavItem to="/shop" icon="grid" label="Shop" />

    <button
      type="button"
      aria-label="Open cart"
      class="relative flex flex-col items-center justify-center gap-1 text-text-tertiary transition-colors duration-150 hover:text-primary active:scale-95"
      @click="$emit('open-cart')"
    >
      <span class="relative">
        <Icon name="cart" :size="22" />
        <span
          v-if="count > 0"
          class="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-0.5 text-[10px] font-semibold tabular-nums text-white"
        >{{ count > 99 ? '99+' : count }}</span>
      </span>
      <span class="text-[11px] font-medium">Cart</span>
    </button>

    <NavItem to="/orders" icon="receipt" label="Orders" />
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Icon from './Icon.vue'
import { cartCount } from '../store/cart.js'

const count = computed(() => cartCount.value)
defineEmits(['open-cart'])

const NavItem = {
  props: {
    to: { type: String, required: true },
    icon: { type: String, default: 'info' },
    label: { type: String, required: true },
    exact: { type: Boolean, default: false },
  },
  setup(props) {
    const route = useRoute()
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
