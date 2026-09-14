import { get, put } from '../utils/request'

export function fetchProfileOverview() {
  return get('/users/profile')
}

export function updateProfile(data) {
  return put('/users/profile', data)
}

export function fetchMyPosts(params = {}) {
  return get('/users/me/posts', params)
}

export function fetchMyFavorites(params = {}) {
  return get('/users/me/favorites', params)
}

export function updatePreferences(data) {
  return put('/users/me/preferences', data)
}
