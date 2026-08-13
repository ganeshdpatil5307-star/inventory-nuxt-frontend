<script setup lang="ts">
import type { MovementType, Page, Product, StockMovement } from '~/types'

const api = useApi()
const toast = useToast()
const { number, datetime } = useFormat()

const items = ref<StockMovement[]>([])
const meta = ref<Page<StockMovement>['meta'] | null>(null)
const pending = ref(true)
const error = ref<string | null>(null)

const search = ref('')
const debouncedSearch = useDebouncedRef(search, 400)
const page = ref(1)
const size = ref(20)
const movementType = ref<MovementType | ''>('')

const products = ref<Product[]>([])
const productsLoading = ref(false)

async function loadProducts() {
  productsLoading.value = true
  try {
    // First 100 products are enough to populate the picker; search narrows it.
    const data = await api.get<Page<Product>>('/products', { page: 1, size: 100, sort: 'name' })
    products.value = data.items
  } catch (e: any) {
    toast.error(e.message)
  } finally {
    productsLoading.value = false
  }
}

async function load() {
  pending.value = true
  error.value = null
  try {
    const data = await api.get<Page<StockMovement>>('/inventory/movements', {
      q: debouncedSearch.value,
      page: page.value,
      size: size.value,
      movement_type: movementType.value || undefined
    })
    items.value = data.items
    meta.value = data.meta
  } catch (e: any) {
    error.value = e.message
  } finally {
    pending.value = false
  }
}

watch([debouncedSearch, movementType, size], () => {
  page.value = 1
})
watch([debouncedSearch, page, size, movementType], load)

// --- stock in / out ---------------------------------------------------------
const formOpen = ref(false)
const mode = ref<'IN' | 'OUT'>('IN')
const saving = ref(false)
const formError = ref<string | null>(null)
const form = ref({ product_id: '' as number | '', quantity: 1, reference: '', note: '' })

const selectedProduct = computed(() =>
  products.value.find((p) => p.id === Number(form.value.product_id)) ?? null
)

function open(kind: 'IN' | 'OUT') {
  mode.value = kind
  form.value = { product_id: '', quantity: 1, reference: '', note: '' }
  formError.value = null
  formOpen.value = true
}

async function submit() {
  formError.value = null
  if (!form.value.product_id) {
    formError.value = 'Select a product.'
    return
  }
  const qty = Number(form.value.quantity)
  if (!Number.isInteger(qty) || qty < 1) {
    formError.value = 'Quantity must be a whole number of at least 1.'
    return
  }
  if (mode.value === 'OUT' && selectedProduct.value && qty > selectedProduct.value.quantity) {
    formError.value = `Only ${selectedProduct.value.quantity} unit(s) in stock.`
    return
  }

  saving.value = true
  try {
    await api.post(mode.value === 'IN' ? '/inventory/stock-in' : '/inventory/stock-out', {
      product_id: Number(form.value.product_id),
      quantity: qty,
      reference: form.value.reference.trim() || null,
      note: form.value.note.trim() || null
    })
    toast.success(mode.value === 'IN' ? 'Stock received' : 'Stock issued')
    formOpen.value = false
    await Promise.all([load(), loadProducts()])
  } catch (e: any) {
    formError.value = e.message
  } finally {
    saving.value = false
  }
}

const tone: Record<string, string> = {
  IN: 'bg-emerald-100 text-emerald-700',
  OUT: 'bg-rose-100 text-rose-700',
  ADJUST: 'bg-amber-100 text-amber-700'
}

onMounted(async () => {
  await loadProducts()
  await load()
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput v-model="search" placeholder="Search product, SKU, reference…" />
        <select v-model="movementType" class="input w-full sm:w-40" aria-label="Filter by movement type">
          <option value="">All types</option>
          <option value="IN">Stock In</option>
          <option value="OUT">Stock Out</option>
          <option value="ADJUST">Adjustment</option>
        </select>
      </div>
      <div class="flex shrink-0 gap-2">
        <button type="button" class="btn-primary" @click="open('IN')">↓ Stock In</button>
        <button type="button" class="btn-secondary" @click="open('OUT')">↑ Stock Out</button>
      </div>
    </div>

    <div class="card overflow-hidden">
      <LoadingState v-if="pending" label="Loading movements…" />
      <ErrorState v-else-if="error" :message="error" @retry="load" />
      <EmptyState
        v-else-if="!items.length"
        title="No stock movements yet"
        description="Record a Stock In to start building the ledger."
        action-label="↓ Stock In"
        @action="open('IN')"
      />
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200">
          <thead class="bg-slate-50">
            <tr>
              <th class="th">Product</th>
              <th class="th">Type</th>
              <th class="th">Quantity</th>
              <th class="th">Stock after</th>
              <th class="th">Reference</th>
              <th class="th">Date</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="m in items" :key="m.id" class="hover:bg-slate-50">
              <td class="td">
                <span class="font-medium text-slate-800">{{ m.product_name || '—' }}</span>
                <span class="ml-2 font-mono text-xs text-slate-400">{{ m.product_sku }}</span>
              </td>
              <td class="td"><span class="badge" :class="tone[m.movement_type]">{{ m.movement_type }}</span></td>
              <td class="td">{{ number(m.quantity) }}</td>
              <td class="td">{{ number(m.quantity_after) }}</td>
              <td class="td text-slate-500">{{ m.reference || '—' }}</td>
              <td class="td text-slate-500">{{ datetime(m.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <PaginationBar :meta="meta" :disabled="pending" @update:page="page = $event" @update:size="size = $event" />
    </div>

    <ModalDialog v-model:open="formOpen" :title="mode === 'IN' ? 'Stock In' : 'Stock Out'">
      <form class="space-y-4" novalidate @submit.prevent="submit">
        <div v-if="formError" class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {{ formError }}
        </div>

        <div>
          <label class="label" for="mproduct">Product *</label>
          <select id="mproduct" v-model="form.product_id" class="input" :disabled="productsLoading" required>
            <option value="">{{ productsLoading ? 'Loading…' : 'Select a product' }}</option>
            <option v-for="p in products" :key="p.id" :value="p.id">
              {{ p.name }} ({{ p.sku }}) — {{ p.quantity }} in stock
            </option>
          </select>
        </div>

        <div>
          <label class="label" for="mqty">Quantity *</label>
          <input id="mqty" v-model="form.quantity" type="number" min="1" step="1" class="input" required>
          <p v-if="selectedProduct" class="mt-1 text-xs text-slate-400">
            Current stock: {{ number(selectedProduct.quantity) }}
          </p>
        </div>

        <div>
          <label class="label" for="mref">Reference</label>
          <input id="mref" v-model="form.reference" class="input" maxlength="120" placeholder="PO-1042 / INV-88">
        </div>

        <div>
          <label class="label" for="mnote">Note</label>
          <textarea id="mnote" v-model="form.note" class="input" rows="2" />
        </div>
      </form>

      <template #footer>
        <button type="button" class="btn-secondary" :disabled="saving" @click="formOpen = false">Cancel</button>
        <button type="button" class="btn-primary" :disabled="saving" @click="submit">
          {{ saving ? 'Saving…' : mode === 'IN' ? 'Receive stock' : 'Issue stock' }}
        </button>
      </template>
    </ModalDialog>
  </div>
</template>
