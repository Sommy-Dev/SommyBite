<template>
  <button
    type="button"
    :aria-pressed="String(active)"
    :class="[
      'flex-shrink-0 rounded-full px-4 py-2 font-label-sm text-sm font-medium transition-all duration-150',
      active
        ? 'bg-primary text-on-primary shadow-sm'
        : 'bg-surface-container-low text-text-secondary hover:text-text-primary shadow-sm hover:bg-surface-container',
      disabled && 'cursor-not-allowed opacity-40',
    ]"
    @click="emit('select')">
    <slot />
  </button>
</template>

<script setup>
defineProps({
  active: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})
defineEmits(['select'])
</script>
