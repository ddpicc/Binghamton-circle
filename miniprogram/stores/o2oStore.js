import { createStore } from '../utils/createStore'
import {
  fetchO2OList,
  fetchO2ODetail,
  fetchO2OCategories,
  createO2OItem,
  updateO2OItem,
  deleteO2OItem
} from '../services/o2o'
import { showSuccess } from '../utils/toast'

function normalizeCategory(category = {}) {
  const rawName = category.name || category.key || (category.id != null ? String(category.id) : '')
  const displayName = category.name || category.description || rawName || '未分类'
  return {
    ...category,
    displayName
  }
}

const o2oStore = createStore({
  items: [],
  categories: [],
  loading: false,
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
    hasMore: true
  },
  filters: {
    keyword: '',
    category: '',
    sort: 'latest'
  },
  currentItem: null
})

export default o2oStore

export async function loadCategories() {
  if (o2oStore.getState().categories.length) return
  try {
    const response = await fetchO2OCategories()
    const categories = response.categories || response.data || []
    o2oStore.setState({ categories: categories.map(normalizeCategory) })
  } catch (error) {
    console.error('Failed to load o2o categories:', error)
    o2oStore.setState({ categories: [] })
  }
}

export async function loadO2OList(params = {}) {
  o2oStore.setState({ loading: true })
  const state = o2oStore.getState()
  try {
    const page = params.page || state.pagination.page
    const pageSize = params.pageSize || state.pagination.pageSize
    const response = await fetchO2OList({
      page,
      limit: pageSize,
      search: params.keyword ?? state.filters.keyword,
      category: params.category ?? state.filters.category,
      sort: params.sort ?? state.filters.sort
    })
    const items = response.items || []
    const total = response.total || 0
    o2oStore.setState({
      items: page === 1 ? items : [...state.items, ...items],
      pagination: {
        page,
        pageSize,
        total,
        hasMore: page * pageSize < total
      },
      filters: {
        keyword: params.keyword ?? state.filters.keyword,
        category: params.category ?? state.filters.category,
        sort: params.sort ?? state.filters.sort
      }
    })
  } catch (error) {
    console.error('Failed to load o2o items:', error)
    o2oStore.setState({
      items: params.page && params.page > 1 ? state.items : [],
      pagination: {
        page: params.page || 1,
        pageSize: params.pageSize || state.pagination.pageSize,
        total: params.page && params.page > 1 ? state.pagination.total : 0,
        hasMore: false
      },
      filters: {
        keyword: params.keyword ?? state.filters.keyword,
        category: params.category ?? state.filters.category,
        sort: params.sort ?? state.filters.sort
      }
    })
  } finally {
    o2oStore.setState({ loading: false })
  }
}

export async function loadO2ODetail(id) {
  const detail = await fetchO2ODetail(id)
  const item = detail.item || detail
  o2oStore.setState({ currentItem: item })
  return item
}

export async function saveO2OItem(payload) {
  const itemId = payload.id
  if (itemId) {
    const response = await updateO2OItem(itemId, payload)
    showSuccess('已更新')
    return response
  }
  const response = await createO2OItem(payload)
  showSuccess('发布成功')
  return response
}

export async function removeO2OItem(id) {
  await deleteO2OItem(id)
  showSuccess('已删除')
  const { items } = o2oStore.getState()
  o2oStore.setState({ items: items.filter((item) => item.id !== id) })
}

export function resetO2OState() {
  o2oStore.setState({ currentItem: null })
}
