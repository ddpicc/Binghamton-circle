<template>
  <div class="profile">
    <NavHeader />
    <div class="profile-container">
      <div class="profile-header">
        <div class="profile-avatar">
          <!-- 点击头像预览图片 -->
          <el-avatar 
            :size="100" 
            :src="userInfo.avatar" 
            @click="previewAvatar(userInfo.avatar)"
            class="clickable-avatar"
          >
            {{ userInitial }}
          </el-avatar>
          <el-button v-if="!isViewingOther" class="avatar-upload" icon="Camera" circle @click="uploadAvatar" />
          <!-- 私信按钮 -->
          <el-button 
            v-if="canSendMessage" 
            class="message-button" 
            icon="ChatDotRound" 
            circle 
            @click="openMessageDialog"
            title="发送私信"
          />
        </div>
        <div class="profile-info">
          <!-- 点击用户名跳转到用户资料页面（如果是查看其他用户） -->
          <h2 @click="isViewingOther && goToUserProfile(userInfo.id)" :class="{ 'clickable-name': isViewingOther }">
            {{ userInfo.nickname }}
          </h2>
          <p>{{ userInfo.email }}</p>
          <div class="profile-status">
            <el-tag v-if="userInfo.role === 'admin'" type="danger">管理员</el-tag>
            <el-tag v-if="userInfo.isVerified" type="success">已认证</el-tag>
            <el-tag v-else type="warning">未认证</el-tag>
          </div>
          <!-- 私信按钮（在用户信息下方） -->
          <el-button 
            v-if="canSendMessage" 
            class="message-button-large" 
            icon="ChatDotRound" 
            @click="openMessageDialog"
          >
            发送私信
          </el-button>
        </div>
      </div>
      
      <div class="profile-content">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="个人信息" name="info">
            <el-form :model="userInfo" :rules="rules" ref="formRef" label-width="100px">
              <el-form-item label="昵称" prop="nickname">
                <el-input v-model="userInfo.nickname" :disabled="isViewingOther" />
              </el-form-item>
              <el-form-item label="邮箱" prop="email">
                <el-input v-model="userInfo.email" disabled />
              </el-form-item>
              <el-form-item label="手机号" prop="phone">
                <el-input v-model="userInfo.phone" :disabled="isViewingOther" />
              </el-form-item>
              <el-form-item label="性别" prop="gender">
                <el-select v-model="userInfo.gender" placeholder="请选择性别" :disabled="isViewingOther">
                  <el-option label="男" value="male" />
                  <el-option label="女" value="female" />
                  <el-option label="其他" value="other" />
                </el-select>
              </el-form-item>
              <el-form-item label="学校" prop="school">
                <el-input v-model="userInfo.school" :disabled="isViewingOther" />
              </el-form-item>
              <el-form-item label="专业" prop="major">
                <el-input v-model="userInfo.major" :disabled="isViewingOther" />
              </el-form-item>
              <el-form-item label="年级" prop="grade">
                <el-input v-model="userInfo.grade" :disabled="isViewingOther" />
              </el-form-item>
              <el-form-item label="个人简介" prop="bio">
                <el-input v-model="userInfo.bio" type="textarea" :rows="4" :disabled="isViewingOther" />
              </el-form-item>
              <el-form-item v-if="!isViewingOther">
                <el-button type="primary" @click="saveProfile" :loading="saving">
                  保存修改
                </el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>
          
          <el-tab-pane v-if="!isViewingOther" label="我的发布" name="posts">
            <div class="my-posts">
              <div v-if="myPosts.length === 0" class="empty">
                <el-empty description="暂无发布内容" />
              </div>
              <div v-else>
                <div v-for="post in myPosts" :key="post.id" class="post-item">
                  <el-card>
                    <div class="post-header">
                      <span class="post-title">{{ post.title }}</span>
                      <span class="post-time">{{ post.time }}</span>
                    </div>
                    <div class="post-content">
                      <p>{{ post.content }}</p>
                    </div>
                    <div class="post-actions">
                      <el-button v-if="!isViewingOther" size="small" @click="editPost(post)">编辑</el-button>
                      <el-button v-if="!isViewingOther" size="small" type="danger" @click="deletePost(post)">删除</el-button>
                    </div>
                  </el-card>
                </div>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane v-if="!isViewingOther" label="收藏内容" name="favorites">
            <div class="my-favorites">
              <div v-if="myFavorites.length === 0" class="empty">
                <el-empty description="暂无收藏内容" />
              </div>
              <div v-else>
                <div v-for="item in myFavorites" :key="item.id" class="favorite-item">
                  <el-card>
                    <div class="favorite-header">
                      <span class="favorite-title">{{ item.title }}</span>
                      <el-tag :type="getCategoryType(item.category)" size="small">
                        {{ getCategoryName(item.category) }}
                      </el-tag>
                    </div>
                    <div class="favorite-content">
                      <p>{{ item.summary }}</p>
                    </div>
                    <div class="favorite-actions">
                      <el-button size="small" @click="viewItem(item)">查看</el-button>
                      <el-button size="small" type="danger" @click="removeFavorite(item)">
                        取消收藏
                      </el-button>
                    </div>
                  </el-card>
                </div>
              </div>
            </div>
          </el-tab-pane>
          
        </el-tabs>
      </div>
      
      <!-- 发送私信对话框 -->
      <el-dialog v-model="messageDialogVisible" title="发送私信" width="500px">
        <div class="message-dialog-content">
          <div class="message-recipient">
            <el-avatar :size="32" :src="userInfo.avatar">
              {{ userInfo.nickname.charAt(0).toUpperCase() }}
            </el-avatar>
            <span class="recipient-name">{{ userInfo.nickname }}</span>
          </div>
          <el-input
            v-model="messageContent"
            type="textarea"
            :rows="4"
            placeholder="请输入消息内容..."
            maxlength="500"
            show-word-limit
          />
        </div>
        <template #footer>
          <el-button @click="messageDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="sendMessage" :loading="messageStore.loading">
            发送
          </el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Camera, ChatDotRound } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useMessageStore } from '@/stores/message'
