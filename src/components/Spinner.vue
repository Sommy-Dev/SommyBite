<template>
  <span
    class="inline-flex items-center gap-2 text-sm text-gray-500"
    role="status"
    :aria-label="label"
  >
    <svg class="animate-spin" :width="size" :height="size" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path
        class="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
    <span v-if="label">{{ label }}</span>
  </span>
</template>

<script setup>
defineProps({
  size: { type: [Number, String], default: 20 },
  label: { type: String, default: '' },
})
</script>
