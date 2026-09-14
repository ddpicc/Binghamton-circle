import { get, post, del } from '../utils/request'

const ROOT = '/tree-hole'

export function fetchPosts(params = {}, options = {}) {
  return get(ROOT, params, { authMode: 'optional', ...options })
}

export function fetchPostById(id, options = {}) {
  return get(`${ROOT}/${id}`, {}, { authMode: 'optional', ...options })
}

export function createPost(data) {
  return post(ROOT, data)
}

export function deletePost(id) {
  return del(`${ROOT}/${id}`)
}

export function toggleLike(id) {
  return post(`${ROOT}/${id}/like`)
}

export function fetchComments(id, options = {}) {
  return get(`${ROOT}/${id}/comments`, {}, { authMode: 'optional', ...options })
}

export function createComment(id, data) {
  return post(`${ROOT}/${id}/comments`, data)
}

export function createReply(id, commentId, data) {
  return post(`${ROOT}/${id}/comments/${commentId}`, data)
}
