<script setup lang="ts">
const auth = useAuthStore()
const config = useRuntimeConfig()
const route = useRoute()
const sidebarOpen = ref(false)

const links = [
  { to: '/', label: 'Dashboard', icon: '▤' },
  { to: '/products', label: 'Products', icon: '▦' },
  { to: '/categories', label: 'Categories', icon: '▧' },
  { to: '/suppliers', label: 'Suppliers', icon: '▩' },
  { to: '/inventory', label: 'Stock Movements', icon: '⇅' }
]

const currentTitle = computed(
  () => links.find((l) => l.to === route.path)?.label ?? 'Inventory'
)

watch(() => route.fullPath, () => {
  sidebarOpen.value = false
})

async function handleLogout() {
  auth.logout()
  await navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen lg:flex">
    <!-- Mobile backdrop -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
      @click="sidebarOpen = false"
    />

    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white transition-transform lg:static lg:relative lg:translate-x-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex h-16 items-center gap-2 border-b border-slate-200 px-5">
        <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
          IM
        </span>
        <span class="truncate font-semibold text-slate-800">{{ config.public.appName }}</span>
      </div>

      <nav class="space-y-1 p-3">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition"
          :class="route.path === link.to
            ? 'bg-brand-50 text-brand-700'
            : 'text-slate-600 hover:bg-slate-100'"
        >
          <span class="w-4 text-center">{{ link.icon }}</span>
          {{ link.label }}
        </NuxtLink>
      </nav>

      <div class="absolute inset-x-0 bottom-0 border-t border-slate-200 p-3">
        <div class="mb-2 px-2">
          <p class="truncate text-sm font-medium text-slate-700">{{ auth.user?.full_name || '—' }}</p>
          <p class="truncate text-xs text-slate-400">{{ auth.user?.email }}</p>
        </div>
        <button type="button" class="btn-secondary w-full" @click="handleLogout">Sign out</button>
      </div>
    </aside>

    <!-- Main -->
    <div class="flex min-w-0 flex-1 flex-col">
      <header class="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
        <button
          type="button"
          class="rounded-lg border border-slate-300 p-2 text-slate-600 lg:hidden"
          aria-label="Toggle navigation"
          @click="sidebarOpen = !sidebarOpen"
        >
          ☰
        </button>
        <h1 class="truncate text-lg font-semibold text-slate-800">{{ currentTitle }}</h1>
      </header>

      <main class="flex-1 p-4 sm:p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
