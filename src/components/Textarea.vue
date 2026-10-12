<template>
  <div class="w-full">
    <label v-if="label" :for="id" class="mb-1.5 block text-sm font-medium text-gray-900">
      {{ label }}
      <span v-if="required" class="text-orange-700" aria-hidden="true">*</span>
    </label>
    <textarea
      :id="id"
      :value="modelValue"
      rows="4"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :maxlength="maxlength"
      :aria-invalid="!!error || undefined"
      :aria-describedby="error ? errorId : undefined"
      class="block w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-base text-gray-900 placeholder:text-gray-400 transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 focus:border-orange-700 focus:ring-2 focus:ring-orange-700/20"
      :class="[error && 'border-red-600 focus:border-red-600 focus:ring-red-600/20']"
      @input="$emit('update:modelValue', $event.target.value)"
      @blur="$emit('blur', $event)"
    />
    <p v-if="error" :id="errorId" class="mt-1.5 flex items-start gap-1.5 text-sm text-red-600" role="alert">
      <Icon name="exclamation-circle" :size="16" />
      <span>{{ error }}</span>
    </p>
    <p v-else-if="help" class="mt-1.5 text-sm text-gray-500">{{ help }}</p>
  </div>
</template>

<script setup>
import Icon from './Icon.vue'

defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  help: { type: String, default: '' },
  error: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  maxlength: { type: [String, Number], default: 500 },
})

defineEmits(['update:modelValue', 'blur'])

const id = `textarea-${Math.random().toString(36).slice(2, 9)}`
const errorId = `${id}-error`
</script>
