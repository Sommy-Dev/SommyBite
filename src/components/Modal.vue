<template>
  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-end justify-center bg-gray-900/50 p-4 sm:items-center"
        @mousedown.self="close"
      >
        <div
          ref="panel"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
          class="w-full max-w-lg rounded-lg bg-white shadow-lg animate-fade-in"
          @keydown.esc="close"
        >
          <div class="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-4">
            <h2 class="text-lg font-semibold tracking-tight text-gray-900">{{ title }}</h2>
            <button
              type="button"
              aria-label="Close dialog"
              class="flex h-11 w-11 items-center justify-center rounded-md text-gray-400 transition-colors duration-150 hover:bg-gray-50 hover:text-gray-600"
              @click="close"
            >
              <Icon name="x" :size="20" />
            </button>
          </div>
          <div class="px-6 py-4">
            <slot />
          </div>
          <div v-if="$slots.footer" class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end border-t border-gray-100 px-6 py-4">
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
  title: { type: String, required: true },
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
      const first = panel.value?.querySelector('button, input, select, textarea, [tabindex]')
      first?.focus()
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
