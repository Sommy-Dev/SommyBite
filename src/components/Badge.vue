<template>
  <span
    :class="[
      'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap',
      tones[tone],
    ]"
  >
    <Icon v-if="icon" :name="icon" :size="14" />
    <slot />
  </span>
</template>

<script setup>
import Icon from './Icon.vue'

defineProps({
  tone: {
    type: String,
    default: 'neutral',
    validator: (v) => ['neutral', 'success', 'warning', 'danger', 'info', 'promo', 'accent'].includes(v),
  },
  icon: { type: String, default: '' },
})

const tones = {
  neutral: 'bg-gray-100 text-gray-700',
  success: 'bg-emerald-50 text-emerald-800',
  warning: 'bg-amber-50 text-amber-800',
  danger: 'bg-red-50 text-red-700',
  info: 'bg-sky-50 text-sky-800',
  // promo: amber-100 background per spec; amber-900 text keeps 4.5:1 contrast
  promo: 'bg-amber-100 text-amber-900',
  accent: 'bg-orange-50 text-orange-700',
}
</script>
