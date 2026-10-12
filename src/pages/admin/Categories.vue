<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-2xl font-semibold tracking-tight text-gray-900 md:text-3xl">Categories</h1>
      <p class="mt-1 text-sm text-gray-500">Group your menu. Products are never deleted with a category.</p>
    </header>

    <!-- Add -->
    <form class="rounded-lg border border-gray-100 bg-white p-4 shadow-sm md:p-6" @submit.prevent="add">
      <label for="new-category" class="text-sm font-medium text-gray-900">New category</label>
      <div class="mt-2 flex flex-col gap-3 sm:flex-row">
        <Input
          id="new-category"
          v-model="newName"
          placeholder="e.g. Breakfast"
          maxlength="40"
          :error="addError"
          class="flex-1"
          @update:model-value="addError = ''"
        />
        <Button variant="primary" icon="plus" :loading="adding" loading-label="Adding category">
          Add category
        </Button>
      </div>
    </form>

    <div v-if="loading" class="space-y-3" aria-busy="true">
      <Skeleton v-for="i in 5" :key="i" class="h-16 rounded-lg" />
    </div>

    <ErrorState v-else-if="error" title="We could not load categories" :message="error" @retry="load" />

    <EmptyState
      v-else-if="!categories.length"
      title="No categories yet"
      message="Create your first category to organise the menu."
      icon="tag"
    />

    <ul v-else class="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
      <li
        v-for="cat in categories"
        :key="cat.id"
        class="flex items-center gap-3 border-b border-gray-100 p-4 last:border-b-0 transition-colors duration-150 hover:bg-gray-50"
      >
        <span
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-xl"
          :style="{ background: `hsl(${cat.hue} 70% 94%)` }"
        >
          {{ cat.emoji }}
        </span>
        <div class="min-w-0 flex-1">
          <input
            v-if="editingId === cat.id"
            v-model="editName"
            type="text"
            maxlength="40"
            :aria-label="`Rename ${cat.name}`"
            class="h-11 w-full rounded-md border border-orange-700 bg-white px-3 text-base text-gray-900 focus:ring-2 focus:ring-orange-700/20"
            @keydown.enter.prevent="rename(cat)"
            @keydown.escape="editingId = null"
          />
          <p v-else class="truncate text-base font-semibold text-gray-900">{{ cat.name }}</p>
          <p class="text-sm tabular-nums text-gray-500">
            {{ countFor(cat.id) }} product{{ countFor(cat.id) === 1 ? '' : 's' }}
          </p>
        </div>
        <div class="flex items-center gap-1">
          <template v-if="editingId === cat.id">
            <Button variant="primary" size="sm" icon="check" @click="rename(cat)">Save</Button>
            <Button variant="ghost" size="sm" @click="editingId = null">Cancel</Button>
          </template>
          <template v-else>
            <button
              type="button"
              class="flex h-11 w-11 items-center justify-center rounded-md text-gray-500 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900"
              :aria-label="`Rename ${cat.name}`"
              @click="startRename(cat)"
            >
              <Icon name="pencil" :size="18" />
            </button>
            <button
              type="button"
              class="flex h-11 w-11 items-center justify-center rounded-md text-gray-500 transition-colors duration-150 hover:bg-red-50 hover:text-red-600"
              :aria-label="`Delete ${cat.name}`"
              @click="askDelete(cat)"
            >
              <Icon name="trash" :size="18" />
            </button>
          </template>
        </div>
      </li>
    </ul>

    <!-- Delete confirmation: explains consequence when products are attached -->
    <Modal
      v-model="deleteOpen"
      title="Delete category"
      @close="pendingDelete = null"
    >
      <div v-if="pendingDelete" class="space-y-4">
        <p v-if="countFor(pendingDelete.id) > 0" class="flex items-start gap-2.5 text-sm leading-relaxed text-gray-600">
          <Icon name="warning" :size="20" class="mt-0.5 shrink-0 text-amber-600" />
          <span>
            <span class="font-semibold text-gray-900">{{ pendingDelete.name }}</span>
            has {{ countFor(pendingDelete.id) }} product{{ countFor(pendingDelete.id) === 1 ? '' : 's' }}.
            Deleting this category will move those products to
            <span class="font-medium text-gray-900">Uncategorized</span>. They will stay on the menu.
          </span>
        </p>
        <p v-else class="text-sm leading-relaxed text-gray-600">
          <span class="font-semibold text-gray-900">{{ pendingDelete.name }}</span> is empty.
          It will be removed permanently.
        </p>
      </div>
      <template #footer>
        <Button variant="secondary" @click="deleteOpen = false; pendingDelete = null">Keep category</Button>
        <Button variant="destructive" icon="trash" :loading="deleting" loading-label="Deleting category" @click="confirmDelete">
          Delete category
        </Button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Icon from '../../components/Icon.vue'
