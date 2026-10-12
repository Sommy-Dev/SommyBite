<template>
  <section class="px-4 py-3" aria-label="Categories">
    <div class="mb-2 flex items-center justify-between">
      <h3 class="font-headline-sm text-base font-semibold text-text-primary">{{ title }}</h3>
      <router-link
        v-if="showSeeAll"
        :to="{ path: '/shop' }"
        class="font-label-sm text-sm font-medium text-orange-700">See all</router-link>
    </div>
    <div class="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
      <CategoryChip
        v-for="c in chips"
        :key="c.id"
        :category="c"
        :active="active === c.id"
        @select="onSelect(c.id)">
        {{ c.name }}
      </CategoryChip>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import CategoryChip from './CategoryChip.vue'

const props = defineProps({
  title: { type: String, default: 'Categories' },
  categories: { type: Array, default: () => [] },
  modelValue: { default: '' },
  showSeeAll: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue'])
const active = computed(() => props.modelValue)
const chips = computed(() => [{ id: '', name: 'All Dishes' }, ...props.categories])

function onSelect(id) {
  emit('update:modelValue', id)
}
</script>
