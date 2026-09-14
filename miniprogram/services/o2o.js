import { get, post, put, del } from '../utils/request'

export function fetchO2OList(params = {}, options = {}) {
  return get('/o2o', params, { authMode: 'optional', ...options })
}

export function fetchO2ODetail(id, options = {}) {
  return get(`/o2o/${id}`, {}, { authMode: 'optional', ...options })
}

export function fetchO2OCategories(options = {}) {
  return get('/o2o/categories', {}, { authMode: 'optional', ...options })
}

export function createO2OItem(data) {
  return post('/o2o', data)
}

export function updateO2OItem(id, data) {
  return put(`/o2o/${id}`, data)
}

export function deleteO2OItem(id) {
  return del(`/o2o/${id}`)
}
