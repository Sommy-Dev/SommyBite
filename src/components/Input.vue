<template>
  <div class="w-full">
    <label v-if="label" :for="inputId" class="mb-1.5 block text-sm font-medium text-gray-900">
      {{ label }}
      <span v-if="required" class="text-orange-700" aria-hidden="true">*</span>
      <span class="sr-only" v-if="required">(required)</span>
    </label>
    <div class="relative">
      <input
        :id="inputId"
        :value="modelValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :autocomplete="autocomplete"
        :inputmode="inputmode"
        :min="min"
        :max="max"
        :step="step"
        :maxlength="maxlength"
        :aria-invalid="!!error || undefined"
        :aria-describedby="describedBy || undefined"
        class="block w-full rounded-md border bg-white px-3 text-base text-gray-900 placeholder:text-gray-400 transition-colors duration-150 h-11 disabled:cursor-not-allowed disabled:opacity-40"
        :class="[
          error
            ? 'border-red-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20'
            : 'border-gray-300 focus:border-orange-700 focus:ring-2 focus:ring-orange-700/20',
          $attrs.class,
        ]"
        @input="$emit('update:modelValue', $event.target.value)"
        @blur="$emit('blur', $event)"
      />
      <button
        v-if="showPasswordToggle"
        type="button"
        :aria-label="passwordVisible ? 'Hide password' : 'Show password'"
        class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors duration-150"
        @click="passwordVisible = !passwordVisible"
      >
        <Icon :name="passwordVisible ? 'eye-off' : 'eye'" :size="20" />
      </button>
    </div>
    <p v-if="error" :id="errorId" class="mt-1.5 flex items-start gap-1.5 text-sm text-red-600" role="alert">
      <Icon name="exclamation-circle" :size="16" />
      <span>{{ error }}</span>
    </p>
    <p v-else-if="help" :id="helpId" class="mt-1.5 text-sm text-gray-500"><slot /></p>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  help: { type: String, default: '' },
  error: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  autocomplete: { type: String, default: '' },
  inputmode: { type: String, default: '' },
  min: { type: [String, Number], default: undefined },
  max: { type: [String, Number], default: undefined },
  step: { type: [String, Number], default: undefined },
  maxlength: { type: [String, Number], default: undefined },
  showPasswordToggle: { type: Boolean, default: false },
})

defineEmits(['update:modelValue', 'blur'])

const inputId = `input-${Math.random().toString(36).slice(2, 9)}`
const errorId = `${inputId}-error`
const helpId = `${inputId}-help`
const passwordVisible = ref(false)

const describedBy = computed(() => (props.error ? errorId : props.help ? helpId : undefined))
</script>
