<template>
  <div class="space-y-6 pb-16 md:pb-6">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <nav class="flex items-center gap-1.5 text-sm text-gray-500" aria-label="Breadcrumb">
          <router-link to="/admin/products" class="transition-colors duration-150 hover:text-orange-700">Products</router-link>
          <Icon name="chevron-right" :size="14" class="text-gray-400" />
          <span class="font-medium text-gray-900">{{ isEditing ? 'Edit product' : 'Add product' }}</span>
        </nav>
        <h1 class="mt-1 text-2xl font-semibold tracking-tight text-gray-900 md:text-3xl">
          {{ isEditing ? 'Edit product' : 'Add a new product' }}
        </h1>
      </div>
      <p v-if="dirty" class="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800" role="status">
        <span class="h-2 w-2 rounded-full bg-amber-600" aria-hidden="true" />
        Unsaved changes
      </p>
    </header>

    <div v-if="loading" class="space-y-4" aria-busy="true">
      <Skeleton class="h-40 rounded-lg" />
      <Skeleton class="h-11 w-full" />
      <Skeleton class="h-11 w-full" />
      <Skeleton class="h-11 w-64" />
    </div>

    <ErrorState v-else-if="loadError" title="We could not load this product" :message="loadError" @retry="load" />

    <form v-else class="grid gap-6 lg:grid-cols-[1fr_360px]" novalidate @submit.prevent="save">
      <div class="space-y-5">
        <!-- Image upload: drag and drop with preview -->
        <section aria-labelledby="images-heading" class="rounded-lg border border-gray-100 bg-white p-4 shadow-sm md:p-6">
          <h2 id="images-heading" class="text-lg font-semibold tracking-tight text-gray-900">Photos</h2>
          <p class="mt-1 text-sm text-gray-500">Close-up, naturally lit. 4:3 crop on cards.</p>

          <div
            class="mt-4"
            :class="[
              'rounded-lg border-2 border-dashed p-6 text-center transition-colors duration-150',
              dragging ? 'border-orange-700 bg-orange-50' : 'border-gray-300 hover:border-gray-400',
            ]"
            role="button"
            tabindex="0"
            aria-label="Upload product photos. Drag and drop or press enter to browse."
            @dragover.prevent="dragging = true"
            @dragleave.prevent="dragging = false"
            @drop.prevent="onDrop"
            @keydown.enter.prevent="fileInput?.click()"
            @click="fileInput?.click()"
          >
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              class="sr-only"
              aria-hidden="true"
              tabindex="-1"
              @change="onFile"
            />
            <Icon name="upload" :size="36" class="mx-auto text-gray-400" />
            <p class="mt-2 text-sm font-medium text-gray-900">Drag photos here, or browse</p>
            <p class="mt-1 text-xs text-gray-400">PNG or JPG, max 5 MB each</p>
          </div>

          <div v-if="preview" class="mt-4 flex items-center gap-4">
            <div class="aspect-4/3 h-28 w-36 overflow-hidden rounded-md border border-gray-100 bg-gray-100">
              <img :src="preview" alt="Product photo preview" class="h-full w-full object-cover" />
            </div>
            <Button variant="ghost" size="sm" icon="trash" @click="clearImage">Remove photo</Button>
          </div>
        </section>

        <!-- Details -->
        <section aria-labelledby="details-heading" class="rounded-lg border border-gray-100 bg-white p-4 shadow-sm md:p-6">
          <h2 id="details-heading" class="text-lg font-semibold tracking-tight text-gray-900">Details</h2>
          <div class="mt-4 space-y-4">
            <Input
              v-model="form.name"
              label="Product name"
              maxlength="80"
              :error="errors.name"
              required
              @blur="touched.name = true; validate('name')"
              @update:model-value="markDirty"
            />
            <div class="grid gap-4 sm:grid-cols-2">
              <Select
                v-model="form.categoryId"
                label="Category"
                :options="categoryOptions"
                placeholder="Select a category"
                :error="errors.categoryId"
                required
                @update:model-value="markDirty"
              />
              <div class="grid grid-cols-2 gap-4">
                <PriceInput v-model="form.price" :error="errors.price" @update:model-value="markDirty" />
                <div>
                  <label for="stock" class="mb-1.5 block text-sm font-medium text-gray-900">
                    Stock <span class="text-orange-700" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="stock"
                    v-model.number="form.stock"
                    type="number"
                    inputmode="numeric"
                    min="0"
                    max="9999"
                    step="1"
                    required
                    class="h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-base tabular-nums text-gray-900 transition-colors duration-150 focus:border-orange-700 focus:ring-2 focus:ring-orange-700/20"
                    :class="errors.stock && 'border-red-600'"
                    :aria-invalid="!!errors.stock || undefined"
                    :aria-describedby="errors.stock ? 'stock-error' : undefined"
                    @update:model-value="clampStock(); markDirty()"
                  />
                  <p v-if="errors.stock" id="stock-error" class="mt-1.5 flex items-start gap-1.5 text-sm text-red-600" role="alert">
                    <Icon name="exclamation-circle" :size="16" />
                    {{ errors.stock }}
                  </p>
                  <p v-else class="mt-1.5 text-sm text-gray-500">0 – 9,999 units</p>
                </div>
              </div>
            </div>
            <Textarea
              v-model="form.description"
              label="Description"
              maxlength="300"
              help="Short and tasty — 300 characters max."
              :error="errors.description"
              required
              @blur="touched.description = true; validate('description')"
              @update:model-value="markDirty"
            />
            <div class="flex items-center justify-between gap-3 rounded-lg bg-gray-50 p-4">
              <div>
                <p class="text-sm font-semibold text-gray-900">Available on the menu</p>
                <p class="text-sm text-gray-500">Customers see this product right away.</p>
              </div>
              <Switch
                v-model="form.available"
                label="Product availability"
                @update:model-value="markDirty"
              />
            </div>
          </div>
        </section>
      </div>

      <!-- Save panel -->
      <aside class="lg:sticky lg:top-24 lg:self-start">
        <div class="rounded-lg border border-gray-100 bg-white p-4 shadow-sm md:p-6">
          <h2 class="text-base font-semibold tracking-tight text-gray-900">Save</h2>
          <p class="mt-1 text-sm text-gray-500">
            Changes go live immediately after saving.
          </p>
          <Button
            variant="primary"
            size="lg"
            class="mt-4 w-full"
            icon="check"
            :loading="saving"
            loading-label="Saving product"
            :disabled="!dirty && isEditing"
            @click="save"
          >
            Save product
          </Button>
          <router-link
            to="/admin/products"
            class="mt-3 block text-center text-sm font-semibold text-orange-700 underline-offset-2 hover:underline"
          >
            Cancel
          </router-link>
          <p v-if="saveError" class="mt-3 flex items-start gap-1.5 rounded-md bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700" role="alert">
            <Icon name="exclamation-circle" :size="18" class="mt-0.5 shrink-0" />
            {{ saveError }}
          </p>
        </div>
      </aside>
    </form>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import Icon from '../../components/Icon.vue'
