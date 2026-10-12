<template>
  <!-- Value & Trust Pillars strip, fed from site.js config -->
  <section class="px-4 py-2 md:px-6">
    <div
      class="bg-surface-white rounded-lg p-3 shadow-sm flex items-center justify-between gap-1 overflow-x-auto no-scrollbar"
    >
      <TrustPillar
        v-for="f in features"
        :key="f.title"
        :icon="f.icon"
        :title="f.title"
        :desc="f.desc"
      />
    </div>
  </section>
</template>

<script setup>
import TrustPillar from './TrustPillar.vue'
import { FEATURES } from '../config/site.js'
const features = FEATURES
</script>
