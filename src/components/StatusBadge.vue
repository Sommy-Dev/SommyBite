<template>
  <Badge :tone="meta.tone" :icon="meta.icon">
    {{ meta.label }}
  </Badge>
</template>

<script setup>
import Badge from './Badge.vue'

/**
 * Order + product availability statuses.
 * Every status pairs colour with a text label and icon (never colour alone).
 */
const META = {
  in_stock: { label: 'In stock', tone: 'success', icon: 'check-circle' },
  low_stock: { label: 'Low stock', tone: 'warning', icon: 'warning' },
  sold_out: { label: 'Sold out', tone: 'neutral', icon: 'x' },
  pending: { label: 'Pending', tone: 'warning', icon: 'clock' },
  paid: { label: 'Paid', tone: 'accent', icon: 'check-badge' },
  preparing: { label: 'Preparing', tone: 'warning', icon: 'fire' },
  out_for_delivery: { label: 'Out for delivery', tone: 'info', icon: 'truck' },
  delivered: { label: 'Delivered', tone: 'success', icon: 'check-circle' },
  cancelled: { label: 'Cancelled', tone: 'danger', icon: 'x' },
  verifying: { label: 'Verifying payment', tone: 'info', icon: 'refresh' },
  failed: { label: 'Payment failed', tone: 'danger', icon: 'exclamation-circle' },
  refunded: { label: 'Refunded', tone: 'neutral', icon: 'refresh' },
  void: { label: 'Void', tone: 'neutral', icon: 'x' },
}

const props = defineProps({
  status: { type: String, required: true },
})

const meta = META[props.status] || { label: props.status, tone: 'neutral', icon: 'info' }
</script>
