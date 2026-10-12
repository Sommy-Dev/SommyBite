<template>
  <div
    class="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6"
    aria-live="polite"
  >
    <transition-group name="toast">
      <div
        v-for="t in toasts"
        :key="t.id"
        role="status"
        :class="[
          'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg bg-white p-4 shadow-lg animate-toast-in border',
          t.tone === 'success' && 'border-emerald-200',
          t.tone === 'error' && 'border-red-200',
          t.tone === 'default' && 'border-gray-200',
        ]"
      >
        <span
          :class="[
            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
            t.tone === 'success' && 'bg-emerald-50 text-emerald-600',
            t.tone === 'error' && 'bg-red-50 text-red-600',
            t.tone === 'default' && 'bg-gray-100 text-gray-500',
          ]"
        >
          <Icon
            :name="t.tone === 'success' ? 'check-circle' : t.tone === 'error' ? 'exclamation-circle' : 'info'"
            :size="18"
          />
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-gray-900">{{ t.title }}</p>
          <p v-if="t.message" class="mt-0.5 text-sm text-gray-500">{{ t.message }}</p>
          <button
            v-if="t.action"
            type="button"
            class="mt-1.5 text-sm font-semibold text-orange-700 underline-offset-2 hover:underline"
            @click="handleAction(t)"
          >
            {{ t.action.label }}
          </button>
        </div>
        <button
          type="button"
          :aria-label="`Dismiss ${t.title}`"
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors duration-150 hover:bg-gray-50 hover:text-gray-600"
          @click="dismissToast(t.id)"
        >
          <Icon name="x" :size="16" />
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { toasts, dismissToast } from '../store/toast.js'
import Icon from './Icon.vue'

function handleAction(t) {
  t.action?.onClick?.()
  dismissToast(t.id)
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 200ms ease-out;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
.toast-move {
  transition: transform 200ms ease-out;
}
</style>
