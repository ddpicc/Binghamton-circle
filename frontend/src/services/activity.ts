import api from './api'

export interface Activity {
  id: number
  user_id: number
  title: string
  location?: string | null
  time: string
  description?: string | null
  participant_count: number
  max_participants?: number | null
  created_at: string
  updated_at: string
  publisher?: {
    id?: number
    username?: string
    nickname?: string
    avatar?: string | null
  }
  is_joined?: boolean
}

export interface CreateActivityRequest {
  title: string
  location?: string
  time: string | Date
  description?: string
  max_participants?: number
}

export const activityService = {
  getActivities: async (params: { page?: number; limit?: number; sortBy?: string; sortOrder?: string } = {}) => {
    return api.get('/activities', { params })
  },
  createActivity: async (data: CreateActivityRequest) => {
    return api.post('/activities', data)
  },
  updateActivity: async (id: number, data: CreateActivityRequest) => {
    return api.put(`/activities/${id}`, data)
  },
  getActivityById: async (id: number) => {
    return api.get(`/activities/${id}`)
  },
  toggleJoin: async (id: number) => {
    return api.post(`/activities/${id}/join`)
  }
}
