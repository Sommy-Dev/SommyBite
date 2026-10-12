<template>
  <button
    type="button"
    :aria-pressed="String(modelValue)"
    :disabled="disabled"
    :class="[
      'inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors duration-150',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-700 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50',
      modelValue
        ? 'border-orange-700 bg-orange-700 text-white'
        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100',
      disabled && 'cursor-not-allowed opacity-40',
    ]"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <slot />
  </button>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

defineEmits(['update:modelValue'])
</script>
