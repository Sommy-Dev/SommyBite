<template>
  <div class="min-h-screen bg-page-bg">
    <a href="#main" class="skip-link">Skip to main content</a>
    <ErrorBoundary>
      <router-view />
    </ErrorBoundary>
    <Toaster />
  </div>
</template>

<script setup>
import Toaster from './components/Toaster.vue'
import ErrorBoundary from './components/ErrorBoundary.vue'
</script>
