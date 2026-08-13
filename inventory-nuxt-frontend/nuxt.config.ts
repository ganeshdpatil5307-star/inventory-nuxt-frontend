// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',

  // Client-rendered SPA: the JWT lives in the browser, so there is no value in
  // server-rendering authenticated pages. The Nitro node server still serves the
  // app, which gives App Platform a real start command and a health endpoint.
  ssr: false,

  devtools: { enabled: false },

  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],

  css: ['~/assets/css/tailwind.css'],

  runtimeConfig: {
    public: {
      // Override in production with NUXT_PUBLIC_API_BASE
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1',
      appName: process.env.NUXT_PUBLIC_APP_NAME || 'Inventory Manager'
    }
  },

  nitro: {
    preset: process.env.NITRO_PRESET || 'node-server'
  },

  app: {
    head: {
      title: 'Inventory manager',
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Inventory Management System' }
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }]
    }
  },

  typescript: {
    strict: true,
    shim: false
  }
})