import Button from '../../components/Button.vue'
import Input from '../../components/Input.vue'
import Select from '../../components/Select.vue'
import Textarea from '../../components/Textarea.vue'
import Switch from '../../components/Switch.vue'
import Skeleton from '../../components/Skeleton.vue'
import ErrorState from '../../components/ErrorState.vue'
import { toast, errorToast } from '../../store/toast.js'
import {
  adminGetProduct,
  adminUpdateProduct,
  adminCreateProduct,
  listCategories,
} from '../../lib/api.js'

const route = useRoute()
const router = useRouter()

const isEditing = computed(() => !!route.params.id)

const loading = ref(true)
const loadError = ref('')
const categories = ref([])
const form = ref({
  name: '',
  categoryId: '',
  price: 0,
  stock: 0,
  description: '',
  available: true,
  emoji: '🍽️',
  hue: 28,
  image: '',
})
const preview = ref('')
const errors = ref({})
const touched = ref({})
const dirty = ref(false)
const saving = ref(false)
const saveError = ref('')
const dragging = ref(false)
const fileInput = ref(null)

const categoryOptions = computed(() =>
  categories.value.map((c) => ({ value: c.id, label: c.name }))
)

/* ---------- constrained price input (₦, multiples of 50) ---------- */
const PriceInput = {
  props: ['modelValue', 'error'],
  emits: ['update:modelValue'],
  template: `
    <div>
      <label :for="id" class="mb-1.5 block text-sm font-medium text-gray-900">
        Price (₦) <span class="text-orange-700" aria-hidden="true">*</span>
      </label>
      <div class="relative">
        <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-gray-400">₦</span>
        <input
          :id="id"
          :value="display"
          type="number"
          inputmode="decimal"
          min="0"
          max="999999"
          step="50"
          required
          class="h-11 w-full rounded-md border border-gray-300 bg-white pl-8 pr-3 text-base tabular-nums text-gray-900 transition-colors duration-150 focus:border-orange-700 focus:ring-2 focus:ring-orange-700/20"
          :class="error && 'border-red-600'"
          :aria-invalid="!!error || undefined"
          :aria-describedby="error ? id + '-error' : undefined"
          @input="onInput"
          @blur="onBlur"
        />
      </div>
      <p v-if="error" :id="id + '-error'" class="mt-1.5 flex items-start gap-1.5 text-sm text-red-600" role="alert">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 9v3.75m9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
        <span>{{ error }}</span>
      </p>
      <p v-else class="mt-1.5 text-sm text-gray-500">Whole naira, in steps of ₦50</p>
    </div>
  `,
  setup(props, { emit }) {
    const id = `price-${Math.random().toString(36).slice(2, 9)}`
    const display = computed(() => (props.modelValue ? props.modelValue : ''))
    function onInput(e) {
      const raw = e.target.value
      emit('update:modelValue', raw === '' ? 0 : Math.max(0, Math.round(Number(raw))))
    }
    function onBlur() {
      // snap to nearest 50 to prevent pricing mistakes
      const snapped = Math.round((props.modelValue || 0) / 50) * 50
      if (snapped !== props.modelValue) emit('update:modelValue', Math.max(0, snapped))
    }
    return { id, display, onInput, onBlur }
  },
}

