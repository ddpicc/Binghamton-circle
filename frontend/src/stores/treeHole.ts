import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { treeHoleApi } from '@/services/treeHole'
import type { TreeHolePost, TreeHoleComment, TreeHolePostCreateData } from '@/types'

export const useTreeHoleStore = defineStore('treeHole', () => {
  const posts = ref<TreeHolePost[]>([])
  const comments = ref<{ [postId: number]: TreeHoleComment[] }>({})
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 获取帖子列表
  const fetchPosts = async (params?: {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: string
  }) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await treeHoleApi.getPosts(params)
      posts.value = response.posts
      return response
    } catch (err: any) {
      error.value = err.message || '获取帖子列表失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 创建帖子
  const createPost = async (data: TreeHolePostCreateData) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await treeHoleApi.createPost(data)
      // 将新帖子添加到列表开头
      posts.value.unshift(response.post)
      return response
    } catch (err: any) {
      error.value = err.message || '创建帖子失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 更新帖子
  const updatePost = async (id: number, data: Partial<TreeHolePostCreateData>) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await treeHoleApi.updatePost(id, data)
      // 更新本地帖子
      const index = posts.value.findIndex(post => post.id === id)
      if (index !== -1) {
        posts.value[index] = response.post
      }
      return response
    } catch (err: any) {
      error.value = err.message || '更新帖子失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 删除帖子
  const deletePost = async (id: number) => {
    loading.value = true
    error.value = null
    
    try {
      await treeHoleApi.deletePost(id)
      // 从本地列表中移除
      posts.value = posts.value.filter(post => post.id !== id)
      // 清理相关评论
      delete comments.value[id]
    } catch (err: any) {
      error.value = err.message || '删除帖子失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 点赞帖子
  const likePost = async (id: number) => {
    error.value = null
    
    try {
      const response = await treeHoleApi.toggleLike(id)
      // 更新本地点赞数和状态
      const post = posts.value.find(p => p.id === id)
      if (post) {
        post.is_liked = response.liked
        const next = response.liked ? post.like_count + 1 : post.like_count - 1
        post.like_count = Math.max(0, next)
      }
      return response
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || '点赞操作失败'
      throw err
    }
  }

  // 获取评论
  const fetchComments = async (postId: number, params?: { page?: number; limit?: number }) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await treeHoleApi.getComments(postId, params)
      comments.value[postId] = response?.comments || (response as any)?.data?.comments || []
      return response
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || '获取评论失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 创建评论
  const createComment = async (postId: number, data: { content: string; parent_id?: number }) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await treeHoleApi.createComment(postId, data)
      // 添加到本地评论列表
      if (!comments.value[postId]) {
        comments.value[postId] = []
      }
      comments.value[postId].unshift(response.comment)
      
      // 更新帖子评论数
      const post = posts.value.find(p => p.id === postId)
      if (post) {
        post.comment_count++
      }
      
      return response
    } catch (err: any) {
      error.value = err.message || '创建评论失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 根据帖子ID获取评论
  const getCommentsByPostId = (postId: number) => {
    return comments.value[postId] || []
  }

  // 清空错误
  const clearError = () => {
    error.value = null
  }

  // 重置状态
  const reset = () => {
    posts.value = []
    comments.value = {}
    loading.value = false
    error.value = null
  }

  return {
    // 状态
    posts,
    comments,
    loading,
    error,
    
    // 计算属性
    getCommentsByPostId,
    
    // 方法
    fetchPosts,
    createPost,
    updatePost,
    deletePost,
    likePost,
    fetchComments,
    createComment,
    clearError,
    reset
  }
})
