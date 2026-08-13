<script setup lang="ts">
import type { Category, Page, Product, Supplier } from '~/types'

const api = useApi()
const toast = useToast()
const route = useRoute()
const { currency, number } = useFormat()

// --- list state -------------------------------------------------------------
const items = ref<Product[]>([])
const meta = ref<Page<Product>['meta'] | null>(null)
const pending = ref(true)
const error = ref<string | null>(null)

const search = ref('')
const debouncedSearch = useDebouncedRef(search, 400)
const page = ref(1)
const size = ref(20)
const categoryId = ref<number | ''>('')
const supplierId = ref<number | ''>('')
const lowStock = ref(route.query.low_stock === '1')
const sort = ref('name')
const order = ref<'asc' | 'desc'>('asc')

const categories = ref<Category[]>([])
const suppliers = ref<Supplier[]>([])

async function loadOptions() {
  try {
    const [c, s] = await Promise.all([
      api.get<Category[]>('/categories/all'),
      api.get<Supplier[]>('/suppliers/all')
    ])
    categories.value = c
    suppliers.value = s
  } catch (e: any) {
    toast.error(e.message)
  }
}

async function load() {
  pending.value = true
  error.value = null
  try {
    const data = await api.get<Page<Product>>('/products', {
      q: debouncedSearch.value,
      page: page.value,
      size: size.value,
      category_id: categoryId.value || undefined,
      supplier_id: supplierId.value || undefined,
      low_stock: lowStock.value || undefined,
      sort: sort.value,
      order: order.value
    })
    items.value = data.items
    meta.value = data.meta
  } catch (e: any) {
    error.value = e.message
  } finally {
    pending.value = false
  }
}

watch([debouncedSearch, categoryId, supplierId, lowStock, size], () => {
  page.value = 1
})
watch([debouncedSearch, page, size, categoryId, supplierId, lowStock, sort, order], load)

function toggleSort(column: string) {
  if (sort.value === column) {
    order.value = order.value === 'asc' ? 'desc' : 'asc'
  } else {
    sort.value = column
    order.value = 'asc'
  }
}

// --- create / edit ----------------------------------------------------------
const formOpen = ref(false)
const saving = ref(false)
const editing = ref<Product | null>(null)
const formError = ref<string | null>(null)

const blank = () => ({
  sku: '',
  name: '',
  description: '',
  unit_price: '0.00',
  quantity: 0,
  reorder_level: 0,
  category_id: '' as number | '',
  supplier_id: '' as number | ''
})
const form = ref(blank())

function openCreate() {
  editing.value = null
  form.value = blank()
  formError.value = null
  formOpen.value = true
}

function openEdit(p: Product) {
  editing.value = p
  form.value = {
    sku: p.sku,
    name: p.name,
    description: p.description ?? '',
    unit_price: String(p.unit_price ?? '0.00'),
    quantity: p.quantity,
    reorder_level: p.reorder_level,
    category_id: p.category_id ?? '',
    supplier_id: p.supplier_id ?? ''
  }
  formError.value = null
  formOpen.value = true
}

async function save() {
  formError.value = null
  if (!form.value.sku.trim() || !form.value.name.trim()) {
    formError.value = 'SKU and name are required.'
    return
  }
  if (Number(form.value.unit_price) < 0) {
    formError.value = 'Unit price cannot be negative.'
    return
  }

  const payload: Record<string, any> = {
    sku: form.value.sku.trim(),
    name: form.value.name.trim(),
    description: form.value.description.trim() || null,
    unit_price: Number(form.value.unit_price).toFixed(2),
    reorder_level: Number(form.value.reorder_level) || 0,
    category_id: form.value.category_id || null,
    supplier_id: form.value.supplier_id || null
  }

  saving.value = true
  try {
    if (editing.value) {
      await api.put(`/products/${editing.value.id}`, payload)
      toast.success('Product updated')
    } else {
      payload.quantity = Number(form.value.quantity) || 0
      await api.post('/products', payload)
      toast.success('Product created')
    }
    formOpen.value = false
    await load()
  } catch (e: any) {
    formError.value = e.message
  } finally {
    saving.value = false
  }
}

// --- delete -----------------------------------------------------------------
const confirmOpen = ref(false)
const deleting = ref(false)
const target = ref<Product | null>(null)

function askDelete(p: Product) {
  target.value = p
  confirmOpen.value = true
}

async function remove() {
  if (!target.value) return
  deleting.value = true
  try {
    await api.del(`/products/${target.value.id}`)
    toast.success('Product deleted')
    confirmOpen.value = false
    if (items.value.length === 1 && page.value > 1) page.value -= 1
    else await load()
  } catch (e: any) {
    toast.error(e.message)
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  await loadOptions()
  await load()
})
</script>

