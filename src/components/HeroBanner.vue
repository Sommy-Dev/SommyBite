<template>
  <!-- Promotional Hero Banner: SommyBite + SOMMY20 promo -->
  <section class="px-4 pt-2 pb-3">
    <div
      class="relative w-full rounded-2xl overflow-hidden bg-primary text-on-primary shadow-sm flex flex-col justify-end p-5 min-h-[220px]"
    >
      <img
        :src="heroImage"
        alt="Hot jollof, grills and drinks spread"
        class="absolute inset-0 h-full w-full object-cover"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent"></div>
      <div class="relative z-10 flex flex-col gap-2">
        <div
          class="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full w-fit"
        >
          <Icon name="fire" :size="14" />
          <span class="font-badge-xs text-xs font-semibold uppercase tracking-wide">Code: {{ promoCode }}</span>
        </div>
        <h2 class="font-heading text-2xl font-extrabold text-surface-white leading-tight md:text-3xl">
          {{ headline }}
        </h2>
        <p class="font-body-sm text-white/90 mt-0.5 max-w-md">
          {{ subtext }}
        </p>
        <div class="pt-1">
          <router-link
            :to="{ path: '/shop' }"
            class="inline-flex items-center justify-center gap-2 bg-primary text-on-primary font-label-md font-semibold px-5 py-2.5 rounded-md shadow active:scale-95 transition-transform hover:bg-orange-800"
          >
            <span>Order Now</span>
            <Icon name="arrow-right" :size="16" />
          </router-link>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import Icon from './Icon.vue'
import {
  PROMO_CODE,
  HERO_IMAGE,
  HERO_HEADLINE,
  HERO_SUBTEXT,
} from '../config/site.js'

const promoCode = PROMO_CODE
const heroImage = HERO_IMAGE
const headline = HERO_HEADLINE
const subtext = HERO_SUBTEXT
</script>