import { userService } from '@/services/user'
import NavHeader from '@/components/NavHeader.vue'

const router = useRouter()
const formRef = ref()
const saving = ref(false)
const messageDialogVisible = ref(false)
const messageContent = ref('')
const activeTab = ref('info')

const userStore = useUserStore()
const messageStore = useMessageStore()
const route = useRoute()
// const router = useRouter() // 已在前面声明

const isViewingOther = computed(() => {
  const paramId = route.params.id ? Number(route.params.id) : null
  const selfId = userStore.user?.id
  return !!(paramId && selfId && paramId !== selfId)
})

// 是否可以发送私信（已登录且不是查看自己的资料）
const canSendMessage = computed(() => {
  return userStore.isLoggedIn && isViewingOther.value
})

const targetUserId = computed(() => {
  return route.params.id ? Number(route.params.id) : null
})

const userInfo = reactive({
  id: 0,
  nickname: '',
  email: '',
  bio: '',
  avatar: '',
  phone: '',
  gender: '',
  school: '',
  major: '',
  grade: '',
  isVerified: false,
  role: 'user'
})

const userInitial = computed(() => {
  return userInfo.nickname ? userInfo.nickname.charAt(0).toUpperCase() : 'U'
})

const rules = {
  nickname: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在2到20个字符', trigger: 'blur' }
  ],
  bio: [
    { max: 200, message: '个人简介不能超过200个字符', trigger: 'blur' }
  ]
}

const myPosts = ref<any[]>([])
const myFavorites = ref([])

