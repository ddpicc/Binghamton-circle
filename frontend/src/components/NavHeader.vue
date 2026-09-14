<template>
  <el-container class="nav-header">
    <el-header>
      <nav class="nav">
        <div class="nav-brand">
          <h1>Binghamton Circle</h1>
        </div>
        <div class="nav-menu">
          <el-menu mode="horizontal" :default-active="activeRoute" router>
            <el-menu-item index="/">首页</el-menu-item>
            <el-menu-item index="/tree-hole">树洞</el-menu-item>
            <el-menu-item index="/following">圈子</el-menu-item>
            <el-menu-item index="/o2o">O2O</el-menu-item>
            <el-menu-item index="/activities">活动</el-menu-item>
          </el-menu>
        </div>
        <div class="nav-user">
          <template v-if="isLoggedIn">
            <!-- 消息图标和未读提示 -->
            <div class="message-icon" @click="goToMessages">
              <el-icon :size="20"><ChatDotRound /></el-icon>
              <el-badge 
                v-if="totalUnreadCount > 0" 
                :value="totalUnreadCount" 
                :max="99" 
                class="unread-badge"
              />
            </div>
            <el-avatar :size="40" :src="userAvatar">
              {{ userInitial }}
            </el-avatar>
            <el-dropdown @command="handleCommand">
              <span class="username-wrapper">
                <span class="username">{{ userName }}</span>
                <el-tag v-if="userStore.isAdmin" size="small" type="danger" effect="dark">管理员</el-tag>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                  <el-dropdown-item v-if="userStore.isAdmin" command="admin" divided>管理后台</el-dropdown-item>
                  <el-dropdown-item command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <el-button type="primary" @click="$router.push('/login')">登录 / 注册</el-button>
          </template>
        </div>
      </nav>
    </el-header>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useMessageStore } from '@/stores/message'
import { ChatDotRound } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const messageStore = useMessageStore()

const isLoggedIn = computed(() => userStore.isLoggedIn)
const userName = computed(() => userStore.user?.nickname || userStore.user?.username || '用户')
const userAvatar = computed(() => userStore.user?.avatar || '')
const totalUnreadCount = computed(() => messageStore.getTotalUnreadCount)

const activeRoute = computed(() => route.path)

const userInitial = computed(() => {
  return userName.value ? userName.value.charAt(0).toUpperCase() : 'U'
})

const handleCommand = async (command: string) => {
  if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'admin') {
    router.push('/admin')
  } else if (command === 'logout') {
    await userStore.logout()
    router.push('/')
  }
}

const goToMessages = () => {
  router.push('/messages') // 假设我们有一个消息页面
}

onMounted(() => {
  // 初始化用户状态
  userStore.initUser()
  
  // 如果用户已登录，获取未读消息摘要
  if (isLoggedIn.value) {
    messageStore.fetchUnreadSummary()
  }
})
</script>

<style scoped>
.nav-header {
  display: block;
}

.nav-header .el-header {
  background: var(--background-white);
  box-shadow: var(--shadow-light);
  padding: 0;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  height: 60px;
}

.nav-header .nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 100%;
}

.nav-brand h1 {
  margin: 0;
  color: var(--primary-color);
  font-size: 24px;
  font-weight: 600;
}

.nav-menu {
  flex: 1;
  display: flex;
  justify-content: center;
  min-width: 0;
}

.nav-menu .el-menu {
  width: 100%;
  display: flex;
  justify-content: center;
  border-bottom: none;
}

.nav-menu .el-menu-item {
  flex: 0 0 auto;
  padding: 0 20px;
}

.nav-user {
  display: flex;
  align-items: center;
  gap: 15px;
}

.message-icon {
  position: relative;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.3s;
}

.message-icon:hover {
  background-color: #f0f2f5;
}

.unread-badge {
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(50%, -50%);
}

.username {
  cursor: pointer;
  color: var(--text-regular);
  font-weight: 500;
}

.username-wrapper {
  cursor: pointer;
  margin-left: 10px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nav {
    padding: 0 10px;
  }
  
  .nav-brand h1 {
    font-size: 18px;
  }
  
  .nav-menu {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding: 0 10px;
  }
  
  .nav-menu .el-menu {
    min-width: max-content;
    border-bottom: none;
  }
  
  .nav-menu .el-menu-item {
    white-space: nowrap;
    padding: 0 15px;
  }
}

@media (max-width: 480px) {
  .nav-user {
    gap: 5px;
  }
  
  .nav-brand h1 {
    font-size: 16px;
  }
}
</style>
