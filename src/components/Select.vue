<template>
  <div class="w-full">
    <label v-if="label" :for="selectId" class="mb-1.5 block text-sm font-medium text-gray-900">
      {{ label }}
      <span v-if="required" class="text-orange-700" aria-hidden="true">*</span>
    </label>
    <div class="relative">
      <select
        :id="selectId"
        :value="modelValue"
        :disabled="disabled"
        :required="required"
        :aria-invalid="!!error || undefined"
        :aria-describedby="error ? errorId : undefined"
        class="block w-full appearance-none rounded-md border bg-white pl-3 pr-10 text-base text-gray-900 transition-colors duration-150 h-11 disabled:cursor-not-allowed disabled:opacity-40"
        :class="[
          error ? 'border-red-600' : 'border-gray-300 focus:border-orange-700',
          'focus:ring-2 focus:ring-orange-700/20',
        ]"
        @change="$emit('update:modelValue', $event.target.value)"
        @blur="$emit('blur', $event)"
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <option v-for="option in options" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
        <slot />
      </select>
      <Icon name="chevron-down" :size="18" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
    </div>
    <p v-if="error" :id="errorId" class="mt-1.5 flex items-start gap-1.5 text-sm text-red-600" role="alert">
      <Icon name="exclamation-circle" :size="16" />
      <span>{{ error }}</span>
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Icon from './Icon.vue'

defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  options: { type: Array, default: () => [] },
  error: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
})

defineEmits(['update:modelValue', 'blur'])

const selectId = `select-${Math.random().toString(36).slice(2, 9)}`
const errorId = `${selectId}-error`
const _ = computed(() => null)
</script>
