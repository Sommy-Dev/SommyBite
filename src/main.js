import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './index.css'

const app = createApp(App)
app.use(router)

// Global safety net: any unrendered template binding or async error is logged
// (and, where possible, surfaced) instead of blanking the whole app.
app.config.errorHandler = (err, _instance, info) => {
  console.error('[Vue error]', err, info)
}

app.mount('#app')
