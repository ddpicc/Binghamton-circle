import request from './api'

export interface Circle {
  id: number
  name: string
  description: string
  category_id: number
  creator_id: number
  is_private: boolean
  max_members?: number
  rules?: string
  cover_image?: string
  status: string
  member_count: number
  post_count: number
  created_at: string
  updated_at: string
  category?: {
    id: number
    name: string
    icon: string
  }
  creator?: {
    id: number
    username: string
  }
  is_member?: boolean
  user_role?: string
  can_view?: boolean
}

export interface CircleMember {
  id: number
  circle_id: number
  user_id: number
  role: 'creator' | 'admin' | 'member'
  status: 'pending' | 'approved' | 'rejected' | 'left'
  joined_at: string
  user?: {
    id: number
    username: string
    avatar?: string
    profile?: {
      nickname?: string
      bio?: string
    }
  }
}

export interface CircleCategory {
  id: number
  name: string
  description?: string
  icon?: string
  sort_order: number
  is_active: boolean
  circle_count?: number
}

export interface CreateCircleData {
  name: string
  description: string
  category_id: number
  is_public?: boolean
  need_approval?: boolean
  is_private?: boolean
  rules?: string
  cover_image?: string
  max_members?: number
}

export interface CircleListParams {
  page?: number
  limit?: number
  category_id?: number
  search?: string
  sort?: string
  order?: string
  sortBy?: string
  sortOrder?: string
  is_private?: boolean
}

export interface CircleListResponse {
  circles: Circle[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  total: number
  page: number
  limit: number
  totalPages: number
}

// 创建圈子
export const createCircle = (data: CreateCircleData) => {
  return request.post('/circles', data)
}

// 获取圈子列表
export const getCircles = async (params?: CircleListParams): Promise<CircleListResponse> => {
  const data: any = await request.get('/circles', { params })

  const circles: Circle[] = (data?.circles || data?.items || data?.data || []) as Circle[]

  const rawPage = data?.pagination?.page ?? data?.page ?? params?.page ?? 1
  const page = Number(rawPage) || 1

  const rawLimit = data?.pagination?.limit ?? data?.limit ?? params?.limit ?? circles.length ?? 10
  const limit = Number(rawLimit) || 10

  const rawTotal = data?.pagination?.total ?? data?.total ?? circles.length ?? 0
  const total = Number(rawTotal) || 0

  const computedTotalPages = Math.ceil(total / (limit || 1)) || 1
  const rawTotalPages = data?.pagination?.totalPages ?? data?.totalPages ?? computedTotalPages
  const totalPages = Number(rawTotalPages) || computedTotalPages

  return {
    circles,
    pagination: {
      page,
      limit,
      total,
      totalPages
    },
    total,
    page,
    limit,
    totalPages
  }
}

// 获取我的圈子
export const getMyCircles = () => {
  return request.get<Circle[]>('/circles/my')
}

// 获取圈子详情
export const getCircleById = (circleId: number) => {
  return request.get<Circle>(`/circles/${circleId}`)
}

// 更新圈子信息
export const updateCircle = (circleId: number, data: Partial<CreateCircleData>) => {
  return request.put(`/circles/${circleId}`, data)
}

// 删除圈子
export const deleteCircle = (circleId: number) => {
  return request.delete(`/circles/${circleId}`)
}

// 申请加入圈子
export const joinCircle = (circleId: number) => {
  return request.post(`/circles/${circleId}/join`)
}

// 退出圈子
export const leaveCircle = (circleId: number) => {
  return request.post(`/circles/${circleId}/leave`)
}

// 获取圈子成员列表
export const getCircleMembers = (circleId: number, params?: { page?: number; limit?: number; role?: string; status?: string }) => {
  return request.get(`/circles/${circleId}/members`, { params })
}

// 获取待审核申请
export const getPendingRequests = (circleId: number) => {
  return request.get<CircleMember[]>(`/circles/${circleId}/pending-requests`)
}

// 处理加入申请
export const handleJoinRequest = (circleId: number, memberId: number, action: 'approve' | 'reject', reason?: string) => {
  return request.post(`/circles/${circleId}/requests/${memberId}/handle`, {
    action,
    reason
  })
}

// 移除成员
export const removeMember = (circleId: number, memberId: number) => {
  return request.delete(`/circles/${circleId}/members/${memberId}`)
}

// 获取圈子帖子列表
export const getCirclePosts = (circleId: number, params?: { page?: number; limit?: number; sort?: string; order?: string }) => {
  return request.get(`/circles/${circleId}/posts`, { params })
}

// 获取用户已加入圈子的帖子列表
export const getUserCirclePosts = (params?: { page?: number; limit?: number; circle_id?: number; sort?: string; order?: string }) => {
  return request.get('/posts/user/circle-posts', { params })
}

export const transferCircle = (circleId: number, targetMemberId: number) => {
  return request.post(`/circles/${circleId}/transfer`, {
    target_member_id: targetMemberId
  })
}
