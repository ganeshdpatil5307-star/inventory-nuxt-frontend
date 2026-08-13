<script setup lang="ts">
import type { Category, Page } from '~/types'

const api = useApi()
const toast = useToast()
const { datetime } = useFormat()

const items = ref<Category[]>([])
const meta = ref<Page<Category>['meta'] | null>(null)
const pending = ref(true)
const error = ref<string | null>(null)

const search = ref('')
const debouncedSearch = useDebouncedRef(search, 400)
const page = ref(1)
const size = ref(20)

async function load() {
  pending.value = true
  error.value = null
  try {
    const data = await api.get<Page<Category>>('/categories', {
      q: debouncedSearch.value,
      page: page.value,
      size: size.value
    })
    items.value = data.items
    meta.value = data.meta
  } catch (e: any) {
    error.value = e.message
  } finally {
    pending.value = false
  }
}

watch([debouncedSearch, size], () => {
  page.value = 1
})
watch([debouncedSearch, page, size], load)

const formOpen = ref(false)
const saving = ref(false)
const editing = ref<Category | null>(null)
const formError = ref<string | null>(null)
const form = ref({ name: '', description: '' })

function openCreate() {
  editing.value = null
  form.value = { name: '', description: '' }
  formError.value = null
  formOpen.value = true
}

function openEdit(c: Category) {
  editing.value = c
  form.value = { name: c.name, description: c.description ?? '' }
  formError.value = null
  formOpen.value = true
}

async function save() {
  formError.value = null
  if (!form.value.name.trim()) {
    formError.value = 'Name is required.'
    return
  }
  const payload = {
    name: form.value.name.trim(),
    description: form.value.description.trim() || null
  }
  saving.value = true
  try {
    if (editing.value) {
      await api.put(`/categories/${editing.value.id}`, payload)
      toast.success('Category updated')
    } else {
      await api.post('/categories', payload)
      toast.success('Category created')
    }
    formOpen.value = false
    await load()
  } catch (e: any) {
    formError.value = e.message
  } finally {
    saving.value = false
  }
}

const confirmOpen = ref(false)
const deleting = ref(false)
const target = ref<Category | null>(null)

function askDelete(c: Category) {
  target.value = c
  confirmOpen.value = true
}

async function remove() {
  if (!target.value) return
  deleting.value = true
  try {
    await api.del(`/categories/${target.value.id}`)
    toast.success('Category deleted')
    confirmOpen.value = false
    if (items.value.length === 1 && page.value > 1) page.value -= 1
    else await load()
  } catch (e: any) {
    toast.error(e.message)
    confirmOpen.value = false
  } finally {
    deleting.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <SearchInput v-model="search" placeholder="Search categories…" />
      <button type="button" class="btn-primary shrink-0" @click="openCreate">+ New category</button>
    </div>

    <div class="card overflow-hidden">
      <LoadingState v-if="pending" label="Loading categories…" />
      <ErrorState v-else-if="error" :message="error" @retry="load" />
      <EmptyState
        v-else-if="!items.length"
        title="No categories found"
        description="Categories group your products for reporting and filtering."
        action-label="+ New category"
        @action="openCreate"
      />
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200">
          <thead class="bg-slate-50">
            <tr>
              <th class="th">Name</th>
              <th class="th">Description</th>
              <th class="th">Created</th>
              <th class="th text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="c in items" :key="c.id" class="hover:bg-slate-50">
              <td class="td font-medium text-slate-800">{{ c.name }}</td>
              <td class="td max-w-md truncate text-slate-500">{{ c.description || '—' }}</td>
              <td class="td text-slate-500">{{ datetime(c.created_at) }}</td>
              <td class="td text-right">
                <button type="button" class="text-sm text-brand-600 hover:underline" @click="openEdit(c)">Edit</button>
                <button type="button" class="ml-3 text-sm text-rose-600 hover:underline" @click="askDelete(c)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <PaginationBar :meta="meta" :disabled="pending" @update:page="page = $event" @update:size="size = $event" />
    </div>

    <ModalDialog v-model:open="formOpen" :title="editing ? 'Edit category' : 'New category'">
      <form class="space-y-4" novalidate @submit.prevent="save">
        <div v-if="formError" class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {{ formError }}
        </div>
        <div>
          <label class="label" for="cname">Name *</label>
          <input id="cname" v-model="form.name" class="input" maxlength="120" required>
        </div>
        <div>
          <label class="label" for="cdesc">Description</label>
          <textarea id="cdesc" v-model="form.description" class="input" rows="3" />
        </div>
      </form>
      <template #footer>
        <button type="button" class="btn-secondary" :disabled="saving" @click="formOpen = false">Cancel</button>
        <button type="button" class="btn-primary" :disabled="saving" @click="save">
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
      </template>
    </ModalDialog>

    <ConfirmDialog
      v-model:open="confirmOpen"
      title="Delete category"
      :message="`Delete “${target?.name}”? Categories still linked to products cannot be deleted.`"
      :busy="deleting"
      @confirm="remove"
    />
  </div>
</template>
