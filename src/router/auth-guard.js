import { useAuthStore } from '../stores/auth'

export async function setupAuthGuard(router) {
  router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()
    
    // If trying to access login page and already authenticated, redirect to dashboard
    if (to.path === '/login' && authStore.isAuthenticated) {
      next('/dashboard')
      return
    }
    
    // For all other routes requiring authentication
    if (to.meta.requiresAuth) {
      if (authStore.isAuthenticated) {
        // If we have a token but no user data, fetch it
        if (!authStore.user) {
          try {
            await authStore.fetchUser()
            next()
          } catch (error) {
            authStore.logout()
            next('/login')
          }
        } else {
          next()
        }
      } else {
        next('/login')
      }
    } else {
      next()
    }
  })
}