<script setup lang="ts">
const model = defineModel<string>({ default: '' })
defineProps<{ placeholder?: string }>()
</script>

<template>
  <div class="relative w-full sm:max-w-xs">
    <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">⌕</span>
    <input
      v-model="model"
      type="search"
      class="input pl-8"
      :placeholder="placeholder || 'Search…'"
      :aria-label="placeholder || 'Search'"
    >
  </div>
</template>