<template>
  <div class="space-y-4">
    <!-- Toolbar -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput v-model="search" placeholder="Search SKU, name, description…" />
        <select v-model="categoryId" class="input w-full sm:w-44" aria-label="Filter by category">
          <option value="">All categories</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <select v-model="supplierId" class="input w-full sm:w-44" aria-label="Filter by supplier">
          <option value="">All suppliers</option>
          <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
        <label class="flex items-center gap-2 whitespace-nowrap text-sm text-slate-600">
          <input v-model="lowStock" type="checkbox" class="rounded border-slate-300"> Low stock
        </label>
      </div>
      <button type="button" class="btn-primary shrink-0" @click="openCreate">+ New product</button>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden">
      <LoadingState v-if="pending" label="Loading products…" />
      <ErrorState v-else-if="error" :message="error" @retry="load" />
      <EmptyState
        v-else-if="!items.length"
        title="No products found"
        description="Adjust your filters or add your first product."
        action-label="+ New product"
        @action="openCreate"
      />
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200">
          <thead class="bg-slate-50">
            <tr>
              <th class="th cursor-pointer select-none" @click="toggleSort('sku')">SKU</th>
              <th class="th cursor-pointer select-none" @click="toggleSort('name')">Name</th>
              <th class="th">Category</th>
              <th class="th">Supplier</th>
              <th class="th cursor-pointer select-none" @click="toggleSort('unit_price')">Price</th>
              <th class="th cursor-pointer select-none" @click="toggleSort('quantity')">Stock</th>
              <th class="th text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="p in items" :key="p.id" class="hover:bg-slate-50">
              <td class="td font-mono text-xs">{{ p.sku }}</td>
              <td class="td">
                <span class="font-medium text-slate-800">{{ p.name }}</span>
              </td>
              <td class="td text-slate-500">{{ p.category?.name || '—' }}</td>
              <td class="td text-slate-500">{{ p.supplier?.name || '—' }}</td>
              <td class="td">{{ currency(p.unit_price) }}</td>
              <td class="td">
                <span
                  class="badge"
                  :class="p.quantity <= 0
                    ? 'bg-rose-100 text-rose-700'
                    : p.is_low_stock
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'"
                >
                  {{ number(p.quantity) }}
                </span>
              </td>
              <td class="td text-right">
                <button type="button" class="text-sm text-brand-600 hover:underline" @click="openEdit(p)">
                  Edit
                </button>
                <button type="button" class="ml-3 text-sm text-rose-600 hover:underline" @click="askDelete(p)">
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <PaginationBar
        :meta="meta"
        :disabled="pending"
        @update:page="page = $event"
        @update:size="size = $event"
      />
    </div>

    <!-- Create / edit modal -->
    <ModalDialog v-model:open="formOpen" :title="editing ? 'Edit product' : 'New product'" wide>
      <form class="grid grid-cols-1 gap-4 sm:grid-cols-2" novalidate @submit.prevent="save">
        <div v-if="formError" class="sm:col-span-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {{ formError }}
        </div>

        <div>
          <label class="label" for="sku">SKU *</label>
          <input id="sku" v-model="form.sku" class="input" maxlength="64" required>
        </div>
        <div>
          <label class="label" for="name">Name *</label>
          <input id="name" v-model="form.name" class="input" maxlength="200" required>
        </div>
        <div class="sm:col-span-2">
          <label class="label" for="description">Description</label>
          <textarea id="description" v-model="form.description" class="input" rows="2" />
        </div>
        <div>
          <label class="label" for="price">Unit price *</label>
          <input id="price" v-model="form.unit_price" type="number" step="0.01" min="0" class="input" required>
        </div>
        <div>
          <label class="label" for="reorder">Reorder level</label>
          <input id="reorder" v-model="form.reorder_level" type="number" min="0" class="input">
        </div>
        <div v-if="!editing">
          <label class="label" for="qty">Opening quantity</label>
          <input id="qty" v-model="form.quantity" type="number" min="0" class="input">
          <p class="mt-1 text-xs text-slate-400">Stock is changed later via Stock In/Out.</p>
        </div>
        <div>
          <label class="label" for="cat">Category</label>
          <select id="cat" v-model="form.category_id" class="input">
            <option value="">—</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div>
          <label class="label" for="sup">Supplier</label>
          <select id="sup" v-model="form.supplier_id" class="input">
            <option value="">—</option>
            <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
      </form>

      <template #footer>
        <button type="button" class="btn-secondary" :disabled="saving" @click="formOpen = false">Cancel</button>
        <button type="button" class="btn-primary" :disabled="saving" @click="save">
          <span v-if="saving" class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
      </template>
    </ModalDialog>

    <ConfirmDialog
      v-model:open="confirmOpen"
      title="Delete product"
      :message="`Delete “${target?.name}”? Its stock movement history will be removed too.`"
      :busy="deleting"
      @confirm="remove"
    />
  </div>
</template>
