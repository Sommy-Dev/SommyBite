<template>
  <div class="flex min-h-[60vh] flex-col items-center justify-center gap-4 py-20 text-center">
    <div class="flex h-20 w-20 items-center justify-center rounded-full bg-orange-50">
      <Icon name="search" :size="40" class="text-orange-700" />
    </div>
    <h1 class="text-3xl font-semibold tracking-tight text-text-primary">Page not found</h1>
    <p class="max-w-sm text-base leading-relaxed text-text-secondary">
      This page moved or never existed. Head back to the menu to keep browsing.
    </p>
    <Button variant="primary" icon="arrow-left" @click="$router.push('/')">Back to home</Button>
  </div>
</template>

<script setup>
import Icon from '../components/Icon.vue'
import Button from '../components/Button.vue'
</script>
