import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/auth'
import { userService } from '@/services/user'
import type { User } from '@/types'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const isAdminRole = (role: unknown) => {
    return typeof role === 'string' && role.toLowerCase().includes('admin')
  }
  const normalizeUser = (raw: any): User => {
    return {
      ...raw,
      username: raw?.username || raw?.nickname || '',
      role: isAdminRole(raw?.role) ? 'admin' : 'user'
    } as User
  }
  const isAdmin = computed(() => isAdminRole(user.value?.role))

  // 初始化用户状态
  const initUser = () => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    
    if (savedToken && savedUser) {
      token.value = savedToken
      user.value = normalizeUser(JSON.parse(savedUser))
    }
  }

  // 登录
  const login = async (username: string, password: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await authService.login({ username, password })
      token.value = response.accessToken
      user.value = normalizeUser(response.user)
      
      localStorage.setItem('token', response.accessToken)
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken)
      }
      localStorage.setItem('user', JSON.stringify(user.value))
      
      return response
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || '登录失败'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  // 注册
  const register = async (userData: any) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await authService.register(userData)
      token.value = response.accessToken
      user.value = normalizeUser(response.user)
      
      localStorage.setItem('token', response.accessToken)
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken)
      }
      localStorage.setItem('user', JSON.stringify(user.value))
      
      return response
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || '注册失败'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  // 邮箱验证码登录/注册
  const loginWithEmailCode = async (email: string, code: string) => {
    loading.value = true
    error.value = null

    try {
      const response = await authService.loginWithEmailCode({ email, code })
      token.value = response.accessToken
      user.value = normalizeUser(response.user)

      localStorage.setItem('token', response.accessToken)
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken)
      }
      localStorage.setItem('user', JSON.stringify(user.value))

      return response
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || '邮箱登录失败'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  // 退出登录
  const logout = async () => {
    try {
      if (token.value) {
        await authService.logout()
      }
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      token.value = null
      user.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
    }
  }

  // 更新用户信息
  const updateProfile = async (userData: any) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await userService.updateProfile(userData)
      user.value = normalizeUser(response.user)
      localStorage.setItem('user', JSON.stringify(user.value))
      
      return response
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || '更新失败'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  // 获取用户信息
  const fetchProfile = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await userService.getProfile()
      user.value = normalizeUser(response.user)
      localStorage.setItem('user', JSON.stringify(user.value))
      
      return response
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || '获取用户信息失败'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  // 清除错误
  const clearError = () => {
    error.value = null
  }

  return {
    user,
    token,
    loading,
    error,
    isLoggedIn,
    isAdmin,
    initUser,
    login,
    register,
    loginWithEmailCode,
    logout,
    updateProfile,
    fetchProfile,
    clearError
  }
})
