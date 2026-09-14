import api from './api'
import type { TreeHolePost, TreeHoleComment, TreeHolePostCreateData } from '@/types'

export const treeHoleApi = {
  // 获取树洞帖子列表
  getPosts: async (params?: {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: string
  }) => {
    const response = await api.get('/tree-hole', { params })
    return response
  },

  // 获取树洞帖子详情
  getPostById: async (id: number) => {
    const response = await api.get(`/tree-hole/${id}`)
    return response
  },

  // 创建树洞帖子
  createPost: async (data: TreeHolePostCreateData) => {
    const response = await api.post('/tree-hole', data)
    return response
  },

  // 更新树洞帖子
  updatePost: async (id: number, data: Partial<TreeHolePostCreateData>) => {
    const response = await api.put(`/tree-hole/${id}`, data)
    return response
  },

  // 删除树洞帖子
  deletePost: async (id: number) => {
    const response = await api.delete(`/tree-hole/${id}`)
    return response
  },

  // 点赞/取消点赞树洞帖子
  toggleLike: async (id: number) => {
    const response = await api.post(`/tree-hole/${id}/like`)
    return response
  },

  // 获取树洞帖子评论
  getComments: async (postId: number, params?: {
    page?: number
    limit?: number
  }) => {
    const response = await api.get(`/tree-hole/${postId}/comments`, { params })
    return response
  },

  // 创建树洞评论
  createComment: async (postId: number, data: {
    content: string
    parent_id?: number
  }) => {
    const response = await api.post(`/tree-hole/${postId}/comments`, data)
    return response
  }
}