const clearUserInfo = () => {
  userInfo.id = 0
  userInfo.nickname = ''
  userInfo.email = ''
  userInfo.bio = ''
  userInfo.avatar = ''
  userInfo.phone = ''
  userInfo.gender = ''
  userInfo.school = ''
  userInfo.major = ''
  userInfo.grade = ''
  userInfo.isVerified = false
  userInfo.role = 'user'
}

const assignUserInfo = (data: any = {}) => {
  userInfo.id = data.id ?? 0
  userInfo.nickname = data.nickname || data.username || ''
  userInfo.email = data.email || data.school_email || '未公开'
  userInfo.bio = data.bio || ''
  userInfo.avatar = data.avatar || ''
  userInfo.phone = data.phone || ''
  userInfo.gender = data.gender || ''
  userInfo.school = data.school || ''
  userInfo.major = data.major || ''
  userInfo.grade = data.grade || ''
  userInfo.isVerified = !!(data.email_verified ?? data.isVerified ?? false)
  userInfo.role = typeof data.role === 'string' && data.role.toLowerCase().includes('admin') ? 'admin' : 'user'
}

// 加载用户数据（当前用户或指定用户）
const loadUserData = async () => {
  const paramId = route.params.id ? Number(route.params.id) : null
  const self = userStore.user

  clearUserInfo()

  if (paramId && (!self || paramId !== self.id)) {
    try {
      const res: any = await userService.getUserById(paramId)
      const payload = res?.user ?? res?.data?.user ?? res?.data ?? res
      const profileData = payload?.profile ?? {}
      assignUserInfo({
        ...payload,
        ...profileData
      })
    } catch (error: any) {
      console.error('加载用户资料失败:', error)
      if (error?.response?.status === 404) {
        ElMessage.warning('该用户不存在或已被停用')
        router.replace({ name: 'Profile' })
        return
      } else {
        ElMessage.error(error?.response?.data?.error || '加载用户资料失败')
      }
    }
  } else if (self) {
    const profile = self.profile || {}
    assignUserInfo({
      ...self,
      ...profile,
      id: self.id,
      email: self.email,
      email_verified: self.email_verified
    })
  }

  if (!userInfo.nickname) {
    userInfo.nickname = `用户${userInfo.id || ''}`.trim()
  }
}

const getCategoryName = (category) => {
  const categoryMap = {
    academic: '教务通知',
    activity: '校园活动',
    urgent: '紧急通知',
    other: '其他'
  }
  return categoryMap[category] || '其他'
}

const getCategoryType = (category) => {
  const typeMap = {
    academic: 'primary',
    activity: 'success',
    urgent: 'danger',
    other: 'info'
  }
  return typeMap[category] || 'info'
}

const uploadAvatar = () => {
  ElMessage.info('头像上传功能开发中')
}

const saveProfile = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    saving.value = true
    
    // 调用更新用户信息API
    await userStore.updateProfile({
      nickname: userInfo.nickname,
      bio: userInfo.bio,
      phone: userInfo.phone,
      gender: userInfo.gender,
      school: userInfo.school,
      major: userInfo.major,
      grade: userInfo.grade
    })
    
    ElMessage.success('保存成功')
    
  } catch (error: any) {
    console.error('保存失败:', error)
    ElMessage.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

const editPost = (post) => {
  ElMessage.info('编辑功能开发中')
}

const deletePost = (post) => {
  ElMessageBox.confirm('确定要删除这条发布吗？', '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // TODO: 实现删除逻辑
    ElMessage.success('删除成功')
  }).catch(() => {
    // 用户取消删除
  })
}

const viewItem = (item) => {
  ElMessage.info('查看详情功能开发中')
}

const removeFavorite = (item) => {
  ElMessage.success('取消收藏成功')
}

const goToUserProfile = (userId) => {
  if (userId) {
    router.push(`/profile/${userId}`)
  }
}

const previewAvatar = (avatarUrl) => {
  if (avatarUrl) {
    // 使用Element Plus的图片预览功能
    ElMessage.info('头像预览功能开发中')
    // 这里可以实现头像预览逻辑
  }
}

