import api from './api'

export interface Message {
  id: number
  conversationId: number
  sender: {
    id: number
    username: string
    nickname: string
    avatar: string | null
  }
  receiver: {
    id: number
    username: string
    nickname: string
    avatar: string | null
  }
  content: string
  status: 'sent' | 'delivered' | 'read'
  createdAt: string
}

export interface Conversation {
  id: number
  targetUser: {
    id: number
    username: string
    nickname: string
    avatar: string | null
  }
  lastMessageAt: string | null
  unread: number
}

export interface ConversationResponse {
  conversation: Conversation
  messages: Message[]
  pagination: {
    hasMore: boolean
    nextBeforeId: number | null
  }
}

export interface UnreadSummary {
  userId: number
  unread: number
  lastMessageAt: string | null
}

export const messageService = {
  // 获取与指定用户的会话
  getConversation: async (userId: number, limit?: number, beforeId?: number): Promise<ConversationResponse> => {
    const params: any = {}
    if (limit) params.limit = limit
    if (beforeId) params.beforeId = beforeId
    
    return api.get(`/messages/conversations/${userId}`, { params })
  },

  // 发送消息
  sendMessage: async (userId: number, content: string): Promise<{ message: Message; conversation: Conversation }> => {
    return api.post(`/messages/conversations/${userId}/messages`, { content })
  },

  // 标记消息为已读
  markAsRead: async (userId: number): Promise<{ success: boolean }> => {
    return api.post(`/messages/conversations/${userId}/read`)
  },

  // 获取未读消息摘要
  getUnreadSummary: async (): Promise<{ summary: UnreadSummary[] }> => {
    return api.get('/messages/unread-summary')
  }
}