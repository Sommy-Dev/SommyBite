<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors duration-150 select-none whitespace-nowrap',
      'min-h-11 px-5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-700 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50',
      size === 'sm' && 'min-h-11 px-4 text-sm',
      size === 'lg' && 'min-h-12 px-6 text-base',
      variants[variant],
      (disabled || loading) && 'cursor-not-allowed opacity-40',
    ]"
    :aria-busy="loading || undefined"
  >
    <Spinner v-if="loading" size="sm" :label="loadingLabel" />
    <Icon v-if="icon && !loading" :name="icon" :size="size === 'lg' ? 22 : 18" />
    <span><slot /></span>
  </button>
</template>

<script setup>
import Icon from './Icon.vue'
import Spinner from './Spinner.vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary', 'ghost', 'destructive'].includes(v),
  },
  size: { type: String, default: 'md', validator: (v) => ['sm', 'md', 'lg'].includes(v) },
  type: { type: String, default: 'button' },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  loadingLabel: { type: String, default: 'Working' },
  icon: { type: String, default: '' },
})

const variants = {
  primary: 'bg-orange-700 text-white hover:bg-orange-800 active:bg-orange-900',
  secondary: 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 active:bg-gray-100',
  ghost: 'bg-transparent text-orange-700 hover:bg-orange-50 active:bg-orange-100',
  destructive: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
}
</script>
