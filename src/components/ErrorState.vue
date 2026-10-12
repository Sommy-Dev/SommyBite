<template>
  <div
    class="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-200 px-6 py-14 text-center"
    role="alert"
  >
    <div class="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
      <Icon name="exclamation-triangle" :size="32" class="text-red-600" />
    </div>
    <h3 class="text-lg font-semibold tracking-tight text-gray-900">{{ title }}</h3>
    <p class="max-w-sm text-sm leading-relaxed text-gray-500">{{ message }}</p>
    <div class="mt-2">
      <Button variant="secondary" icon="refresh" @click="$emit('retry')">Try again</Button>
    </div>
  </div>
</template>

<script setup>
import Icon from './Icon.vue'
import Button from './Button.vue'

defineProps({
  title: { type: String, default: 'Something went wrong' },
  message: {
    type: String,
    default: 'We could not load this right now. Your data is safe — try again in a moment.',
  },
})

defineEmits(['retry'])
</script>
