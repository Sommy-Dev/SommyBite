<template>
  <div
    class="inline-flex items-stretch rounded-md border border-gray-300 bg-white"
    role="group"
    :aria-label="label"
  >
    <button
      type="button"
      :disabled="disabled || minReached"
      :aria-label="`Decrease ${label}`"
      class="flex h-11 w-11 items-center justify-center rounded-l-md text-gray-700 transition-colors duration-150 hover:bg-gray-50 active:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-700 disabled:cursor-not-allowed disabled:opacity-40"
      @click="step(-1)"
    >
      <Icon name="minus" :size="18" />
    </button>
    <output
      class="flex h-11 min-w-12 items-center justify-center border-x border-gray-200 px-2 text-base font-semibold tabular-nums text-gray-900"
      :aria-live="'polite'"
      :aria-label="`${label}: ${modelValue}`"
    >
      {{ modelValue }}
    </output>
    <button
      type="button"
      :disabled="disabled || maxReached"
      :aria-label="`Increase ${label}`"
      class="flex h-11 w-11 items-center justify-center rounded-r-md text-gray-700 transition-colors duration-150 hover:bg-gray-50 active:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-700 disabled:cursor-not-allowed disabled:opacity-40"
      @click="step(1)"
    >
      <Icon name="plus" :size="18" />
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  modelValue: { type: Number, default: 1 },
  min: { type: Number, default: 1 },
  max: { type: Number, default: 99 },
  label: { type: String, default: 'Quantity' },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const minReached = computed(() => props.modelValue <= props.min)
const maxReached = computed(() => props.modelValue >= props.max)

function step(dir) {
  const next = Math.min(props.max, Math.max(props.min, props.modelValue + dir))
  if (next !== props.modelValue) emit('update:modelValue', next)
}
</script>
