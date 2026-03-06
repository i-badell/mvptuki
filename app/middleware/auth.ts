// Redirect unauthenticated users to /login.
// Public routes listed in exclude don't need this guard.
export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()
  const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/confirm']

  if (!user.value && !publicRoutes.includes(to.path)) {
    return navigateTo('/login')
  }
})
