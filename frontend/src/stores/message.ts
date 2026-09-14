import { defineStore } from 'pinia'
import { messageService, type UnreadSummary, type Conversation, type Message } from '@/services/messages'
import { ElMessage } from 'element-plus'

interface MessageState {
  unreadSummary: UnreadSummary[]
  conversations: Map<number, {
    conversation: Conversation
    messages: Message[]
    loading: boolean
    hasMore: boolean
    nextBeforeId: number | null
  }>
  loading: boolean
  error: string | null
}

export const useMessageStore = defineStore('message', {
  state: (): MessageState => ({
    unreadSummary: [],
    conversations: new Map(),
    loading: false,
    error: null
  }),

  getters: {
    hasUnreadMessages: (state) => {
      return state.unreadSummary.some(item => item.unread > 0)
    },
    
    getUnreadCount: (state) => (userId: number) => {
      const summary = state.unreadSummary.find(item => item.userId === userId)
      return summary ? summary.unread : 0
    },
    
    getTotalUnreadCount: (state) => {
      return state.unreadSummary.reduce((total, item) => total + item.unread, 0)
    },
    
    getConversation: (state) => (userId: number) => {
      return state.conversations.get(userId)
    }
  },

  actions: {
    // 获取未读消息摘要
    async fetchUnreadSummary() {
      try {
        this.loading = true
        const response = await messageService.getUnreadSummary()
        this.unreadSummary = response.summary
      } catch (error: any) {
        this.error = error.message || '获取未读消息失败'
        ElMessage.error(this.error)
      } finally {
        this.loading = false
      }
    },

    // 获取与指定用户的会话
    async fetchConversation(userId: number, limit: number = 20, beforeId?: number) {
      try {
        // 如果是首次加载，设置loading状态
        if (!beforeId) {
          const existing = this.conversations.get(userId)
          if (existing) {
            existing.loading = true
          } else {
            this.conversations.set(userId, {
              conversation: {} as Conversation,
              messages: [],
              loading: true,
              hasMore: false,
              nextBeforeId: null
            })
          }
        }

        const response = await messageService.getConversation(userId, limit, beforeId)
        
        const conversationData = {
          conversation: response.conversation,
          messages: beforeId ? [...response.messages, ...this.conversations.get(userId)?.messages || []] : response.messages,
          loading: false,
          hasMore: response.pagination.hasMore,
          nextBeforeId: response.pagination.nextBeforeId
        }
        
        this.conversations.set(userId, conversationData)
        
        return conversationData
      } catch (error: any) {
        this.error = error.message || '获取会话失败'
        ElMessage.error(this.error)
        
        // 更新loading状态
        const existing = this.conversations.get(userId)
        if (existing) {
          existing.loading = false
        }
        
        throw error
      }
    },

    // 发送消息
    async sendMessage(userId: number, content: string) {
      try {
        const response = await messageService.sendMessage(userId, content)
        
        // 更新会话中的消息列表
        const existing = this.conversations.get(userId)
        if (existing) {
          existing.messages.push(response.message)
          existing.conversation = response.conversation
        } else {
          // 如果会话不存在，创建新的会话
          this.conversations.set(userId, {
            conversation: response.conversation,
            messages: [response.message],
            loading: false,
            hasMore: false,
            nextBeforeId: null
          })
        }
        
        // 更新未读摘要
        await this.fetchUnreadSummary()
        
        return response.message
      } catch (error: any) {
        this.error = error.message || '发送消息失败'
        ElMessage.error(this.error)
        throw error
      }
    },

    // 标记消息为已读
    async markAsRead(userId: number) {
      try {
        await messageService.markAsRead(userId)
        
        // 更新会话中的消息状态
        const existing = this.conversations.get(userId)
        if (existing) {
          existing.messages.forEach(message => {
            if (message.receiver.id === userId) {
              message.status = 'read'
            }
          })
        }
        
        // 更新未读摘要
        await this.fetchUnreadSummary()
      } catch (error: any) {
        this.error = error.message || '标记已读失败'
        ElMessage.error(this.error)
        throw error
      }
    },

    // 清除错误
    clearError() {
      this.error = null
    }
  }
})