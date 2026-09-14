import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { noticeService } from '@/services/notice'
import type { Notice } from '@/types'

export const useNoticeStore = defineStore('notice', () => {
  const notices = ref<Notice[]>([])
  const currentNotice = ref<Notice | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  const hasMore = computed(() => pagination.value.page < pagination.value.totalPages)

  // 获取通知列表
  const fetchNotices = async (params: any = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await noticeService.getNotices({
        page: pagination.value.page,
        limit: pagination.value.limit,
        ...params
      })
      
      notices.value = response.notices
      pagination.value = {
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: Math.ceil(response.total / response.limit)
      }
      
      return response
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || '获取通知列表失败'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  // 获取通知详情
  const fetchNoticeById = async (id: number) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await noticeService.getNoticeById(id)
      currentNotice.value = response.notice
      
      return response
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || '获取通知详情失败'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  // 创建通知（管理员）
  const createNotice = async (data: any) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await noticeService.createNotice(data)
      
      // 添加到列表开头
      notices.value.unshift(response.notice)
      
      return response
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || '创建通知失败'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  // 更新通知（管理员）
  const updateNotice = async (id: number, data: any) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await noticeService.updateNotice(id, data)
      
      // 更新列表中的通知
      const index = notices.value.findIndex(notice => notice.id === id)
      if (index !== -1) {
        notices.value[index] = response.notice
      }
      
      // 更新当前通知
      if (currentNotice.value?.id === id) {
        currentNotice.value = response.notice
      }
      
      return response
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || '更新通知失败'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  // 删除通知（管理员）
  const deleteNotice = async (id: number) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await noticeService.deleteNotice(id)
      
      // 从列表中移除
      notices.value = notices.value.filter(notice => notice.id !== id)
      
      // 清除当前通知
      if (currentNotice.value?.id === id) {
        currentNotice.value = null
      }
      
      return response
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || '删除通知失败'
      throw error.value
    } finally {
      loading.value = false
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
    await fetchNotices(params)
  }

  // 清除错误
  const clearError = () => {
    error.value = null
  }

  return {
    notices,
    currentNotice,
    loading,
    error,
    pagination,
    hasMore,
    fetchNotices,
    fetchNoticeById,
    createNotice,
    updateNotice,
    deleteNotice,
    resetPagination,
    loadMore,
    clearError
  }
})