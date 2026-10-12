<template>
  <ol class="flex items-start" :aria-label="ariaLabel">
    <li
      v-for="(step, i) in steps"
      :key="step"
      class="flex items-center"
      :class="i < steps.length - 1 && 'flex-1'"
      :aria-current="i === current ? 'step' : undefined"
    >
      <div class="flex flex-col items-center gap-1.5">
        <span
          :class="[
            'flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors duration-150',
            i < current
              ? 'border-emerald-600 bg-emerald-600 text-white'
              : i === current
                ? 'border-orange-700 bg-white text-orange-700'
                : 'border-gray-200 bg-white text-gray-400',
          ]"
        >
          <Icon v-if="i < current" name="check" :size="16" />
          <span v-else class="tabular-nums">{{ i + 1 }}</span>
        </span>
        <span
          :class="[
            'text-xs font-medium whitespace-nowrap',
            i === current ? 'text-gray-900' : 'text-gray-500',
          ]"
        >
          {{ step }}
        </span>
      </div>
      <span
        v-if="i < steps.length - 1"
        :class="['mx-2 mt-[-24px] h-0.5 flex-1 md:mx-4', i < current ? 'bg-emerald-600' : 'bg-gray-200']"
        aria-hidden="true"
      />
    </li>
  </ol>
</template>

<script setup>
import Icon from './Icon.vue'

defineProps({
  steps: { type: Array, required: true },
  current: { type: Number, default: 0 },
  ariaLabel: { type: String, default: 'Checkout progress' },
})
</script>
