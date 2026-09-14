<template>
  <div class="activity-detail">
    <NavHeader />

    <div class="container" v-if="loading">
      <el-skeleton :rows="8" animated />
    </div>

    <div class="container" v-else-if="activity">
      <!-- 活动头部信息 -->
      <div class="activity-header">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ name: 'Activities' }">校园活动</el-breadcrumb-item>
          <el-breadcrumb-item>活动详情</el-breadcrumb-item>
        </el-breadcrumb>

        <h1 class="activity-title">{{ activity.title }}</h1>

        <div class="activity-meta">
          <div class="meta-item" v-if="activity.location">
            <el-icon><Location /></el-icon>
            <span>{{ activity.location }}</span>
          </div>
          <div class="meta-item">
            <el-icon><Calendar /></el-icon>
            <span>{{ formatActivityTime(activity.time) }}</span>
          </div>
          <div class="meta-item meta-publisher">
            <span class="meta-label">发布者：</span>
            <el-avatar
              class="publisher-avatar"
              :size="32"
              :src="publisherAvatar"
              @error="() => true"
            >
              {{ publisherInitial }}
            </el-avatar>
            <router-link
              v-if="publisherProfileId"
              :to="{ name: 'UserProfile', params: { id: publisherProfileId } }"
              class="meta-link"
            >
              {{ publisherName }}
            </router-link>
            <span v-else class="meta-text">{{ publisherName }}</span>
          </div>
          <div class="meta-item">
            <el-icon><UserFilled /></el-icon>
            <span>报名人数：{{ activity.participant_count }}{{ activity.max_participants ? `/${activity.max_participants}` : '' }}</span>
          </div>
          <div class="meta-item">
            <el-icon><Clock /></el-icon>
            <span>发布时间：{{ formatDate(activity.created_at) }}</span>
          </div>
        </div>

        <div class="activity-actions">
          <el-button
            v-if="isCreator"
            size="large"
            type="warning"
            @click="onEditActivity"
          >
            编辑活动
          </el-button>
          <el-button
            v-else
            size="large"
            :type="activity.is_joined ? 'success' : 'primary'"
            :plain="activity.is_joined"
            :disabled="!activity.is_joined && activity.max_participants != null && activity.participant_count >= activity.max_participants"
            @click="onToggleJoin"
          >
            {{ activity.is_joined ? '已报名（取消）' : (activity.max_participants != null && activity.participant_count >= activity.max_participants ? '已满' : '报名参加') }}
          </el-button>
        </div>
      </div>

      <!-- 活动详情内容 -->
      <div class="activity-content">
        <el-row :gutter="20">
          <!-- 左侧：活动描述 -->
          <el-col :xs="24" :md="16">
            <el-card class="description-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <el-icon><Document /></el-icon>
                  <span>活动详情</span>
                </div>
              </template>
              <div class="description-content" v-if="activity.description">
                {{ activity.description }}
              </div>
              <div class="no-description" v-else>
                暂无详细描述
              </div>
            </el-card>
          </el-col>

          <!-- 右侧：报名人员列表 -->
          <el-col :xs="24" :md="8">
            <el-card class="participants-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <el-icon><Avatar /></el-icon>
                  <span>报名人员 ({{ activity.participant_count }})</span>
                </div>
              </template>

              <div class="participants-list" v-if="activity.participants && activity.participants.length > 0">
                <div
                  v-for="participant in activity.participants"
                  :key="participant.id"
                  class="participant-item"
                >
                  <el-avatar
                    :src="participant.avatar || ''"
                    :size="40"
                    @error="() => true"
                  >
                    {{ getUserInitial(participant) }}
                  </el-avatar>
                  <div class="participant-info">
                    <div class="participant-name">
                      <router-link
                        v-if="getParticipantProfileId(participant)"
                        :to="{ name: 'UserProfile', params: { id: getParticipantProfileId(participant) } }"
                        class="participant-link"
                      >
                        {{ getUserDisplayName(participant) }}
                      </router-link>
                      <span v-else>
                        {{ getUserDisplayName(participant) }}
                      </span>
                    </div>
                    <div class="participant-time">
                      {{ formatDate(participant.joined_at) }} 报名
                    </div>
                  </div>
                </div>
              </div>

              <div class="no-participants" v-else>
                暂无人报名
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>

    <div class="container" v-else-if="error">
      <el-result
        icon="error"
        title="加载失败"
        :sub-title="error"
      >
        <template #extra>
          <el-button type="primary" @click="goBack">返回</el-button>
        </template>
      </el-result>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Location, Calendar, UserFilled, Clock, Document, Avatar } from '@element-plus/icons-vue'
