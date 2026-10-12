<template>
  <button
    type="button"
    role="switch"
    :aria-checked="String(modelValue)"
    :aria-label="label"
    :disabled="disabled"
    :class="[
      'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-150',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-700 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50',
      modelValue ? 'bg-orange-700' : 'bg-gray-200',
      disabled && 'cursor-not-allowed opacity-40',
    ]"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <span
      :class="[
        'inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-150',
        modelValue ? 'translate-x-6' : 'translate-x-1',
      ]"
    />
  </button>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  label: { type: String, default: 'Toggle' },
  disabled: { type: Boolean, default: false },
})

defineEmits(['update:modelValue'])
</script>
