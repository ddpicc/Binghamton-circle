import { get, post, put, del } from '../utils/request'

export function fetchCircles(params = {}) {
  return get('/circles', params)
}

export function fetchMyCircles(params = {}) {
  return get('/circles/my', params)
}

export function fetchCircleDetail(id) {
  return get(`/circles/${id}`)
}

export function joinCircle(id) {
  return post(`/circles/${id}/join`)
}

export function quitCircle(id) {
  return post(`/circles/${id}/leave`)
}

export function fetchCirclePosts(id, params = {}) {
  return get(`/circles/${id}/posts`, params)
}

export function createCirclePost(circleId, data) {
  return post('/posts', { ...data, circle_id: circleId })
}

export function deleteCirclePost(postId) {
  return del(`/posts/${postId}`)
}

export function createCircleComment(postId, data) {
  return post(`/comments/post/${postId}`, data)
}

export function fetchCircleMembers(circleId, params = {}) {
  return get(`/circles/${circleId}/members`, params)
}

export function fetchPendingRequests(circleId) {
  return get(`/circles/${circleId}/pending-requests`)
}

export function handleJoinRequest(circleId, memberId, payload) {
  return post(`/circles/${circleId}/requests/${memberId}/handle`, payload)
}

export function removeCircleMember(circleId, memberId) {
  return del(`/circles/${circleId}/members/${memberId}`)
}

export function transferCircle(circleId, targetMemberId) {
  return post(`/circles/${circleId}/transfer`, { target_member_id: targetMemberId })
}

export function updateCircle(circleId, data) {
  return put(`/circles/${circleId}`, data)
}

export function createCircle(data) {
  return post('/circles', data)
}
