<template>
  <!--
    Error boundary: if any child component (header, page, etc.) throws during
    render, show a friendly fallback instead of crashing the whole app to a
    blank page. The rest of the layout (skip link, toaster) stays intact.
  -->
  <div>
    <slot v-if="!hasError" />
    <div
      v-else
      class="flex min-h-[60vh] flex-col items-center justify-center gap-4 py-12 text-center"
    >
      <div class="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <Icon name="exclamation-triangle" :size="32" class="text-red-600" />
      </div>
      <h2 class="text-2xl font-semibold text-text-primary">Something went wrong</h2>
      <p class="max-w-md text-sm text-text-secondary">
        {{ message }}
      </p>
      <Button variant="primary" @click="reset">Reload</Button>
    </div>
  </div>
</template>

<script>
import Icon from './Icon.vue'
import Button from './Button.vue'

export default {
  name: 'ErrorBoundary',
  components: { Icon, Button },
  data() {
    return {
      hasError: false,
      message: '',
    }
  },
  methods: {
    reset() {
      this.hasError = false
      this.message = ''
      // Hard reload so the previously-failed subtree can mount cleanly.
      window.location.reload()
    },
  },
  errorCaptured(err) {
    this.hasError = true
    this.message =
      (err && err.message) || typeof err === 'string' ? (err.message || err) : 'A rendering error occurred.'
    console.error('[ErrorBoundary]', err)
    return false
  },
}
</script>
