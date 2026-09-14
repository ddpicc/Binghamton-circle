export interface User {
  id: number
  username: string
  nickname?: string
  email: string
  school_email?: string
  role: 'user' | 'admin'
  avatar?: string
  bio?: string
  status: 'active' | 'inactive' | 'banned'
  created_at: string
  updated_at: string
}

export interface Post {
  id: number
  user_id: number
  title: string
  content: string
  is_anonymous: boolean
  images: string[]
  like_count: number
  comment_count: number
  created_at: string
  updated_at: string
  user: User
  is_liked?: boolean
}

export interface Comment {
  id: number
  post_id: number
  user_id: number
  content: string
  created_at: string
  user: User
  replies?: Comment[]
  is_liked?: boolean
  like_count: number
}

export interface Notice {
  id: number
  user_id: number
  title: string
  content: string
  category: string
  is_pinned: boolean
  created_at: string
  updated_at: string
  user: User
}

export interface O2OItem {
  id: number
  user_id: number
  title: string
  description: string
  category_id: number
  price: number
  price_type: 'fixed' | 'negotiable' | 'free'
  condition: string
  location: string
  contact_info: string
  tags: string[]
  images: string[]
  expire_date: string
  status: 'available' | 'sold' | 'expired' | 'reserved'
  created_at: string
  updated_at: string
  user: User
  category: O2OCategory
  is_liked?: boolean
  like_count: number
}

export interface O2OCategory {
  id: number
  name: string
  description?: string
  created_at: string
}

export interface UploadedFile {
  filename: string
  originalName: string
  mimetype: string
  size: number
  path: string
  url: string
}

export interface ApiResponse<T> {
  message: string
  data: T
  success?: boolean
}

export interface Circle {
  id: number
  name: string
  description: string
  category_id: number
  creator_id: number
  is_private: boolean
  is_public?: boolean
  need_approval?: boolean
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

export interface TreeHolePost {
  id: number
  content: string
  images?: string[]
  tags?: string[]
  like_count: number
  comment_count: number
  view_count: number
  is_pinned: boolean
  created_at: string
  updated_at: string
  author: {
    id: null
    username: '匿名'
    nickname: '匿名'
    avatar: null
  }
}

export interface TreeHoleComment {
  id: number
  content: string
  like_count: number
  created_at: string
  author: {
    id: null
    username: '匿名'
    nickname: '匿名'
    avatar: null
  }
  replies?: TreeHoleComment[]
}

export interface TreeHolePostCreateData {
  content: string
  tags?: string[]
  images?: string[]
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
