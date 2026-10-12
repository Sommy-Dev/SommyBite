/** Formatting helpers — Naira currency, order numbers, dates. */

export function naira(value) {
  const n = Number(value) || 0
  return '₦' + n.toLocaleString('en-NG', { maximumFractionDigits: 0 })
}

export function orderNo(id) {
  return 'FD-' + String(id).padStart(5, '0')
}

/** Accepts an order object or a raw number. */
export function orderNumber(value) {
  const n =
    typeof value === 'object' && value !== null && 'number' in value
      ? value.number
      : value
  return 'FD-' + String(n).padStart(5, '0')
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-NG', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatDateTime(iso) {
  return `${formatDate(iso)}, ${formatTime(iso)}`
}

export function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  return formatDate(iso)
}

/** Delivery window promised on the confirmation screen: 45–75 min from now. */
export function deliveryWindow() {
  const now = new Date()
  const start = new Date(now.getTime() + 45 * 60000)
  const end = new Date(now.getTime() + 75 * 60000)
  const fmt = (d) =>
    d.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' })
  const sameDay = start.toDateString() === end.toDateString()
  return sameDay
    ? `Today, ${fmt(start)} – ${fmt(end)}`
    : `${start.toLocaleDateString('en-NG', { weekday: 'short' })}, ${fmt(start)} – ${fmt(end)}`
}

export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}
