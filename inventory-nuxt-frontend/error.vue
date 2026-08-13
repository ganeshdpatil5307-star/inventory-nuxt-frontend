<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps<{ error: NuxtError }>()
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-50 p-6">
    <div class="card max-w-md p-8 text-center">
      <p class="text-4xl font-bold text-brand-600">{{ error?.statusCode || 500 }}</p>
      <h1 class="mt-2 text-lg font-semibold text-slate-800">Something went wrong</h1>
      <p class="mt-2 text-sm text-slate-500">
        {{ error?.statusMessage || error?.message || 'An unexpected error occurred.' }}
      </p>
      <button type="button" class="btn-primary mt-6" @click="clearError({ redirect: '/' })">
        Back to dashboard
      </button>
    </div>
  </div>
</template>
