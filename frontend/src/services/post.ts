import api from './api'

export interface Post {
  id: number
  user_id: number
  title: string
  content: string
  is_anonymous: boolean
  images: string[]
  circle_id?: number
  like_count: number
  comment_count: number
  created_at: string
  updated_at: string
  user: {
    id: number
    username: string
    avatar?: string
  }
  circle?: {
    id: number
    name: string
  }
  is_liked?: boolean
}

export interface CreatePostRequest {
  title: string
  content: string
  is_anonymous?: boolean
  images?: string[]
  circle_id?: number
}

export interface UpdatePostRequest {
  title?: string
  content?: string
  is_anonymous?: boolean
  images?: string[]
}

export interface PostQueryParams {
  page?: number
  limit?: number
  search?: string
  sort?: 'latest' | 'popular' | 'trending'
}

export const postService = {
  // 获取帖子列表
  getPosts: async (params: PostQueryParams = {}): Promise<{ posts: Post[]; total: number; page: number; limit: number }> => {
    return api.get('/posts', { params })
  },

  // 获取帖子详情
  getPostById: async (id: number): Promise<{ post: Post }> => {
    return api.get(`/posts/${id}`)
  },

  // 创建帖子
  createPost: async (data: CreatePostRequest): Promise<{ post: Post; message: string }> => {
    return api.post('/posts', data)
  },

  // 更新帖子
  updatePost: async (id: number, data: UpdatePostRequest): Promise<{ post: Post; message: string }> => {
    return api.put(`/posts/${id}`, data)
  },

  // 删除帖子
  deletePost: async (id: number): Promise<{ message: string }> => {
    return api.delete(`/posts/${id}`)
  },

  // 点赞帖子
  likePost: async (id: number): Promise<{ message: string; liked: boolean; like_count: number }> => {
    return api.post(`/posts/${id}/like`)
  }
}