/* ---------- load ---------- */
async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const cats = await listCategories()
    categories.value = cats
    if (isEditing.value) {
      const p = await adminGetProduct(route.params.id)
      form.value = {
        name: p.name,
        categoryId: p.categoryId,
        price: p.price,
        stock: p.stock,
        description: p.description,
        available: p.stock > 0,
        emoji: p.emoji,
        hue: p.hue,
        image: p.image || '',
      }
      preview.value = p.image || ''
    }
  } catch (e) {
    loadError.value = e.message
  } finally {
    loading.value = false
  }
}

/* ---------- validation ---------- */
function validate(field) {
  let msg = ''
  switch (field) {
    case 'name':
      if (form.value.name.trim().length < 2) msg = 'Enter a product name.'
      break
    case 'categoryId':
      if (!form.value.categoryId) msg = 'Select a category.'
      break
    case 'price':
      if (!form.value.price || form.value.price <= 0) msg = 'Enter a price above ₦0.'
      else if (form.value.price % 50 !== 0) msg = 'Round the price to the nearest ₦50.'
      break
    case 'stock':
      if (form.value.stock < 0) msg = 'Stock cannot be negative.'
      else if (form.value.stock > 9999) msg = 'Stock cannot exceed 9,999.'
      break
    case 'description':
      if (form.value.description.trim().length < 10) msg = 'Add a short description (10+ characters).'
      break
  }
  if (msg) errors.value[field] = msg
  else delete errors.value[field]
  return !msg
}

function clampStock() {
  form.value.stock = Math.min(9999, Math.max(0, Math.round(form.value.stock) || 0))
}

function markDirty() {
  dirty.value = true
}

/* ---------- image upload ---------- */
function onDrop(e) {
  dragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) readFile(file)
}

function onFile(e) {
  const file = e.target.files?.[0]
  if (file) readFile(file)
}

function readFile(file) {
  if (!file.type.startsWith('image/')) {
    errorToast('That is not an image', 'Choose a PNG or JPG file.')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    errorToast('Image too large', 'Keep each photo under 5 MB.')
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    preview.value = reader.result
    form.value.image = reader.result
    markDirty()
  }
  reader.readAsDataURL(file)
}

function clearImage() {
  preview.value = ''
  form.value.image = ''
  markDirty()
}

/* ---------- save ---------- */
async function save() {
  saveError.value = ''
  const fields = ['name', 'categoryId', 'price', 'stock', 'description']
  let first = ''
  fields.forEach((f) => {
    touched.value[f] = true
    const ok = validate(f)
    if (!ok && !first) first = errors.value[f]
  })
  if (first) return

  saving.value = true
  const payload = {
    name: form.value.name.trim(),
    categoryId: form.value.categoryId,
    price: form.value.price,
    stock: form.value.available ? form.value.stock : 0,
    description: form.value.description.trim(),
    emoji: form.value.emoji,
    hue: form.value.hue,
    image: form.value.image,
    featured: false,
  }
  try {
    if (isEditing.value) {
      await adminUpdateProduct(route.params.id, payload)
    } else {
      await adminCreateProduct(payload)
    }
    dirty.value = false
    toast({ title: 'Product saved', tone: 'success', duration: 2600 })
    router.push('/admin/products')
  } catch (e) {
    saveError.value = e.message
  } finally {
    saving.value = false
  }
}

/* ---------- unsaved changes warning ---------- */
function beforeLeave(to, from, next) {
  if (dirty.value && !saveError.value) {
    if (window.confirm('You have unsaved changes. Leave without saving?')) next()
    else next(false)
  } else {
    next()
  }
}
onBeforeRouteLeave(beforeLeave)

onMounted(() => {
  window.addEventListener('beforeunload', onUnload)
  load()
})
function onUnload(e) {
  if (dirty.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}
</script>
