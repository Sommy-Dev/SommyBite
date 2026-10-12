<template>
  <div class="space-y-10 md:space-y-16">
    <header class="space-y-3">
      <h1 class="text-4xl font-semibold tracking-tight text-text-primary md:text-5xl">
          About SommyBite
      </h1>
      <p class="max-w-2xl text-lg leading-relaxed text-text-secondary">
        We cook one thing well: honest Nigerian food, made fresh every morning and
        delivered while it is still hot.
      </p>
    </header>

    <div class="grid gap-8 md:grid-cols-2">
      <div class="aspect-4/3 overflow-hidden rounded-lg bg-surface-container-low shadow-sm">
        <ProductImage emoji="🍳" :hue="36" :placeholder="false" alt="Our kitchen team cooking in the morning" class="h-full w-full" />
      </div>
      <div class="aspect-4/3 overflow-hidden rounded-lg bg-surface-container-low shadow-sm">
        <ProductImage emoji="🥘" :hue="24" :placeholder="false" alt="Fresh pots of soup ready for the lunch rush" class="h-full w-full" />
      </div>
    </div>

    <section class="rounded-lg border border-border-subtle bg-white p-6 shadow-sm md:p-8" aria-labelledby="story-heading">
      <h2 id="story-heading" class="text-2xl font-semibold tracking-tight text-text-primary">Our story</h2>
      <div class="mt-4 max-w-3xl space-y-4 text-base leading-relaxed text-text-secondary">
        <p>
          SommyBite started in 2021 with a single pot of jollof and a delivery bike.
          Friends asked for seconds; neighbours asked for deliveries. The pattern never changed:
          cook in small batches, use morning-market produce, and never serve yesterday's food.
        </p>
        <p>
          Today we serve thousands of meals a week across Lagos — but every order is still
          cooked to order, sealed hot, and handed to a rider within the hour.
        </p>
      </div>
      <dl class="mt-8 grid gap-6 sm:grid-cols-3">
        <div>
          <p class="text-3xl font-semibold tabular-nums tracking-tight text-text-primary">200k+</p>
          <p class="mt-1 text-sm text-text-secondary">Meals delivered</p>
        </div>
        <div>
          <p class="text-3xl font-semibold tabular-nums tracking-tight text-text-primary">45 min</p>
          <p class="mt-1 text-sm text-text-secondary">Average delivery time</p>
        </div>
        <div>
          <p class="text-3xl font-semibold tabular-nums tracking-tight text-text-primary">4.8 / 5</p>
          <p class="mt-1 text-sm text-text-secondary">Average food rating</p>
        </div>
      </dl>
    </section>

    <section class="rounded-lg bg-orange-50 p-6 text-center md:p-10" aria-labelledby="cta-heading">
      <h2 id="cta-heading" class="text-2xl font-semibold tracking-tight text-text-primary md:text-3xl">
        Hungry now?
      </h2>
      <p class="mx-auto mt-2 max-w-md text-base leading-relaxed text-text-secondary">
        The kitchen is open. Your next favourite meal is four taps away.
      </p>
      <Button variant="primary" size="lg" icon="arrow-right" class="mt-6" @click="$router.push('/shop')">
        Browse the menu
      </Button>
    </section>
  </div>
</template>

<script setup>
import Button from '../../components/Button.vue'
import ProductImage from '../../components/ProductImage.vue'
</script>
