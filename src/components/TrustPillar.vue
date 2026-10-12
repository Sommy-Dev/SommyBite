<template>
  <div class="flex items-center gap-2 min-w-max px-2">
    <span
      class="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 text-orange-700 flex-shrink-0"
    >
      <Icon :name="icon" :size="18" />
    </span>
    <div class="flex flex-col">
      <span class="font-label-sm text-xs font-semibold text-text-primary">{{ title }}</span>
      <span class="font-body-sm text-xs text-text-tertiary">
        {{ desc }}
      </span>
    </div>
    <slot />
  </div>
</template>

<script setup>
import Icon from './Icon.vue'
const props = defineProps({
  icon: { type: String, default: 'info' },
  title: { type: String, required: true },
  desc: { type: String, default: '' },
})
</script>
