import { get, post, put, del } from '../utils/request'

export function fetchFollowingPosts(params = {}) {
  console.log('=== fetchFollowingPosts 调用 ===')
  console.log('请求参数:', params)

  // 清理参数，移除undefined和null值
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== undefined && value !== null)
  )

  console.log('清理后的参数:', cleanParams)

  // 手动构建查询字符串（微信小程序不支持URLSearchParams）
  const cacheBuster = `_t=${Date.now()}`
  let queryString = ''

  // 构建查询字符串
  const paramPairs = []
  for (const [key, value] of Object.entries(cleanParams)) {
    paramPairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
  }
  if (paramPairs.length > 0) {
    queryString = '?' + paramPairs.join('&') + '&' + cacheBuster
  } else {
    queryString = '?' + cacheBuster
  }

  const url = `/posts/user/circle-posts${queryString}`
  console.log('请求URL:', url)

  const result = get(`/posts/user/circle-posts`, cleanParams)

  // 添加Promise调试
  result
    .then(response => {
      console.log('=== fetchFollowingPosts 成功响应 ===')
      console.log('响应数据:', response)
      console.log('posts数量:', response?.posts?.length || response?.items?.length || 0)
    })
    .catch(error => {
      console.error('=== fetchFollowingPosts 错误 ===')
      console.error('错误详情:', error)
    })

  return result
}

export function createPost(payload) {
  return post('/posts', payload)
}

export function updatePost(postId, payload) {
  return put(`/posts/${postId}`, payload)
}

export function deletePost(postId) {
  return del(`/posts/${postId}`)
}

export function togglePostLike(postId) {
  return post(`/posts/${postId}/like`)
}

export function fetchPostById(postId) {
  return get(`/posts/${postId}`)
}

export function fetchPostComments(postId, params = {}) {
  return get(`/comments/post/${postId}`, params)
}

export function createPostComment(postId, payload) {
  return post(`/comments/post/${postId}`, payload)
}

export function deleteComment(commentId) {
  return del(`/comments/${commentId}`)
}

export function toggleCommentLike(commentId) {
  return post(`/comments/${commentId}/like`)
}
