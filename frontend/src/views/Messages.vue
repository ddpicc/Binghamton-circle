<template>
  <div class="messages">
    <NavHeader />
    <div class="messages-container">
      <div class="messages-header">
        <h2>私信</h2>
      </div>
      
      <div class="messages-content">
        <div v-if="loading" class="loading">
          <el-skeleton :rows="5" animated />
        </div>
        
        <div v-else-if="conversations.length === 0" class="empty">
          <el-empty description="暂无私信">
            <el-button type="primary" @click="$router.push('/')">去认识新朋友</el-button>
          </el-empty>
        </div>
        
        <div v-else class="conversations-list">
          <div 
            v-for="conversation in conversations" 
            :key="conversation.id"
            class="conversation-item"
            @click="openConversation(conversation.targetUser.id)"
          >
            <el-avatar :size="40" :src="conversation.targetUser.avatar">
              {{ conversation.targetUser.nickname.charAt(0).toUpperCase() }}
            </el-avatar>
            <div class="conversation-info">
              <div class="conversation-header">
                <span class="user-name">{{ conversation.targetUser.nickname }}</span>
                <span class="last-time">{{ formatTime(conversation.lastMessageAt) }}</span>
              </div>
              <div class="conversation-preview">
                <span class="preview-text">点击查看详情</span>
                <el-badge 
                  v-if="conversation.unread > 0" 
                  :value="conversation.unread" 
                  :max="99" 
                  class="unread-badge"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useMessageStore } from '@/stores/message'
import { useUserStore } from '@/stores/user'
import NavHeader from '@/components/NavHeader.vue'
import { formatDate } from '@/utils'

const messageStore = useMessageStore()
const userStore = useUserStore()
const router = useRouter()

const loading = ref(false)

const conversations = computed(() => {
  return messageStore.unreadSummary.map(summary => {
    // 这里应该从用户存储或其他地方获取用户信息
    // 为了简化，我们创建一个基本的用户对象
    return {
      id: summary.userId,
      targetUser: {
        id: summary.userId,
        nickname: `用户${summary.userId}`,
        avatar: null
      },
      lastMessageAt: summary.lastMessageAt,
      unread: summary.unread
    }
  })
})

const formatTime = (time: string | null) => {
  if (!time) return ''
  return formatDate(time)
}

const openConversation = (userId: number) => {
  router.push(`/profile/${userId}`)
}

const loadConversations = async () => {
  try {
    loading.value = true
    await messageStore.fetchUnreadSummary()
  } catch (error: any) {
    ElMessage.error('加载私信列表失败')
  } finally {
    loading.value = false
  }
}

// 定期刷新未读消息
let refreshInterval: number | null = null

onMounted(async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  
  await loadConversations()
  
  // 每30秒刷新一次
  refreshInterval = window.setInterval(() => {
    messageStore.fetchUnreadSummary()
  }, 30000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
.messages {
  min-height: 100vh;
  background: var(--background-light);
  padding-top: 80px;
}

.messages-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.messages-header {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: var(--shadow-light);
}

.messages-header h2 {
  margin: 0;
  color: var(--text-primary);
}

.messages-content {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: var(--shadow-light);
  min-height: 500px;
}

.loading {
  padding: 20px;
}

.empty {
  padding: 60px 0;
}

.conversations-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.conversation-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.conversation-item:hover {
  background-color: #f5f7fa;
}

.conversation-info {
  flex: 1;
  min-width: 0;
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.user-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 16px;
}

.last-time {
  color: var(--text-secondary);
  font-size: 12px;
}

.conversation-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-text {
  color: var(--text-secondary);
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.unread-badge {
  margin-left: 10px;
}

@media (max-width: 768px) {
  .messages {
    padding: 10px;
    padding-top: 80px;
  }
  
  .messages-container {
    padding: 10px;
  }
  
  .conversation-item {
    padding: 12px;
    gap: 12px;
  }
  
  .user-name {
    font-size: 15px;
  }
}
</style>