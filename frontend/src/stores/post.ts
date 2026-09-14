import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { postService } from '@/services/post'
import type { Post } from '@/types'

export const usePostStore = defineStore('post', () => {
  const posts = ref<Post[]>([])
  const currentPost = ref<Post | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  const hasMore = computed(() => pagination.value.page < pagination.value.totalPages)

  // 获取帖子列表
  const fetchPosts = async (params: any = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await postService.getPosts({
        page: pagination.value.page,
        limit: pagination.value.limit,
        ...params
      })
      
      posts.value = response.posts
      pagination.value = {
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: Math.ceil(response.total / response.limit)
      }
      
      return response
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || '获取帖子列表失败'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  // 获取帖子详情
  const fetchPostById = async (id: number) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await postService.getPostById(id)
      currentPost.value = response.post
      
      return response
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || '获取帖子详情失败'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  // 创建帖子
  const createPost = async (postData: any) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await postService.createPost(postData)
      
      // 添加到列表开头
      posts.value.unshift(response.post)
      
      return response
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || '创建帖子失败'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  // 更新帖子
  const updatePost = async (id: number, postData: any) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await postService.updatePost(id, postData)
      
      // 更新列表中的帖子
      const index = posts.value.findIndex(post => post.id === id)
      if (index !== -1) {
        posts.value[index] = response.post
      }
      
      // 更新当前帖子
      if (currentPost.value?.id === id) {
        currentPost.value = response.post
      }
      
      return response
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || '更新帖子失败'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  // 删除帖子
  const deletePost = async (id: number) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await postService.deletePost(id)
      
      // 从列表中移除
      posts.value = posts.value.filter(post => post.id !== id)
      
      // 清除当前帖子
      if (currentPost.value?.id === id) {
        currentPost.value = null
      }
      
      return response
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || '删除帖子失败'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  // 点赞帖子
  const likePost = async (id: number) => {
    try {
      const response = await postService.likePost(id)
      
      // 更新帖子点赞状态
      const post = posts.value.find(p => p.id === id)
      if (post) {
        post.is_liked = response.liked
        post.like_count = response.like_count
      }
      
      if (currentPost.value?.id === id) {
        currentPost.value.is_liked = response.liked
        currentPost.value.like_count = response.like_count
      }
      
      return response
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || '点赞失败'
      throw error.value
    }
  }

  // 重置分页
  const resetPagination = () => {
    pagination.value = {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    }
  }

  // 加载更多
  const loadMore = async (params: any = {}) => {
    if (!hasMore.value) return
    
    pagination.value.page += 1
    await fetchPosts(params)
  }

  // 清除错误
  const clearError = () => {
    error.value = null
  }

  return {
    posts,
    currentPost,
    loading,
    error,
    pagination,
    hasMore,
    fetchPosts,
    fetchPostById,
    createPost,
    updatePost,
    deletePost,
    likePost,
    resetPagination,
    loadMore,
    clearError
  }
})