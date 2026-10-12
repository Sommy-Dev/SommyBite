<script setup>
defineOptions({ inheritAttrs: false })
</script>

<template>
  <div :class="['animate-pulse rounded-md bg-gray-100', $attrs.class]" aria-hidden="true" />
</template>