import { useActivityStore } from '@/stores/activity'
import { useUserStore } from '@/stores/user'
import NavHeader from '@/components/NavHeader.vue'
import { formatDate, formatActivityTime } from '@/utils'
import { activityService } from '@/services/activity'

const route = useRoute()
const router = useRouter()
const activityStore = useActivityStore()
const userStore = useUserStore()

const loading = ref(true)
const error = ref('')
const activity = ref<any>(null)

const isLoggedIn = computed(() => userStore.isLoggedIn)
const user = computed(() => userStore.user)

const getUserDisplayName = (userInfo: any) => {
  return userInfo?.nickname || userInfo?.username || '用户'
}

const getUserInitial = (userInfo: any) => {
  const name = getUserDisplayName(userInfo)
  return name ? name.charAt(0).toUpperCase() : '用'
}

const publisherName = computed(() => getUserDisplayName(activity.value?.publisher))
const publisherAvatar = computed(() => activity.value?.publisher?.avatar || '')
const publisherProfileId = computed(() => activity.value?.publisher?.id ?? activity.value?.user_id ?? null)
const publisherInitial = computed(() => getUserInitial(activity.value?.publisher))

const getParticipantProfileId = (participant: any) => {
  return participant?.user_id ?? participant?.id ?? null
}

const isCreator = computed(() => {
  return user.value && activity.value && user.value.id === activity.value.user_id
})

const loadActivity = async () => {
  try {
    loading.value = true
    error.value = ''

    const activityId = route.params.id
    if (!activityId || typeof activityId !== 'string') {
      error.value = '无效的活动ID'
      return
    }

    const response = await activityService.getActivityById(parseInt(activityId))

    // 检查数据是在 response.data 还是 response 中
    if (response.data && response.data.id) {
      activity.value = response.data
    } else if (response.id) {
      activity.value = response
    } else {
      error.value = '活动数据格式错误'
      return
    }

  } catch (err: any) {
    console.error('加载活动详情失败:', err)
    error.value = err.response?.data?.error || '加载活动详情失败'
  } finally {
    loading.value = false
  }
}

const onToggleJoin = async () => {
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  try {
    const res: any = await activityStore.toggleJoin(activity.value.id)
    if (res.joined) {
      ElMessage.success('报名成功')
      activity.value.is_joined = true
      activity.value.participant_count = res.participant_count
    } else {
      ElMessage.success('已取消报名')
      activity.value.is_joined = false
      activity.value.participant_count = res.participant_count
    }
  } catch (err: any) {
    ElMessage.error(activityStore.error || '操作失败')
  }
}

const onEditActivity = () => {
  // 跳转到编辑页面或打开编辑对话框
  ElMessage.info('编辑功能开发中')
}

const goBack = () => {
  router.go(-1)
}

onMounted(async () => {
  userStore.initUser()
  await loadActivity()
})
</script>

<style scoped>
.activity-detail {
  min-height: 100vh;
  background: var(--background-light);
  padding-top: 80px;
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 20px;
}

.activity-header {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.activity-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 16px 0 20px 0;
  line-height: 1.3;
}

.activity-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 24px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.meta-label {
  font-weight: 500;
}

.meta-link,
.participant-link {
  color: var(--text-primary);
  text-decoration: none;
  font-weight: 500;
}

.meta-link:hover,
.participant-link:hover {
  text-decoration: underline;
}

.meta-text {
  color: var(--text-primary);
  font-weight: 500;
}

.meta-publisher .publisher-avatar {
  flex-shrink: 0;
}

.activity-actions {
  display: flex;
  justify-content: flex-end;
}

.activity-content {
  margin-top: 20px;
}

.description-card,
.participants-card {
  margin-bottom: 20px;
  border-radius: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--text-primary);
}

.description-content {
  line-height: 1.8;
  color: var(--text-regular);
  font-size: 1rem;
  white-space: pre-wrap;
}

.no-description,
.no-participants {
  text-align: center;
  color: var(--text-secondary);
  padding: 40px 20px;
  font-size: 0.9rem;
}

.participants-list {
  max-height: 400px;
  overflow-y: auto;
}

.participant-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
}

.participant-item:last-child {
  border-bottom: none;
}

.participant-info {
  flex: 1;
}

.participant-name {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.participant-time {
  color: var(--text-secondary);
  font-size: 0.8rem;
  margin-top: 2px;
}

@media (max-width: 768px) {
  .activity-title {
    font-size: 1.5rem;
  }

  .activity-meta {
    gap: 12px;
  }

  .meta-item {
    font-size: 0.8rem;
  }
}
</style>
