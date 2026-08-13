<script setup lang="ts">
defineProps<{ message?: string | null; title?: string }>()
defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="flex flex-col items-center gap-3 p-8 text-center">
    <div class="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-2xl text-rose-600">
      !
    </div>
    <div>
      <p class="font-semibold text-slate-800">{{ title || 'Something went wrong' }}</p>
      <p class="mt-1 max-w-md text-sm text-slate-500">
        {{ message || 'The request could not be completed.' }}
      </p>
    </div>
    <button type="button" class="btn-secondary" @click="$emit('retry')">Try again</button>
  </div>
</template>
