import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initAuth } from './store/auth.js'
import './index.css'

const app = createApp(App)
app.use(router)

// Global safety net: any unrendered template binding or async error is logged
// (and, where possible, surfaced) instead of blanking the whole app.
app.config.errorHandler = (err, _instance, info) => {
  console.error('[Vue error]', err, info)
}

// Restore the Supabase session (if any) before the first route resolves, so
// guarded pages don't bounce to /auth while auth.user is still being loaded.
initAuth().finally(() => app.mount('#app'))
