<template>
  <label class="flex items-center gap-2 cursor-pointer">
    <input
      type="checkbox"
      class="accent-orange-700 w-4 h-4 rounded"
      :checked="modelValue"
      :aria-label="label"
      @change="$emit('update:modelValue', $event.target.checked)"
    />
    <span class="font-label-sm text-sm text-text-secondary">{{ label }}</span>
  </label>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  label: { type: String, required: true },
})
defineEmits(['update:modelValue'])
</script>
