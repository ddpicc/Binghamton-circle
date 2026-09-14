<template>
  <div class="activities">
    <NavHeader />
    <div class="container">
      <div class="header">
        <h2>校园活动</h2>
        <div class="actions">
          <el-button type="primary" @click="openCreate" :disabled="!isLoggedIn">发布活动</el-button>
          <el-tooltip v-if="!isLoggedIn" content="请先登录后再发布" placement="bottom">
            <el-icon style="color: var(--text-secondary);"><i></i></el-icon>
          </el-tooltip>
        </div>
      </div>

      <div v-if="loading" class="loading"><el-skeleton :rows="6" animated /></div>

      <div v-else class="grid">
        <el-empty v-if="activities.length === 0" description="暂无活动，快来发布第一条吧！" />
        <el-row v-else :gutter="20">
          <el-col v-for="a in activities" :key="a.id" :xs="24" :sm="12" :md="12" :lg="12">
            <el-card class="activity-card" shadow="hover" @click="goToDetail(a)">
              <div class="card-content">
                <div class="card-title">{{ a.title }}</div>
                <div class="card-meta">
                  <div class="meta-row" v-if="a.location">
                    <el-icon><Location /></el-icon>
                    <span>{{ a.location }}</span>
                  </div>
                  <div class="meta-row">
                    <el-icon><Calendar /></el-icon>
                    <span>活动时间：{{ formatActivityTime(a.time) }}</span>
                  </div>
                  <div class="meta-row">
                    <el-icon><User /></el-icon>
                    <span>发布者：{{ a.publisher?.nickname || a.publisher?.username || '用户' }}</span>
                  </div>
                  <div class="meta-row">
                    <el-icon><UserFilled /></el-icon>
                    <span>报名人数：{{ a.participant_count }}{{ a.max_participants ? `/${a.max_participants}` : '' }}</span>
                  </div>
                </div>
              </div>
              <div class="card-actions" @click.stop>
                <el-button
                  v-if="isCreator(a)"
                  size="small"
                  type="warning"
                  @click="onEditActivity(a)"
                >
                  编辑
                </el-button>
                <el-button
                  v-else
                  size="small"
                  :type="a.is_joined ? 'success' : 'primary'"
                  :plain="a.is_joined"
                  :disabled="!a.is_joined && a.max_participants != null && a.participant_count >= a.max_participants"
                  @click="onToggleJoin(a)"
                >
                  {{ a.is_joined ? '已报名（取消）' : (a.max_participants != null && a.participant_count >= a.max_participants ? '已满' : '报名/参加') }}
                </el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="editingActivity ? '编辑活动' : '发布活动'" width="520px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="90px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="活动标题" />
        </el-form-item>
        <el-form-item label="时间" prop="time">
          <el-date-picker v-model="form.time" type="datetime" placeholder="选择日期时间" style="width: 100%" />
        </el-form-item>
        <el-form-item label="地点" prop="location">
          <el-input v-model="form.location" placeholder="可选" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="可选" />
        </el-form-item>
        <el-form-item label="人数上限" prop="max_participants">
          <el-input-number v-model="form.max_participants" :min="1" :max="10000" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">{{ editingActivity ? '更新' : '发布' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Location, Calendar, User, UserFilled } from '@element-plus/icons-vue'
import { useActivityStore } from '@/stores/activity'
import { useUserStore } from '@/stores/user'
import NavHeader from '@/components/NavHeader.vue'
import { formatActivityTime } from '@/utils'

const activityStore = useActivityStore()
const userStore = useUserStore()
const router = useRouter()

const activities = computed(() => activityStore.activities)
const loading = computed(() => activityStore.loading)
const isLoggedIn = computed(() => userStore.isLoggedIn)
const user = computed(() => userStore.user)

const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const editingActivity = ref<any>(null)
const form = ref({
  title: '',
  time: '',
  location: '',
  description: '',
  max_participants: undefined as number | undefined
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入活动标题', trigger: 'blur' }],
  time: [{ required: true, message: '请选择时间', trigger: 'change' }]
}

const openCreate = () => {
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录')
    return
  }
  editingActivity.value = null
  form.value = { title: '', time: '', location: '', description: '', max_participants: undefined }
  dialogVisible.value = true
}

const onEditActivity = (activity: any) => {
  editingActivity.value = activity
  form.value = {
    title: activity.title,
    time: activity.time,
    location: activity.location || '',
    description: activity.description || '',
    max_participants: activity.max_participants
  }
  dialogVisible.value = true
}

const submit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      if (editingActivity.value) {
        // 编辑活动
        await activityStore.updateActivity(editingActivity.value.id, {
          title: form.value.title.trim(),
          location: form.value.location?.trim() || undefined,
          time: form.value.time,
          description: form.value.description?.trim() || undefined,
          max_participants: form.value.max_participants
        })
        ElMessage.success('更新成功')
      } else {
        // 创建活动
        await activityStore.createActivity({
          title: form.value.title.trim(),
          location: form.value.location?.trim() || undefined,
          time: form.value.time,
          description: form.value.description?.trim() || undefined,
          max_participants: form.value.max_participants
        })
        ElMessage.success('发布成功')
      }
      dialogVisible.value = false
      form.value = { title: '', time: '', location: '', description: '', max_participants: undefined }
      editingActivity.value = null
    } catch (err: any) {
      ElMessage.error(activityStore.error || (editingActivity.value ? '编辑失败' : '发布失败'))
    } finally {
      submitting.value = false
    }
  })
}

onMounted(async () => {
  userStore.initUser()
  try {
    await activityStore.fetchActivities()
  } catch (err) {
    // 已在store记录错误
  }
})

const isCreator = (activity: any) => {
  return user.value && activity.user_id === user.value.id
}

const goToDetail = (activity: any) => {
  router.push(`/activities/${activity.id}`)
}

const onToggleJoin = async (a: any) => {
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录')
    return
  }
  try {
    const res: any = await activityStore.toggleJoin(a.id)
    if (res.joined) {
      ElMessage.success('报名成功')
    } else {
      ElMessage.success('已取消报名')
    }
  } catch (err: any) {
    ElMessage.error(activityStore.error || '操作失败')
  }
}
</script>

<style scoped>
.activities {
  min-height: 100vh;
  background: var(--background-light);
  padding-top: 80px;
}
.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 20px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.grid {
  margin-top: 10px;
}
.activity-card {
  margin-bottom: 20px;
  height: 100%;
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
}
.activity-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}
.card-content {
  flex: 1;
  padding: 20px;
  padding-bottom: 0;
  display: flex;
  flex-direction: column;
}
.card-title {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--text-primary);
  margin-bottom: 12px;
  line-height: 1.4;
}
.card-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: auto;
}
.meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.card-actions {
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
}
.loading {
  padding: 20px;
}
</style>
