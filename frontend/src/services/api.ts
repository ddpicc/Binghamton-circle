import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : 'https://bu-connect.com/api')

const clearAuthStorage = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    console.log('[api] request', config.method, config.url, config.data)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  async (error) => {
    console.error('[api] response error', error)
    const originalRequest = error.config || {}
    const refreshToken = localStorage.getItem('refreshToken')

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      refreshToken &&
      !String(originalRequest.url || '').includes('/auth/refresh-token')
    ) {
      originalRequest._retry = true

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken }, {
          headers: {
            'Content-Type': 'application/json'
          }
        })

        const newAccessToken = response.data?.accessToken
        if (!newAccessToken) {
          throw new Error('No access token returned')
        }

        localStorage.setItem('token', newAccessToken)
        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        console.error('[api] refresh token failed', refreshError)
        clearAuthStorage()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    if (error.response?.status === 401) {
      clearAuthStorage()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
export { api }
