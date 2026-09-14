import api from './api'

export interface Comment {
  id: number
  post_id: number
  user_id: number
  content: string
  created_at: string
  user: {
    id: number
    username: string
    avatar?: string
  }
  replies?: Comment[]
  is_liked?: boolean
  like_count: number
}

export interface CreateCommentRequest {
  content: string
  parentId?: number
}

export const commentService = {
  // 获取帖子评论
  getComments: async (
    postId: number,
    page = 1,
    limit = 20,
    parentId?: number
  ): Promise<{ comments: Comment[]; pagination?: any; total?: number; page?: number; limit?: number }> => {
    return api.get(`/comments/post/${postId}`, { params: { page, limit, parentId } })
  },

  // 创建评论
  createComment: async (postId: number, data: CreateCommentRequest): Promise<{ comment: Comment; message: string }> => {
    return api.post(`/comments/post/${postId}`, data)
  },

  // 删除评论
  deleteComment: async (_postId: number, commentId: number): Promise<{ message: string }> => {
    return api.delete(`/comments/${commentId}`)
  },

  // 点赞评论
  likeComment: async (_postId: number, commentId: number): Promise<{ message: string; liked: boolean; like_count: number }> => {
    return api.post(`/comments/${commentId}/like`)
  }
}
