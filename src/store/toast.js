import { reactive } from 'vue'

let seq = 0

export const toasts = reactive([])

/**
 * toast({ title, message, tone, action, duration })
 * tone: 'default' | 'success' | 'error'
 * action: { label, onClick } — used for Undo patterns.
 */
export function toast({ title, message = '', tone = 'default', action = null, duration = 5200 }) {
  const id = ++seq
  toasts.push({ id, title, message, tone, action })
  if (duration > 0) {
    setTimeout(() => dismissToast(id), duration)
  }
  return id
}

export function dismissToast(id) {
  const index = toasts.findIndex((t) => t.id === id)
  if (index !== -1) toasts.splice(index, 1)
}

/** Convenience helpers */
export function successToast(title, message = '') {
  return toast({ title, message, tone: 'success' })
}

export function errorToast(title, message = '') {
  return toast({ title, message, tone: 'error', duration: 7000 })
}
