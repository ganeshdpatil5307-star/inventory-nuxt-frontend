import { defineStore } from 'pinia'
import type { TokenResponse, User } from '~/types'

const TOKEN_KEY = 'inventory_token'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null as string | null,
    user: null as User | null,
    loading: false,
    initialised: false
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.token)
  },

  actions: {
    /** Restore the token from localStorage on first client-side load. */
    init() {
      if (this.initialised || !import.meta.client) return
      this.token = window.localStorage.getItem(TOKEN_KEY)
      this.initialised = true
    },

    setToken(token: string | null) {
      this.token = token
      if (import.meta.client) {
        if (token) window.localStorage.setItem(TOKEN_KEY, token)
        else window.localStorage.removeItem(TOKEN_KEY)
      }
    },

    async login(email: string, password: string) {
      const config = useRuntimeConfig()
      this.loading = true
      try {
        const data = await $fetch<TokenResponse>('/auth/login', {
          baseURL: config.public.apiBase,
          method: 'POST',
          body: { email, password }
        })
        this.setToken(data.access_token)
        await this.fetchUser()
      } finally {
        this.loading = false
      }
    },

    async fetchUser() {
      if (!this.token) return null
      const api = useApi()
      this.user = await api.get<User>('/auth/me')
      return this.user
    },

    /** Ensure we have a user object; used by the auth middleware. */
    async ensureUser() {
      this.init()
      if (!this.token) return null
      if (this.user) return this.user
      try {
        return await this.fetchUser()
      } catch {
        this.logout()
        return null
      }
    },

    logout() {
      this.setToken(null)
      this.user = null
    }
  }
})
