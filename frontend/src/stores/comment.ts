import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { commentService } from '@/services/comment'
import type { Comment } from '@/types'

export const useCommentStore = defineStore('comment', () => {
  const comments = ref<Comment[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const getCommentsByPostId = (postId: number) => {
    return comments.value.filter(comment => comment.post_id === postId)
  }

  const fetchComments = async (postId: number, page = 1, limit = 20) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await commentService.getComments(postId, page, limit)
      
      // 更新评论列表
      const existingComments = comments.value.filter(c => c.post_id !== postId)
      comments.value = [...existingComments, ...response.comments]
      
      return response
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || '获取评论失败'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  const createComment = async (postId: number, data: any) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await commentService.createComment(postId, data)
      
      // 添加到评论列表
      comments.value.unshift(response.comment)
      
      return response
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || '创建评论失败'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  const deleteComment = async (postId: number, commentId: number) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await commentService.deleteComment(postId, commentId)
      
      // 从评论列表中移除
      comments.value = comments.value.filter(c => c.id !== commentId)
      
      return response
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || '删除评论失败'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  const likeComment = async (postId: number, commentId: number) => {
    try {
      const response = await commentService.likeComment(postId, commentId)
      
      // 更新评论点赞状态
      const comment = comments.value.find(c => c.id === commentId)
      if (comment) {
        comment.is_liked = response.liked
        comment.like_count = response.like_count
      }
      
      return response
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || '点赞评论失败'
      throw error.value
    }
  }

  const clearComments = (postId: number) => {
    comments.value = comments.value.filter(c => c.post_id !== postId)
  }

  const clearError = () => {
    error.value = null
  }

  return {
    comments,
    loading,
    error,
    getCommentsByPostId,
    fetchComments,
    createComment,
    deleteComment,
    likeComment,
    clearComments,
    clearError
  }
})