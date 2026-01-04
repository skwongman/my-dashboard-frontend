import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import { setupAuthGuard } from './router/auth-guard'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import { intersect } from './utils/intersect.js';

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(Antd)
app.directive('intersect', intersect);

// Initialize auth guard
setupAuthGuard(router)

app.mount('#app')