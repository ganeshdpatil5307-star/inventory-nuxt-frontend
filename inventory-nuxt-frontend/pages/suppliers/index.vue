<script setup lang="ts">
import type { Page, Supplier } from '~/types'

const api = useApi()
const toast = useToast()

const items = ref<Supplier[]>([])
const meta = ref<Page<Supplier>['meta'] | null>(null)
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
    const data = await api.get<Page<Supplier>>('/suppliers', {
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
const editing = ref<Supplier | null>(null)
const formError = ref<string | null>(null)
const blank = () => ({ name: '', contact_name: '', email: '', phone: '', address: '' })
const form = ref(blank())

function openCreate() {
  editing.value = null
  form.value = blank()
  formError.value = null
  formOpen.value = true
}

function openEdit(s: Supplier) {
  editing.value = s
  form.value = {
    name: s.name,
    contact_name: s.contact_name ?? '',
    email: s.email ?? '',
    phone: s.phone ?? '',
    address: s.address ?? ''
  }
  formError.value = null
  formOpen.value = true
}

async function save() {
  formError.value = null
  if (!form.value.name.trim()) {
    formError.value = 'Name is required.'
    return
  }
  if (form.value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email.trim())) {
    formError.value = 'Enter a valid email address.'
    return
  }
  const payload = {
    name: form.value.name.trim(),
    contact_name: form.value.contact_name.trim() || null,
    email: form.value.email.trim() || null,
    phone: form.value.phone.trim() || null,
    address: form.value.address.trim() || null
  }
  saving.value = true
  try {
    if (editing.value) {
      await api.put(`/suppliers/${editing.value.id}`, payload)
      toast.success('Supplier updated')
    } else {
      await api.post('/suppliers', payload)
      toast.success('Supplier created')
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
const target = ref<Supplier | null>(null)

function askDelete(s: Supplier) {
  target.value = s
  confirmOpen.value = true
}

async function remove() {
  if (!target.value) return
  deleting.value = true
  try {
    await api.del(`/suppliers/${target.value.id}`)
    toast.success('Supplier deleted')
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
      <SearchInput v-model="search" placeholder="Search name, contact, email…" />
      <button type="button" class="btn-primary shrink-0" @click="openCreate">+ New supplier</button>
    </div>

    <div class="card overflow-hidden">
      <LoadingState v-if="pending" label="Loading suppliers…" />
      <ErrorState v-else-if="error" :message="error" @retry="load" />
      <EmptyState
        v-else-if="!items.length"
        title="No suppliers found"
        description="Add the vendors you buy stock from."
        action-label="+ New supplier"
        @action="openCreate"
      />
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200">
          <thead class="bg-slate-50">
            <tr>
              <th class="th">Supplier</th>
              <th class="th">Contact</th>
              <th class="th">Email</th>
              <th class="th">Phone</th>
              <th class="th text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="s in items" :key="s.id" class="hover:bg-slate-50">
              <td class="td font-medium text-slate-800">{{ s.name }}</td>
              <td class="td text-slate-500">{{ s.contact_name || '—' }}</td>
              <td class="td text-slate-500">{{ s.email || '—' }}</td>
              <td class="td text-slate-500">{{ s.phone || '—' }}</td>
              <td class="td text-right">
                <button type="button" class="text-sm text-brand-600 hover:underline" @click="openEdit(s)">Edit</button>
                <button type="button" class="ml-3 text-sm text-rose-600 hover:underline" @click="askDelete(s)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <PaginationBar :meta="meta" :disabled="pending" @update:page="page = $event" @update:size="size = $event" />
    </div>

    <ModalDialog v-model:open="formOpen" :title="editing ? 'Edit supplier' : 'New supplier'" wide>
      <form class="grid grid-cols-1 gap-4 sm:grid-cols-2" novalidate @submit.prevent="save">
        <div v-if="formError" class="sm:col-span-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {{ formError }}
        </div>
        <div>
          <label class="label" for="sname">Name *</label>
          <input id="sname" v-model="form.name" class="input" maxlength="180" required>
        </div>
        <div>
          <label class="label" for="scontact">Contact person</label>
          <input id="scontact" v-model="form.contact_name" class="input" maxlength="180">
        </div>
        <div>
          <label class="label" for="semail">Email</label>
          <input id="semail" v-model="form.email" type="email" class="input">
        </div>
        <div>
          <label class="label" for="sphone">Phone</label>
          <input id="sphone" v-model="form.phone" class="input" maxlength="50">
        </div>
        <div class="sm:col-span-2">
          <label class="label" for="saddress">Address</label>
          <textarea id="saddress" v-model="form.address" class="input" rows="2" />
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
      title="Delete supplier"
      :message="`Delete “${target?.name}”? Suppliers linked to products cannot be deleted.`"
      :busy="deleting"
      @confirm="remove"
    />
  </div>
</template>
