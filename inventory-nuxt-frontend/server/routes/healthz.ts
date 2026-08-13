/**
 * Lightweight health endpoint for App Platform's health check.
 * Served by Nitro even though the app itself is client-rendered.
 */
export default defineEventHandler(() => ({
  status: 'ok',
  service: 'inventory-nuxt-frontend',
  timestamp: new Date().toISOString()
}))
