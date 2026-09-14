import { defineStore } from 'pinia'
import { ref } from 'vue'
import { activityService, type Activity, type CreateActivityRequest } from '@/services/activity'

export const useActivityStore = defineStore('activity', () => {
  const activities = ref<Activity[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchActivities = async (params?: { page?: number; limit?: number }) => {
    loading.value = true
    error.value = null
    try {
      const res: any = await activityService.getActivities(params || { page: 1, limit: 24 })
      activities.value = res.activities || res.data?.activities || []
      return res
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || '获取活动失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createActivity = async (data: CreateActivityRequest) => {
    loading.value = true
    error.value = null
    try {
      const res: any = await activityService.createActivity(data)
      const activity = res.activity || res.data?.activity
      if (activity) activities.value.unshift(activity)
      return res
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || '创建活动失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateActivity = async (id: number, data: CreateActivityRequest) => {
    loading.value = true
    error.value = null
    try {
      const res: any = await activityService.updateActivity(id, data)
      const activity = res.activity || res.data?.activity
      if (activity) {
        const index = activities.value.findIndex(a => a.id === id)
        if (index > -1) {
          activities.value[index] = activity
        }
      }
      return res
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || '更新活动失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const toggleJoin = async (id: number) => {
    loading.value = false
    error.value = null
    try {
      const res: any = await activityService.toggleJoin(id)
      const item = activities.value.find(a => a.id === id)
      if (item) {
        if (typeof res.participant_count === 'number') {
          item.participant_count = res.participant_count
        } else {
          item.participant_count = (item.participant_count || 0) + (res.joined ? 1 : -1)
          if (item.participant_count < 0) item.participant_count = 0
        }
        item.is_joined = !!res.joined
      }
      return res
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || '报名操作失败'
      throw err
    }
  }

  return {
    activities,
    loading,
    error,
    fetchActivities,
    createActivity,
    updateActivity,
    toggleJoin
  }
})
