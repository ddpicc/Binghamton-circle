import { get, post, put, del } from '../utils/request'

export function fetchNotices(params = {}) {
  return get('/notices', params)
}

export function fetchNoticeDetail(id) {
  return get(`/notices/${id}`)
}

export function createNotice(data) {
  return post('/notices', data)
}

export function updateNotice(id, data) {
  return put(`/notices/${id}`, data)
}

export function deleteNotice(id) {
  return del(`/notices/${id}`)
}
