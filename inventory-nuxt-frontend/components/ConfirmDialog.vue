<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })
defineProps<{ title?: string; message?: string; confirmLabel?: string; busy?: boolean }>()
const emit = defineEmits<{ confirm: [] }>()
</script>

<template>
  <ModalDialog v-model:open="open" :title="title || 'Are you sure?'">
    <p class="text-sm text-slate-600">
      {{ message || 'This action cannot be undone.' }}
    </p>
    <template #footer>
      <button type="button" class="btn-secondary" :disabled="busy" @click="open = false">
        Cancel
      </button>
      <button type="button" class="btn-danger" :disabled="busy" @click="emit('confirm')">
        <span v-if="busy" class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        {{ confirmLabel || 'Delete' }}
      </button>
    </template>
  </ModalDialog>
</template>
