/** Favourites (wishlist) state, persisted to localStorage. UI-only. */
import { reactive } from 'vue'

const KEY = 'sommybite_fav'

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persist(ids) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids))
  } catch {
    /* private mode — ignore */
  }
}

export const favState = reactive({ ids: load() })

export function isFav(id) {
  return favState.ids.includes(id)
}

export function toggleFav(id) {
  const i = favState.ids.indexOf(id)
  if (i >= 0) favState.ids.splice(i, 1)
  else favState.ids.push(id)
  persist(favState.ids)
}
