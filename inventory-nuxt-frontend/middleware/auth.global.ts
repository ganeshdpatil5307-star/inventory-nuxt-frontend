const PUBLIC_ROUTES = ['/login', '/register']

export default defineNuxtRouteMiddleware(async (to) => {
  // SSR is disabled, but guard anyway so nothing runs on the server.
  if (import.meta.server) return

  const auth = useAuthStore()
  auth.init()

  const isPublic = PUBLIC_ROUTES.includes(to.path)

  if (!auth.isAuthenticated) {
    return isPublic ? undefined : navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }

  const user = await auth.ensureUser()
  if (!user) {
    return isPublic ? undefined : navigateTo('/login')
  }

  if (isPublic) return navigateTo('/')
})
