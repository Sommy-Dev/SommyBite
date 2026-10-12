<template>
  <div class="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
    <div class="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
      <Icon :name="icon" :size="32" class="text-gray-400" />
    </div>
    <h3 class="text-lg font-semibold tracking-tight text-gray-900">{{ title }}</h3>
    <p class="max-w-sm text-sm leading-relaxed text-gray-500">{{ message }}</p>
    <div v-if="$slots.action" class="mt-2">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup>
import Icon from './Icon.vue'

defineProps({
  title: { type: String, required: true },
  message: { type: String, default: '' },
  icon: { type: String, default: 'info' },
})
</script>
