<script setup lang="ts">
import type { PaginationMeta } from '~/types'

const props = defineProps<{ meta: PaginationMeta | null; disabled?: boolean }>()
const emit = defineEmits<{ 'update:page': [number]; 'update:size': [number] }>()

const from = computed(() =>
  !props.meta || props.meta.total === 0 ? 0 : (props.meta.page - 1) * props.meta.size + 1
)
const to = computed(() =>
  !props.meta ? 0 : Math.min(props.meta.page * props.meta.size, props.meta.total)
)

const pages = computed<(number | '…')[]>(() => {
  if (!props.meta) return []
  const total = props.meta.pages
  const current = props.meta.page
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const out: (number | '…')[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) out.push('…')
  for (let p = start; p <= end; p++) out.push(p)
  if (end < total - 1) out.push('…')
  out.push(total)
  return out
})
</script>

<template>
  <div
    v-if="meta"
    class="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
  >
    <p class="text-sm text-slate-500">
      Showing <span class="font-medium text-slate-700">{{ from }}</span>–<span
        class="font-medium text-slate-700"
      >{{ to }}</span>
      of <span class="font-medium text-slate-700">{{ meta.total }}</span>
    </p>

    <div class="flex flex-wrap items-center gap-2">
      <select
        class="input w-auto py-1.5 text-xs"
        :value="meta.size"
        aria-label="Rows per page"
        @change="emit('update:size', Number(($event.target as HTMLSelectElement).value))"
      >
        <option v-for="s in [10, 20, 50, 100]" :key="s" :value="s">{{ s }} / page</option>
      </select>

      <button
        type="button"
        class="btn-secondary px-3 py-1.5 text-xs"
        :disabled="disabled || !meta.has_prev"
        @click="emit('update:page', meta.page - 1)"
      >
        Prev
      </button>

      <template v-for="(p, i) in pages" :key="`${p}-${i}`">
        <span v-if="p === '…'" class="px-1 text-sm text-slate-400">…</span>
        <button
          v-else
          type="button"
          class="rounded-lg px-3 py-1.5 text-xs font-medium transition"
          :class="p === meta.page
            ? 'bg-brand-600 text-white'
            : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'"
          :disabled="disabled"
          @click="emit('update:page', p as number)"
        >
          {{ p }}
        </button>
      </template>

      <button
        type="button"
        class="btn-secondary px-3 py-1.5 text-xs"
        :disabled="disabled || !meta.has_next"
        @click="emit('update:page', meta.page + 1)"
      >
        Next
      </button>
    </div>
  </div>
</template>
