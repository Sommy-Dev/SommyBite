<template>
  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 bg-gray-900/50"
        @mousedown.self="close"
      >
        <div
          ref="panel"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
          :class="[
            'fixed inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-lg animate-slide-in-right transition-all duration-200 ease-out',
          ]"
          @keydown.esc="close"
        >
          <div class="flex items-center justify-between gap-4 border-b border-gray-100 px-4 py-4">
            <h2 class="flex items-center gap-2 text-lg font-semibold tracking-tight text-gray-900">
              {{ title }}
              <span
                v-if="count !== undefined"
                class="inline-flex min-w-6 items-center justify-center rounded-full bg-orange-700 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-white"
              >
                {{ count }}
              </span>
            </h2>
            <button
              type="button"
              aria-label="Close cart"
              class="flex h-11 w-11 items-center justify-center rounded-md text-gray-400 transition-colors duration-150 hover:bg-gray-50 hover:text-gray-600"
              @click="close"
            >
              <Icon name="x" :size="20" />
            </button>
          </div>
          <div class="flex-1 overflow-y-auto">
            <slot />
          </div>
          <div v-if="$slots.footer" class="border-t border-gray-100 p-4">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: 'Cart' },
  count: { type: Number, default: undefined },
})

const emit = defineEmits(['update:modelValue', 'close'])
const panel = ref(null)
let lastFocus = null

function close() {
  emit('update:modelValue', false)
  emit('close')
}

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      lastFocus = document.activeElement
      document.body.style.overflow = 'hidden'
      await nextTick()
      panel.value?.querySelector('button')?.focus()
    } else {
      document.body.style.overflow = ''
      lastFocus?.focus?.()
    }
  }
)
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms ease-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
