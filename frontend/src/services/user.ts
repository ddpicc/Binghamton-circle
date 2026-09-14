import api from './api'

export interface UserProfile {
  id: number
  username: string
  email: string
  school_email?: string
  nickname?: string
  role: string
  avatar?: string
  bio?: string
  school?: string
  major?: string
  grade?: string
  joinedAt?: string
  created_at: string
  updated_at: string
}

export interface UpdateProfileRequest {
  username?: string
  email?: string
  school_email?: string
  avatar?: string
  bio?: string
}

export const userService = {
  // 获取用户信息
  getProfile: async (): Promise<{ user: UserProfile }> => {
    return api.get('/users/profile')
  },

  // 获取指定用户信息
  getUserById: async (userId: number): Promise<{ user: UserProfile }> => {
    return api.get(`/users/${userId}/profile`)
  },

  // 更新用户信息
  updateProfile: async (data: UpdateProfileRequest): Promise<{ user: UserProfile; message: string }> => {
    return api.put('/users/profile', data)
  },

  // 获取用户帖子列表
  getUserPosts: async (
    userId: number,
    page = 1,
    limit = 10
  ): Promise<{ posts: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
    return api.get(`/posts/user/${userId}`, { params: { page, limit } })
  }
}
