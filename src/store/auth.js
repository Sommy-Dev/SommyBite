import { reactive, computed } from 'vue'
import * as api from '../lib/api.js'

export const auth = reactive({
  user: api.currentUser(),
  ready: true,
})

export const isAuthenticated = computed(() => !!auth.user)
export const isAdmin = computed(() => auth.user?.role === 'admin')

export async function login(email, password) {
  const user = await api.login(email, password)
  auth.user = user
  return user
}

export async function register(name, email, password) {
  const user = await api.register(name, email, password)
  auth.user = user
  return user
}

export function logout() {
  api.logout()
  auth.user = null
}

/** Save contact + address to the user profile so checkout can prefill. */
export async function saveDeliveryProfile(id, fields) {
  const user = await api.updateProfile(id, fields)
  if (auth.user && auth.user.id === id) auth.user = user
  return user
}
