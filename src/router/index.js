import { createRouter, createWebHashHistory  } from 'vue-router'
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import {useAuthStore} from '../stores/auth'
import Register from '../views/Register.vue'  // Make sure this import exists

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Login  // Updated from 'Register' to 'Login' in order to prevent for registration temporarily
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes
})

// Auth guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  if (to.path === '/login' && authStore.isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router