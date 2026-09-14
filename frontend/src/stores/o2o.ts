import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { o2oService } from '@/services/o2o'
import type { O2OItem, O2OCategory } from '@/services/o2o'

const CLOUD_FILE_ID_PATTERN = /^cloud:\/\/([^/]+)\/(.+)$/

const normalizeMediaUrl = (url: unknown): string => {
  if (typeof url !== 'string') return ''
  const trimmed = url.trim()
  if (!trimmed) return ''

  // 小程序本地临时路径在 Web 无法访问
  if (trimmed.startsWith('wxfile://')) return ''

  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith('//')) return `https:${trimmed}`

  // cloud://env.bucket/path -> https://bucket.tcb.qcloud.la/path
  const matched = trimmed.match(CLOUD_FILE_ID_PATTERN)
  if (matched) {
    const bucket = matched[1].split('.').slice(1).join('.')
    const cloudPath = matched[2]
    if (bucket && cloudPath) {
      return `https://${bucket}.tcb.qcloud.la/${cloudPath}`
    }
  }

  if (trimmed.startsWith('/')) return trimmed
  return `/${trimmed}`
}

const normalizeO2OItem = (item: O2OItem): O2OItem => {
  const rawImages = Array.isArray(item?.images) ? item.images : []
  const images = rawImages
    .map((img) => normalizeMediaUrl(img))
    .filter(Boolean)

  return {
    ...item,
    images,
    user: {
      ...item.user,
      avatar: normalizeMediaUrl(item?.user?.avatar) || undefined
    }
  }
}

export const useO2OStore = defineStore('o2o', () => {
  const items = ref<O2OItem[]>([])
  const categories = ref<O2OCategory[]>([])
  const currentItem = ref<O2OItem | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  const hasMore = computed(() => pagination.value.page < pagination.value.totalPages)

  // 获取O2O物品列表
  const fetchO2OItems = async (params: any = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await o2oService.getO2OItems({
        page: pagination.value.page,
        limit: pagination.value.limit,
        ...params
      })
      
      items.value = (response.items || []).map((item) => normalizeO2OItem(item))
      pagination.value = {
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: Math.ceil(response.total / response.limit)
      }
      
      return response
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || '获取物品列表失败'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  // 获取O2O物品详情
  const fetchO2OItemById = async (id: number) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await o2oService.getO2OItemById(id)
      console.log('O2O Store 响应:', response)
      // 检查响应结构
      if (response.item) {
        currentItem.value = normalizeO2OItem(response.item)
      } else {
        currentItem.value = normalizeO2OItem(response)
      }
      
      return response
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || '获取物品详情失败'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  // 创建O2O物品
  const createO2OItem = async (data: any) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await o2oService.createO2OItem(data)
      
      // 添加到列表开头
      items.value.unshift(normalizeO2OItem(response.item))
      
      return response
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || '创建物品失败'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  // 更新O2O物品
  const updateO2OItem = async (id: number, data: any) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await o2oService.updateO2OItem(id, data)
      
      // 更新列表中的物品
      const index = items.value.findIndex(item => item.id === id)
      if (index !== -1) {
        items.value[index] = normalizeO2OItem(response.item)
      }
      
      // 更新当前物品
      if (currentItem.value?.id === id) {
        currentItem.value = normalizeO2OItem(response.item)
      }
      
      return response
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || '更新物品失败'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  // 删除O2O物品
  const deleteO2OItem = async (id: number) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await o2oService.deleteO2OItem(id)
      
      // 从列表中移除
      items.value = items.value.filter(item => item.id !== id)
      
      // 清除当前物品
      if (currentItem.value?.id === id) {
        currentItem.value = null
      }
      
      return response
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || '删除物品失败'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  // 点赞O2O物品
  const likeO2OItem = async (id: number) => {
    try {
      const response = await o2oService.likeO2OItem(id)

      // 更新物品点赞状态
      const item = items.value.find(item => item.id === id)
      if (item) {
        item.is_liked = response.liked
        item.like_count = response.like_count
      }

      // 更新当前物品
      if (currentItem.value?.id === id) {
        currentItem.value.is_liked = response.liked
        currentItem.value.like_count = response.like_count
      }

      return response
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || '点赞失败'
      throw error.value
    }
  }

  // 搜索O2O物品
  const searchO2OItems = async (params: any = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await o2oService.searchO2OItems(params)
      
      items.value = (response.items || []).map((item) => normalizeO2OItem(item))
      pagination.value = {
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: Math.ceil(response.total / response.limit)
      }
      
      return response
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || '搜索失败'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  // 获取分类列表
  const fetchCategories = async () => {
    try {
      const response = await o2oService.getCategories()
      categories.value = response.categories
      
      return response
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || '获取分类失败'
      throw error.value
    }
  }

  // 重置分页
  const resetPagination = () => {
    pagination.value = {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    }
  }

  // 加载更多
  const loadMore = async (params: any = {}) => {
    if (!hasMore.value) return
    
    pagination.value.page += 1
    await fetchO2OItems(params)
  }

  // 清除错误
  const clearError = () => {
    error.value = null
  }

  return {
    items,
    categories,
    currentItem,
    loading,
    error,
    pagination,
    hasMore,
    fetchO2OItems,
    fetchO2OItemById,
    createO2OItem,
    updateO2OItem,
    deleteO2OItem,
    likeO2OItem,
    searchO2OItems,
    fetchCategories,
    resetPagination,
    loadMore,
    clearError
  }
})
