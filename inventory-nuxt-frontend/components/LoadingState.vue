<script setup lang="ts">
withDefaults(defineProps<{ label?: string; rows?: number }>(), {
  label: 'Loading…',
  rows: 5
})
</script>

<template>
  <div class="p-6" role="status" :aria-label="label">
    <div class="mb-4 flex items-center gap-2 text-sm text-slate-500">
      <span class="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
      {{ label }}
    </div>
    <div class="space-y-3">
      <div v-for="i in rows" :key="i" class="h-9 animate-pulse rounded-lg bg-slate-100" />
    </div>
  </div>
</template>
