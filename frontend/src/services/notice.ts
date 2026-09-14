import api from './api'

export interface Notice {
  id: number
  user_id: number
  title: string
  content: string
  category: string
  is_pinned: boolean
  created_at: string
  updated_at: string
  user: {
    id: number
    username: string
    avatar?: string
  }
}

export interface CreateNoticeRequest {
  title: string
  content: string
  category: string
  is_pinned?: boolean
}

export interface NoticeQueryParams {
  page?: number
  limit?: number
  category?: string
  search?: string
  is_pinned?: boolean
}

export const noticeService = {
  // 获取通知列表
  getNotices: async (params: NoticeQueryParams = {}): Promise<{ notices: Notice[]; total: number; page: number; limit: number }> => {
    return api.get('/notices', { params })
  },

  // 获取通知详情
  getNoticeById: async (id: number): Promise<{ notice: Notice }> => {
    return api.get(`/notices/${id}`)
  },

  // 创建通知（管理员）
  createNotice: async (data: CreateNoticeRequest): Promise<{ notice: Notice; message: string }> => {
    return api.post('/notices', data)
  },

  // 更新通知（管理员）
  updateNotice: async (id: number, data: Partial<CreateNoticeRequest>): Promise<{ notice: Notice; message: string }> => {
    return api.put(`/notices/${id}`, data)
  },

  // 删除通知（管理员）
  deleteNotice: async (id: number): Promise<{ message: string }> => {
    return api.delete(`/notices/${id}`)
  }
}