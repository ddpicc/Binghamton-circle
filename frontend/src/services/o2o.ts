import api from './api'

export interface O2OItem {
  id: number
  user_id: number
  title: string
  description: string
  category_id: number
  price: number
  price_type: 'fixed' | 'negotiable' | 'free'
  condition: string
  location: string
  contact_info: string
  tags: string[]
  images: string[]
  expire_date: string
  status: 'available' | 'sold' | 'expired' | 'reserved'
  created_at: string
  updated_at: string
  user: {
    id: number
    username: string
    nickname?: string
    avatar?: string
  }
  category: {
    id: number
    code?: string
    name: string
    description?: string
    icon?: string
  }
  is_liked?: boolean
  like_count: number
}

export interface CreateO2OItemRequest {
  title: string
  description: string
  category_id: number
  price?: number
  price_type?: 'fixed' | 'negotiable' | 'free'
  condition: string
  location: string
  contact_info: string
  tags?: string[]
  images?: string[]
  expire_date?: string
}

export interface UpdateO2OItemRequest {
  title?: string
  description?: string
  category_id?: number
  price?: number
  price_type?: 'fixed' | 'negotiable' | 'free'
  condition?: string
  location?: string
  contact_info?: string
  tags?: string[]
  images?: string[]
  expire_date?: string
  status?: 'available' | 'sold' | 'expired' | 'reserved'
}

export interface O2OQueryParams {
  page?: number
  limit?: number
  search?: string
  category_id?: number
  user_id?: number
  status?: string
  price_type?: string
  min_price?: number
  max_price?: number
  sort?: 'latest' | 'price_low' | 'price_high' | 'popular'
}

export interface O2OCategory {
  id: number
  code?: string
  name: string
  description?: string
  icon?: string
  created_at: string
}

export const o2oService = {
  // 获取O2O物品列表
  getO2OItems: async (params: O2OQueryParams = {}): Promise<{ items: O2OItem[]; total: number; page: number; limit: number }> => {
    return api.get('/o2o', { params })
  },

  // 获取O2O物品详情
  getO2OItemById: async (id: number): Promise<{ item: O2OItem }> => {
    return api.get(`/o2o/${id}`)
  },

  // 创建O2O物品
  createO2OItem: async (data: CreateO2OItemRequest): Promise<{ item: O2OItem; message: string }> => {
    return api.post('/o2o', data)
  },

  // 更新O2O物品
  updateO2OItem: async (id: number, data: UpdateO2OItemRequest): Promise<{ item: O2OItem; message: string }> => {
    return api.put(`/o2o/${id}`, data)
  },

  // 删除O2O物品
  deleteO2OItem: async (id: number): Promise<{ message: string }> => {
    return api.delete(`/o2o/${id}`)
  },

  // 点赞O2O物品
  likeO2OItem: async (id: number): Promise<{ message: string; liked: boolean; like_count: number }> => {
    return api.post(`/o2o/${id}/like`)
  },

  // 搜索O2O物品
  searchO2OItems: async (params: O2OQueryParams = {}): Promise<{ items: O2OItem[]; total: number; page: number; limit: number }> => {
    return api.get('/o2o/search', { params })
  },

  // 获取用户O2O物品
  getUserO2OItems: async (userId: number, page = 1, limit = 10): Promise<{ items: O2OItem[]; total: number; page: number; limit: number }> => {
    return api.get(`/o2o/user/${userId}`, { params: { page, limit } })
  },

  // 获取O2O分类列表
  getCategories: async (): Promise<{ categories: O2OCategory[] }> => {
    return api.get('/o2o/categories')
  }
}
