<template>
  <form role="search" class="relative w-full" @submit.prevent="submit">
    <label :for="id" class="sr-only">Search</label>
    <Icon
      name="search"
      :size="20"
      class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
    />
    <input
      :id="id"
      :value="modelValue"
      type="search"
      :placeholder="placeholder"
      autocomplete="off"
      class="h-11 w-full rounded-md border border-gray-300 bg-white pl-10 pr-10 text-base text-gray-900 placeholder:text-gray-400 transition-colors duration-150 focus:border-orange-700 focus:ring-2 focus:ring-orange-700/20"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <button
      v-if="modelValue"
      type="button"
      aria-label="Clear search"
      class="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-600"
      @click="$emit('update:modelValue', '')"
    >
      <Icon name="x" :size="16" />
    </button>
  </form>
</template>

<script setup>
import Icon from './Icon.vue'

defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Search the menu' },
})

defineEmits(['update:modelValue'])

const id = `search-${Math.random().toString(36).slice(2, 9)}`

function submit() {
  /* search is live; submit is a no-op for keyboard users */
}
</script>