import Button from '../../components/Button.vue'
import Input from '../../components/Input.vue'
import Skeleton from '../../components/Skeleton.vue'
import EmptyState from '../../components/EmptyState.vue'
import ErrorState from '../../components/ErrorState.vue'
import Modal from '../../components/Modal.vue'
import * as api from '../../lib/api.js'
import { toast, errorToast } from '../../store/toast.js'

const categories = ref([])
const products = ref([])
const loading = ref(true)
const error = ref('')
const newName = ref('')
const addError = ref('')
const adding = ref(false)

const editingId = ref(null)
const editName = ref('')

const deleteOpen = ref(false)
const pendingDelete = ref(null)
const deleting = ref(false)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [c, p] = await Promise.all([api.listCategories(), api.listProducts({})])
    categories.value = c
    products.value = p
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function countFor(categoryId) {
  return products.value.filter((p) => p.categoryId === categoryId).length
}

async function add() {
  addError.value = ''
  if (!newName.value.trim()) {
    addError.value = 'Enter a category name.'
    return
  }
  adding.value = true
  try {
    await api.createCategory(newName.value)
    newName.value = ''
    toast({ title: 'Category added', tone: 'success', duration: 2600 })
    await load()
  } catch (e) {
    addError.value = e.message
  } finally {
    adding.value = false
  }
}

function startRename(cat) {
  editingId.value = cat.id
  editName.value = cat.name
}

async function rename(cat) {
  if (!editName.value.trim()) {
    errorToast('Name required', 'Enter a category name.')
    return
  }
  try {
    await api.renameCategory(cat.id, editName.value)
    editingId.value = null
    toast({ title: 'Category renamed', tone: 'success', duration: 2200 })
    await load()
  } catch (e) {
    errorToast('Could not rename', e.message)
  }
}

function askDelete(cat) {
  pendingDelete.value = cat
  deleteOpen.value = true
}

async function confirmDelete() {
  if (!pendingDelete.value) return
  const affectedIds = products.value
    .filter((p) => p.categoryId === pendingDelete.value.id)
    .map((p) => p.id)
  deleting.value = true
  try {
    const result = await api.deleteCategory(pendingDelete.value.id)
    const { removed } = result
    deleteOpen.value = false
    pendingDelete.value = null
    toast({
      title: 'Category deleted',
      message: affectedIds.length ? `${affectedIds.length} product${affectedIds.length === 1 ? '' : 's'} moved to Uncategorized.` : '',
      action: {
        label: 'Undo',
        onClick: async () => {
          // Restore: recreate the category and move its products back
          const restored = await api.createCategory(removed.name)
          await Promise.all(
            affectedIds.map((id) => api.updateProduct(id, { categoryId: restored.id }))
          )
          await load()
          toast({ title: 'Category restored', tone: 'success', duration: 2200 })
        },
      },
    })
    await load()
  } catch (e) {
    errorToast('Could not delete category', e.message)
  } finally {
    deleting.value = false
  }
}

onMounted(load)
</script>
