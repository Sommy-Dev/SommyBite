<template>
  <div :class="['bg-white rounded-lg border border-gray-100 shadow-sm', padding, $attrs.class]">
    <slot />
  </div>
</template>

<script setup>
defineOptions({ inheritAttrs: false })

defineProps({
  padding: { type: String, default: 'p-4 md:p-6' },
})
</script>
