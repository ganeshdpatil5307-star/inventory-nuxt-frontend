<script setup lang="ts">
defineProps<{ title?: string; description?: string; actionLabel?: string }>()
defineEmits<{ action: [] }>()
</script>

<template>
  <div class="flex flex-col items-center gap-3 p-10 text-center">
    <div class="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-400">
      ∅
    </div>
    <div>
      <p class="font-semibold text-slate-800">{{ title || 'Nothing here yet' }}</p>
      <p class="mt-1 max-w-md text-sm text-slate-500">
        {{ description || 'Try adjusting your search, or create the first record.' }}
      </p>
    </div>
    <button v-if="actionLabel" type="button" class="btn-primary" @click="$emit('action')">
      {{ actionLabel }}
    </button>
  </div>
</template>
