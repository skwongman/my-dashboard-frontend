import { useAuthStore } from '../stores/auth'

export async function setupAuthGuard(router) {
  router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()
    
    if (to.meta.requiresAuth) {
      if (authStore.token) {
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