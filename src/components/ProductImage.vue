<template>
  <div
    :class="[
      'relative flex items-center justify-center overflow-hidden rounded-lg',
      'bg-gradient-to-br from-orange-50 to-amber-50',
      $attrs.class,
    ]"
    role="img"
    :aria-label="alt"
  >
    <span
      class="absolute inset-0 opacity-40"
      :style="{ background: `radial-gradient(circle at 30% 20%, hsl(${hue} 80% 92%), transparent 60%)` }"
      aria-hidden="true"
    />
     <span v-if="showEmoji" class="text-5xl sm:text-6xl md:text-7xl select-none" aria-hidden="true">{{ emoji }}</span>
     <img
       v-if="effectiveSrc"
       :src="effectiveSrc"
       :alt="alt"
       loading="lazy"
       decoding="async"
       class="absolute inset-0 h-full w-full object-cover"
       @error="onImgError"
     />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
defineOptions({ inheritAttrs: false })

const props = defineProps({
  emoji: { type: String, default: '🍽️' },
  hue: { type: Number, default: 28 },
  src: { type: String, default: '' },
  alt: { type: String, required: true },
  placeholder: { type: Boolean, default: true },
})

const imgOk = ref(true)
function onImgError(e) {
  imgOk.value = false
  e.target.remove()
}

const effectiveSrc = computed(() => {
  if (props.src) return props.src
  if (!props.placeholder) return ''
  const text = props.alt || props.emoji
  return `https://placehold.co/600x450.png?background=fbbf24&text=${encodeURIComponent(text)}`
})

const showEmoji = computed(() => !imgOk.value || !effectiveSrc.value)
</script>
