<script setup lang="ts">
import type { DashboardSummary } from '~/types'

const api = useApi()
const { currency, number, datetime } = useFormat()

const summary = ref<DashboardSummary | null>(null)
const pending = ref(true)
const error = ref<string | null>(null)

async function load() {
  pending.value = true
  error.value = null
  try {
    summary.value = await api.get<DashboardSummary>('/dashboard/summary')
  } catch (e: any) {
    error.value = e.message
  } finally {
    pending.value = false
  }
}

const maxBreakdown = computed(() =>
  Math.max(1, ...(summary.value?.category_breakdown ?? []).map((c) => c.product_count))
)

const movementTone: Record<string, string> = {
  IN: 'bg-emerald-100 text-emerald-700',
  OUT: 'bg-rose-100 text-rose-700',
  ADJUST: 'bg-amber-100 text-amber-700'
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <LoadingState v-if="pending" label="Loading dashboard…" :rows="4" />
    <ErrorState v-else-if="error" :message="error" @retry="load" />

    <template v-else-if="summary">
      <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Products" :value="number(summary.counts.products)" />
        <StatCard label="Inventory value" :value="currency(summary.counts.inventory_value)" />
        <StatCard
          label="Low stock"
          :value="number(summary.counts.low_stock)"
          tone="warning"
          hint="At or below reorder level"
        />
        <StatCard
          label="Out of stock"
          :value="number(summary.counts.out_of_stock)"
          tone="danger"
          hint="Zero units on hand"
        />
        <StatCard label="Total units" :value="number(summary.counts.total_units)" />
        <StatCard label="Categories" :value="number(summary.counts.categories)" />
        <StatCard label="Suppliers" :value="number(summary.counts.suppliers)" />
        <StatCard label="Users" :value="number(summary.counts.users)" />
      </section>

      <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section class="card">
          <header class="flex items-center justify-between border-b border-slate-200 px-5 py-3">
            <h2 class="text-sm font-semibold text-slate-700">Low stock alerts</h2>
            <NuxtLink to="/products?low_stock=1" class="text-xs font-medium text-brand-600 hover:underline">
              View products
            </NuxtLink>
          </header>
          <EmptyState
            v-if="!summary.low_stock_products.length"
            title="Stock levels look healthy"
            description="No product is at or below its reorder level."
          />
          <ul v-else class="divide-y divide-slate-100">
            <li
              v-for="p in summary.low_stock_products"
              :key="p.id"
              class="flex items-center justify-between px-5 py-3"
            >
              <div class="min-w-0">
                <p class="truncate text-sm font-medium text-slate-800">{{ p.name }}</p>
                <p class="text-xs text-slate-400">{{ p.sku }}</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-semibold" :class="p.quantity <= 0 ? 'text-rose-600' : 'text-amber-600'">
                  {{ number(p.quantity) }}
                </p>
                <p class="text-xs text-slate-400">reorder at {{ p.reorder_level }}</p>
              </div>
            </li>
          </ul>
        </section>

        <section class="card">
          <header class="border-b border-slate-200 px-5 py-3">
            <h2 class="text-sm font-semibold text-slate-700">Products by category</h2>
          </header>
          <EmptyState v-if="!summary.category_breakdown.length" title="No products yet" />
          <ul v-else class="space-y-3 p-5">
            <li v-for="c in summary.category_breakdown" :key="`${c.category_id}-${c.category_name}`">
              <div class="mb-1 flex items-center justify-between text-sm">
                <span class="truncate text-slate-700">{{ c.category_name }}</span>
                <span class="text-slate-500">{{ c.product_count }} · {{ number(c.total_quantity) }} units</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-brand-500"
                  :style="{ width: `${Math.round((c.product_count / maxBreakdown) * 100)}%` }"
                />
              </div>
            </li>
          </ul>
        </section>
      </div>

      <section class="card overflow-hidden">
        <header class="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 class="text-sm font-semibold text-slate-700">Recent stock movements</h2>
          <NuxtLink to="/inventory" class="text-xs font-medium text-brand-600 hover:underline">
            View all
          </NuxtLink>
        </header>
        <EmptyState v-if="!summary.recent_movements.length" title="No movements recorded yet" />
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
              <tr>
                <th class="th">Product</th>
                <th class="th">Type</th>
                <th class="th">Qty</th>
                <th class="th">After</th>
                <th class="th">When</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="m in summary.recent_movements" :key="m.id">
                <td class="td">
                  <span class="font-medium text-slate-800">{{ m.product_name || '—' }}</span>
                  <span class="ml-2 text-xs text-slate-400">{{ m.product_sku }}</span>
                </td>
                <td class="td">
                  <span class="badge" :class="movementTone[m.movement_type]">{{ m.movement_type }}</span>
                </td>
                <td class="td">{{ number(m.quantity) }}</td>
                <td class="td">{{ number(m.quantity_after) }}</td>
                <td class="td text-slate-500">{{ datetime(m.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>
