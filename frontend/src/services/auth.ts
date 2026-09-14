import api from './api'

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  school_email?: string
}

export interface AuthResponse {
  message: string
  user: {
    id: number
    username: string
    email: string
    role: string
    avatar?: string
  }
  accessToken: string
  refreshToken?: string
}

export interface EmailVerifyRequest {
  email: string
  code: string
}

export const authService = {
  // 用户登录
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    return api.post('/auth/login', data)
  },

  // 用户注册（已废弃，保留兼容）
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    return api.post('/auth/register', data)
  },

  // 发送邮箱验证码
  sendEmailVerification: async (email: string): Promise<{ message: string }> => {
    return api.post('/auth/send-email-verification', { email })
  },

  // 邮箱验证码登录/注册
  loginWithEmailCode: async (data: EmailVerifyRequest): Promise<AuthResponse> => {
    return api.post('/auth/email/login', data)
  },

  // 提交非 edu 邮箱申请
  requestNonEduEmail: async (data: { username: string; email: string; reason?: string }): Promise<{ message: string; status: string }> => {
    return api.post('/auth/non-edu-request', data)
  },

  // 查询非 edu 邮箱申请状态
  getNonEduRequestStatus: async (params: { email?: string; username?: string }): Promise<{
    status: string
    request?: {
      personalEmail: string
      requestedUsername: string
      rejectedReason?: string
      adminNote?: string
      updatedAt?: string
    }
  }> => {
    return api.get('/auth/non-edu-request/status', { params })
  },

  // 校验非 edu 验证令牌
  fetchNonEduVerification: async (token: string): Promise<{ email: string; requestedUsername?: string; expiresAt: string }> => {
    return api.get(`/auth/non-edu-verify/${token}`)
  },

  // 完成非 edu 注册
  completeNonEduRegistration: async (data: { token: string; username: string; password: string }): Promise<AuthResponse> => {
    return api.post('/auth/non-edu-complete', data)
  },

  // 刷新token
  refreshToken: async (refreshToken: string): Promise<{ accessToken: string }> => {
    return api.post('/auth/refresh-token', { refreshToken })
  },

  // 退出登录
  logout: async (): Promise<{ message: string }> => {
    return api.post('/auth/logout')
  }
}