const sendMessage = async () => {
  if (!messageContent.value.trim()) {
    ElMessage.warning('请输入消息内容')
    return
  }
  
  if (!targetUserId.value) {
    ElMessage.error('无法获取目标用户信息')
    return
  }
  
  try {
    await messageStore.sendMessage(targetUserId.value, messageContent.value.trim())
    ElMessage.success('消息发送成功')
    messageDialogVisible.value = false
    messageContent.value = ''
  } catch (error: any) {
    console.error('发送消息失败:', error)
    ElMessage.error(error.message || '发送消息失败')
  }
}

const openMessageDialog = () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  messageContent.value = ''
  messageDialogVisible.value = true
}

const loadUserPosts = async (userId: number) => {
  try {
    const res = await userService.getUserPosts(userId, 1, 10)
    myPosts.value = (res.posts || []).map((p: any) => ({
      id: p.id,
      title: p.title,
      content: p.content,
      time: p.created_at || p.updated_at || ''
    }))
  } catch (e) {
    myPosts.value = []
  }
}

onMounted(async () => {
  // 检查登录状态
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  
  // 加载用户数据
  await loadUserData()
  if (!isViewingOther.value && userInfo.id) {
    await loadUserPosts(userInfo.id)
  }
})

watch(isViewingOther, (isOther) => {
  if (isOther) {
    activeTab.value = 'info'
    myPosts.value = []
    myFavorites.value = []
  }
})

watch(
  () => route.params.id,
  async () => {
    if (!userStore.isLoggedIn) return
    await loadUserData()
    if (!isViewingOther.value && userInfo.id) {
      await loadUserPosts(userInfo.id)
    }
  }
)
</script>

<style scoped>
.profile {
  min-height: 100vh;
  background: #f5f7fa;
  padding-top: 80px;
}

.profile-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.profile-header {
  background: white;
  border-radius: 8px;
  padding: 30px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  position: relative;
}

.profile-avatar {
  position: relative;
}

.avatar-upload {
  position: absolute;
  bottom: 0;
  right: 0;
  background: #409eff;
  color: white;
  border: 2px solid white;
}

.message-button {
  position: absolute;
  bottom: 0;
  left: 0;
  background: #67c23a;
  color: white;
  border: 2px solid white;
}

.profile-info h2 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 28px;
}

.profile-info h2.clickable-name {
  cursor: pointer;
}

.profile-info h2.clickable-name:hover {
  color: #409eff;
  text-decoration: underline;
}

.profile-info p {
  margin: 0 0 15px 0;
  color: #606266;
  font-size: 16px;
}

.profile-status {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.message-button-large {
  margin-top: 15px;
}

.clickable-avatar {
  cursor: pointer;
}

.profile-content {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.my-posts,
.my-favorites {
  min-height: 400px;
}

.empty {
  padding: 60px 0;
  text-align: center;
}

.post-item,
.favorite-item {
  margin-bottom: 15px;
}

.post-header,
.favorite-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.post-title,
.favorite-title {
  font-weight: bold;
  color: #303133;
}

.post-time {
  color: #909399;
  font-size: 14px;
}

.post-content,
.favorite-content {
  margin-bottom: 15px;
}

.post-content p,
.favorite-content p {
  margin: 0;
  color: #606266;
  line-height: 1.5;
}

.post-actions,
.favorite-actions {
  display: flex;
  gap: 10px;
}

.message-dialog-content {
  padding: 20px 0;
}

.message-recipient {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}

.recipient-name {
  margin-left: 10px;
  font-weight: bold;
  color: #303133;
}

@media (max-width: 768px) {
  .profile {
    padding: 10px;
  }
  
  .profile-header {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }
  
  .profile-info {
    text-align: center;
  }
  
  .profile-status {
    justify-content: center;
  }
  
  .message-button {
    left: auto;
    right: 0;
  }
}
</style>
