<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const auth = useAuthStore()
const route = useRoute()
const config = useRuntimeConfig()

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const submitting = ref(false)

async function submit() {
  error.value = null
  if (!email.value || !password.value) {
    error.value = 'Email and password are required.'
    return
  }
  submitting.value = true
  try {
    await auth.login(email.value.trim(), password.value)
    const redirect = (route.query.redirect as string) || '/'
    await navigateTo(redirect)
  } catch (e: any) {
    error.value =
      e?.data?.detail ||
      e?.message ||
      'Unable to sign in. Check your credentials and that the API is reachable.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-md">
    <div class="mb-6 text-center">
      <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
        IM
      </div>
      <h1 class="text-xl font-semibold text-slate-800">{{ config.public.appName }}</h1>
      <p class="text-sm text-slate-500">Sign in to Manage your inventory</p>
    </div>

    <form class="card space-y-4 p-6" novalidate @submit.prevent="submit">
      <div
        v-if="error"
        class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
        role="alert"
      >
        {{ error }}
      </div>

      <div>
        <label class="label" for="email">Email</label>
        <input
          id="email"
          v-model="email"
          type="email"
          autocomplete="email"
          class="input"
          placeholder="admin@example.com"
          :disabled="submitting"
          required
        >
      </div>

      <div>
        <label class="label" for="password">Password</label>
        <input
          id="password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          class="input"
          placeholder="••••••••"
          :disabled="submitting"
          required
        >
      </div>

      <button type="submit" class="btn-primary w-full" :disabled="submitting">
        <span
          v-if="submitting"
          class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
        />
        {{ submitting ? 'Signing in…' : 'Sign in' }}
      </button>

      <p class="text-center text-xs text-slate-400">
        API: {{ config.public.apiBase }}
      </p>
    </form>
  </div>
</template>
