<template>
  <div class="circle-manage-page">
    <NavHeader />
    <div class="circle-manage-container">
      <el-row :gutter="20">
      <!-- 左侧内容区 -->
      <el-col :span="18">
        <!-- 页面标题 -->
        <div class="page-header">
          <h2>圈子管理</h2>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item @click="router.push('/circles')">圈子</el-breadcrumb-item>
            <el-breadcrumb-item @click="router.push(`/circles/${circleId}`)">
              {{ circle?.name }}
            </el-breadcrumb-item>
            <el-breadcrumb-item>管理</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <!-- Tab导航 -->
        <el-tabs v-model="activeTab">
          <!-- 基本信息 -->
          <el-tab-pane label="基本信息" name="basic">
            <el-card>
              <el-form
                ref="basicFormRef"
                :model="basicForm"
                :rules="basicRules"
                label-width="120px"
              >
                <el-form-item label="圈子名称" prop="name">
                  <el-input
                    v-model="basicForm.name"
                    placeholder="请输入圈子名称"
                    maxlength="50"
                    show-word-limit
                  />
                </el-form-item>

                <el-form-item label="圈子描述" prop="description">
                  <el-input
                    v-model="basicForm.description"
                    type="textarea"
                    :rows="4"
                    placeholder="请输入圈子描述"
                    maxlength="500"
                    show-word-limit
                  />
                </el-form-item>

                <el-form-item label="圈子分类" prop="category_id">
                  <el-select
                    v-model="basicForm.category_id"
                    placeholder="请选择圈子分类"
                    style="width: 300px"
                  >
                    <el-option
                      v-for="category in categories"
                      :key="category.id"
                      :label="category.name"
                      :value="category.id"
                    >
                      <span style="margin-right: 8px">{{ category.icon }}</span>
                      {{ category.name }}
                    </el-option>
                  </el-select>
                </el-form-item>

                <el-form-item label="封面图片">
                  <el-upload
                    v-model:file-list="coverFileList"
                    class="cover-uploader"
                    action="#"
                    :show-file-list="false"
                    :auto-upload="false"
                    :on-change="handleCoverChange"
                  >
                    <img
                      v-if="basicForm.cover_image"
                      :src="basicForm.cover_image"
                      class="cover-image"
                    />
                    <el-icon v-else class="cover-uploader-icon"><Plus /></el-icon>
                  </el-upload>
                </el-form-item>

                <el-form-item label="成员上限">
                  <el-input-number
                    v-model="basicForm.max_members"
                    :min="1"
                    :max="10000"
                    placeholder="不限制请留空">
                  </el-input-number>
                </el-form-item>

                <el-form-item label="圈子规则">
                  <el-input
                    v-model="basicForm.rules"
                    type="textarea"
                    :rows="6"
                    placeholder="请输入圈子规则"
                    maxlength="1000"
                    show-word-limit
                  />
                </el-form-item>

                <el-form-item>
                  <el-button
                    type="primary"
                    @click="saveBasicInfo"
                    :loading="savingBasic"
                  >
                    保存修改
                  </el-button>
                  <el-button @click="resetBasicForm">重置</el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </el-tab-pane>

          <!-- 成员管理 -->
          <el-tab-pane label="成员管理" name="members">
            <el-card>
              <!-- 成员统计 -->
              <div class="member-stats">
                <el-row :gutter="20">
                  <el-col :span="6">
                    <div class="stat-item">
                      <div class="stat-value">{{ circle?.member_count || 0 }}</div>
                      <div class="stat-label">总成员数</div>
                    </div>
                  </el-col>
                  <el-col :span="6">
                    <div class="stat-item">
                      <div class="stat-value">{{ adminCount }}</div>
                      <div class="stat-label">管理员</div>
                    </div>
                  </el-col>
                  <el-col :span="6">
                    <div class="stat-item">
                      <div class="stat-value">{{ pendingCount }}</div>
                      <div class="stat-label">待审核</div>
                    </div>
                  </el-col>
                  <el-col :span="6">
                    <div class="stat-item">
                      <div class="stat-value">{{ todayJoinCount }}</div>
                      <div class="stat-label">今日加入</div>
                    </div>
                  </el-col>
                </el-row>
              </div>

              <!-- 成员列表 -->
              <div class="member-actions">
                <el-input
                  v-model="memberSearch"
                  placeholder="搜索成员..."
                  style="width: 300px"
                  clearable
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
                <el-button
                  v-if="pendingCount > 0"
                  type="warning"
                  @click="activeTab = 'pending'"
                >
                  待审核申请 ({{ pendingCount }})
                </el-button>
              </div>

              <el-table :data="filteredMembers" style="width: 100%">
                <el-table-column label="用户" width="300">
                  <template #default="{ row }">
                    <div class="user-cell">
                      <el-avatar
                        :size="40"
                        :src="row.user?.avatar"
                        @click="router.push(`/profile/${row.user_id}`)"
                      >
                        <el-icon><UserFilled /></el-icon>
                      </el-avatar>
                      <div class="user-info">
                        <div class="username">{{ row.user?.username }}</div>
                        <div class="user-nickname">
                          {{ row.user?.profile?.nickname || '暂无昵称' }}
                        </div>
                      </div>
                    </div>
                  </template>
                </el-table-column>
                
                <el-table-column prop="role" label="角色" width="120">
                  <template #default="{ row }">
                    <el-select
                      v-model="row.role"
                      @change="changeMemberRole(row)"
                      :disabled="row.role === 'creator'"
                    >
                      <el-option label="成员" value="member" />
                      <el-option label="管理员" value="admin" />
                      <el-option label="创建者" value="creator" disabled />
                    </el-select>
                  </template>
                </el-table-column>
                
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="getStatusTagType(row.status)">
                      {{ getStatusText(row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                
                <el-table-column prop="joined_at" label="加入时间" width="180">
                  <template #default="{ row }">
                    {{ formatDate(row.joined_at) }}
                  </template>
                </el-table-column>
                
                <el-table-column label="操作" width="150" fixed="right">
                  <template #default="{ row }">
                    <el-button
                      v-if="row.role !== 'creator'"
                      type="danger"
                      size="small"
                      @click="removeMember(row)"
                    >
                      移除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-tab-pane>

          <!-- 入群申请 -->
          <el-tab-pane label="入群申请" name="pending">
            <el-card>
              <div class="pending-header">
                <h3>待审核申请 ({{ pendingRequests.length }})</h3>
                <el-button
                  type="success"
                  @click="approveAll"
                  :disabled="pendingRequests.length === 0"
                >
                  全部通过
                </el-button>
              </div>

              <el-empty
                v-if="pendingRequests.length === 0"
                description="暂无待审核申请"
              />

              <div v-else class="pending-list">
                <div
                  v-for="request in pendingRequests"
                  :key="request.id"
                  class="pending-item"
                >
                  <div class="user-info">
                    <el-avatar
                      :size="50"
                      :src="request.user?.avatar"
                      @click="router.push(`/profile/${request.user_id}`)"
                    >
                      <el-icon><UserFilled /></el-icon>
                    </el-avatar>
                    <div class="user-details">
                      <h4>{{ request.user?.username }}</h4>
                      <p>{{ request.user?.profile?.nickname || '暂无昵称' }}</p>
                      <span>申请时间：{{ formatDate(request.created_at) }}</span>
                    </div>
                  </div>
                  
                  <div class="request-actions">
                    <el-button
                      type="success"
                      @click="handleRequest(request, 'approve')"
                      :loading="processingId === request.user_id"
                    >
                      通过
                    </el-button>
                    <el-button
                      type="danger"
                      @click="showRejectDialog(request)"
                      :disabled="processingId === request.user_id"
                    >
                      拒绝
                    </el-button>
                  </div>
                </div>
              </div>
            </el-card>
          </el-tab-pane>

          <!-- 圈子设置 -->
          <el-tab-pane label="圈子设置" name="settings">
            <el-card>
              <el-alert
                v-if="circle?.is_private"
                title="私密圈子设置"
                type="warning"
                :closable="false"
                show-icon
              >
                <p>当前为私密圈子，只有成员可以查看内容</p>
              </el-alert>

              <el-form
                ref="settingsFormRef"
                :model="settingsForm"
                label-width="120px"
                style="margin-top: 20px"
              >
                <el-form-item label="圈子类型">
                  <el-radio-group v-model="settingsForm.is_private">
                    <el-radio :label="false">公开圈子</el-radio>
                    <el-radio :label="true">私密圈子</el-radio>
                  </el-radio-group>
                  <div class="help-text">
                    修改圈子类型会影响新用户的加入方式，不会影响现有成员
                  </div>
                </el-form-item>

                <el-form-item label="加入审核">
                  <el-switch v-model="settingsForm.need_approval" />
                  <div class="help-text">
                    开启后，所有加入申请都需要管理员审核
                  </div>
                </el-form-item>

                <el-form-item>
                  <el-button
                    type="primary"
                    @click="saveSettings"
                    :loading="savingSettings"
                  >
                    保存设置
                  </el-button>
                </el-form-item>
              </el-form>

              <!-- 危险操作 -->
              <div class="danger-zone">
                <h3>危险操作</h3>
                <el-divider />
                
                <div class="danger-actions">
                  <div class="action-item">
                    <div class="action-info">
                      <h4>转让圈子</h4>
                      <p>将圈子所有权转移给另一位成员</p>
                    </div>
                    <div class="transfer-form">
                      <el-select
                        v-model="transferTarget"
                        placeholder="选择成员"
                        filterable
                        style="min-width: 180px"
                      >
                        <el-option
                          v-for="member in transferableMembers"
                          :key="member.user_id"
                          :label="member.user?.username || `用户 ${member.user_id}`"
                          :value="member.user_id"
                        />
                      </el-select>
                      <el-button
                        type="primary"
                        :disabled="!transferTarget"
                        :loading="transferring"
                        @click="transferOwnership"
                      >
                        转让
                      </el-button>
                    </div>
                  </div>
                  <div class="action-item">
                    <div class="action-info">
                      <h4>解散圈子</h4>
                      <p>解散后，所有数据将被删除且无法恢复</p>
                    </div>
                    <el-button
                      type="danger"
                      @click="showDeleteDialog"
                    >
                      解散圈子
                    </el-button>
                  </div>
                </div>
              </div>
            </el-card>
          </el-tab-pane>
        </el-tabs>
      </el-col>

      <!-- 右侧边栏 -->
      <el-col :span="6">
        <!-- 快速操作 -->
        <el-card class="sidebar-card">
          <template #header>
            <span>快速操作</span>
          </template>
          <div class="quick-actions">
            <el-button
              type="primary"
              @click="router.push(`/circles/${circleId}`)"
              style="width: 100%; margin-bottom: 10px"
            >
              <el-icon><View /></el-icon>
              查看圈子
            </el-button>
            <el-button
              @click="router.push('/circles')"
              style="width: 100%"
            >
              <el-icon><Back /></el-icon>
              返回列表
            </el-button>
          </div>
        </el-card>

        </el-col>
    </el-row>

    <!-- 拒绝申请对话框 -->
    <el-dialog
      v-model="rejectDialogVisible"
      title="拒绝申请"
      width="400px"
    >
      <el-form :model="rejectForm">
        <el-form-item label="拒绝原因">
          <el-input
            v-model="rejectForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入拒绝原因（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button
          type="danger"
          @click="handleRequest(currentRequest, 'reject')"
          :loading="processingId === currentRequest?.id"
        >
          确认拒绝
        </el-button>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="解散圈子"
      width="400px"
    >
      <div class="delete-warning">
        <el-alert
          title="警告：此操作不可逆！"
          type="error"
          :closable="false"
          show-icon
        />
        <p style="margin-top: 15px">
          解散圈子后，所有数据将被永久删除，包括：<br>
          • 所有帖子<br>
          • 所有成员信息<br>
          • 圈子设置<br>
          • 无法恢复
        </p>
        <el-input
          v-model="deleteConfirm"
          placeholder="请输入圈子名称以确认"
          style="margin-top: 15px"
        />
      </div>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button
          type="danger"
          @click="deleteCircle"
          :loading="deleting"
          :disabled="deleteConfirm !== circle?.name"
        >
          确认解散
        </el-button>
      </template>
    </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import NavHeader from '@/components/NavHeader.vue'
import {
  Plus,
  Search,
  UserFilled,
  View,
  Back
} from '@element-plus/icons-vue'
import {
  getCircleById,
  updateCircle,
  deleteCircle as deleteCircleApi,
  getCircleMembers,
  getPendingRequests,
  handleJoinRequest,
  removeMember as removeMemberApi,
  transferCircle,
  uploadService,
  type Circle,
  type CircleMember,
  type CreateCircleData
} from '@/services'
import { formatDate } from '@/utils'
import type { UploadUserFile } from 'element-plus'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()

// 数据
const circleId = computed(() => parseInt(route.params.id as string))
const circle = ref<Circle>()
const members = ref<CircleMember[]>([])
const pendingRequests = ref<CircleMember[]>([])
const loading = ref(false)
const savingBasic = ref(false)
const savingSettings = ref(false)
const processingId = ref<number | null>(null)
const deleting = ref(false)

// Tab
const activeTab = ref('basic')

// 基本信息
const basicFormRef = ref()
const coverFileList = ref<UploadUserFile[]>([])
const basicForm = reactive({
  name: '',
  description: '',
  category_id: 0,
  max_members: undefined,
  rules: '',
  cover_image: ''
})
const basicRules = {
  name: [{ required: true, message: '请输入圈子名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入圈子描述', trigger: 'blur' }],
  category_id: [{ required: true, message: '请选择圈子分类', trigger: 'change' }]
}

// 成员管理
const memberSearch = ref('')

// 设置
const settingsFormRef = ref()
const settingsForm = reactive({
  is_private: false,
  need_approval: false
})

const transferTarget = ref<number | ''>('')
const transferring = ref(false)

// 拒绝申请
const rejectDialogVisible = ref(false)
const currentRequest = ref<CircleMember>()
const rejectForm = reactive({
  reason: ''
})

// 删除圈子
const deleteDialogVisible = ref(false)
const deleteConfirm = ref('')

// 分类数据
const categories = ref([
  { id: 1, name: '学习交流', icon: '📚' },
  { id: 2, name: '生活分享', icon: '☕' },
  { id: 3, name: '兴趣小组', icon: '⭐' },
  { id: 4, name: '校园活动', icon: '📅' },
  { id: 5, name: '求职招聘', icon: '💼' },
  { id: 6, name: '其他', icon: '📌' }
])

// 计算属性
const filteredMembers = computed(() => {
  if (!memberSearch.value) return members.value
  const keyword = memberSearch.value.toLowerCase()
  return members.value.filter(m => 
    m.user?.username.toLowerCase().includes(keyword) ||
    m.user?.profile?.nickname?.toLowerCase().includes(keyword)
  )
})

const adminCount = computed(() => 
  members.value.filter(m => m.role === 'creator' || m.role === 'admin').length
)

const pendingCount = computed(() => pendingRequests.value.length)

const todayJoinCount = computed(() => {
  const today = new Date().toDateString()
  return members.value.filter(m => 
    new Date(m.joined_at).toDateString() === today
  ).length
})

const todayPostCount = ref(0) // TODO: 从API获取

const activityLevel = computed(() => {
  const count = circle.value?.post_count || 0
  if (count > 100) return '非常高'
  if (count > 50) return '高'
  if (count > 20) return '中等'
  return '低'
})

const transferableMembers = computed(() =>
  members.value.filter(m => m.role !== 'creator' && m.status === 'approved')
)

// 获取圈子详情
const fetchCircleDetail = async () => {
  try {
    loading.value = true
    const data = await getCircleById(circleId.value)
    circle.value = data

    basicForm.name = data.name || ''
    basicForm.description = data.description || ''
    basicForm.category_id = data.category_id ?? ''
    basicForm.max_members = data.max_members
    basicForm.rules = data.rules || ''
    basicForm.cover_image = data.cover_image || ''
    coverFileList.value = basicForm.cover_image
      ? [{ name: 'cover', url: basicForm.cover_image } as UploadUserFile]
      : []

    settingsForm.is_private = !!data.is_private
    settingsForm.need_approval = data.need_approval ?? !!data.is_private
    transferTarget.value = ''
  } catch (error) {
    console.error('获取圈子详情失败:', error)
    ElMessage.error('获取圈子详情失败')
  } finally {
    loading.value = false
  }
}

// 获取成员列表
const fetchMembers = async () => {
  try {
    const res = await getCircleMembers(circleId.value, {
      status: 'approved'
    })
    members.value = res.members || (res as any)?.data?.members || []
    transferTarget.value = ''
  } catch (error) {
    console.error('获取成员列表失败:', error)
  }
}

// 获取待审核申请
const fetchPendingRequests = async () => {
  try {
    const res = await getPendingRequests(circleId.value)
    pendingRequests.value = res.requests || []
  } catch (error) {
    console.error('获取待审核申请失败:', error)
  }
}

// 处理封面图片
const validateCoverFile = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB!')
    return false
  }
  return true
}

const handleCoverChange = (file: UploadUserFile) => {
  const rawFile = file.raw as File | undefined
  if (!rawFile) return false
  if (!validateCoverFile(rawFile)) return false

  if (basicForm.cover_image && basicForm.cover_image.startsWith('blob:')) {
    URL.revokeObjectURL(basicForm.cover_image)
  }

  const previewUrl = URL.createObjectURL(rawFile)
  basicForm.cover_image = previewUrl
  file.url = previewUrl
  file.status = 'ready'
  coverFileList.value = [file]
  return false
}

// 保存基本信息
const saveBasicInfo = async () => {
  if (!basicFormRef.value) return
  
  try {
    await basicFormRef.value.validate()
    savingBasic.value = true
    
    const categoryId = Number(basicForm.category_id)
    if (!categoryId || Number.isNaN(categoryId)) {
      ElMessage.error('请选择圈子分类')
      savingBasic.value = false
      return
    }

    const updateData: Partial<CreateCircleData> = {
      name: basicForm.name.trim(),
      description: basicForm.description.trim(),
      category_id: categoryId,
      rules: basicForm.rules?.trim() || ''
    }

    if (!updateData.rules) {
      delete updateData.rules
    }

    if (basicForm.max_members !== undefined) {
      updateData.max_members = basicForm.max_members
    }

    if (coverFileList.value.length > 0) {
      const fileItem = coverFileList.value[0]
      if (fileItem.raw) {
        const uploadResult = await uploadService.uploadImage(fileItem.raw as File, 'circle/background')
        updateData.cover_image = uploadResult.image.url
        fileItem.url = uploadResult.image.url
        fileItem.status = 'success'
        Reflect.deleteProperty(fileItem, 'raw')
        basicForm.cover_image = uploadResult.image.url
      } else if (fileItem.url) {
        updateData.cover_image = fileItem.url
      }
    } else if (basicForm.cover_image) {
      updateData.cover_image = basicForm.cover_image
    }

    await updateCircle(circleId.value, updateData)
    ElMessage.success('保存成功')
    await fetchCircleDetail()
  } catch (error: any) {
    console.error('保存失败:', error)
    ElMessage.error(error.response?.data?.message || '保存失败')
  } finally {
    savingBasic.value = false
  }
}

// 重置基本信息表单
const resetBasicForm = () => {
  if (basicFormRef.value) {
    basicFormRef.value.resetFields()
  }
  fetchCircleDetail()
}

// 修改成员角色
const changeMemberRole = async (member: CircleMember) => {
  try {
    // TODO: 实现修改成员角色API
    ElMessage.success('角色修改成功')
    await fetchMembers()
  } catch (error) {
    console.error('修改角色失败:', error)
    ElMessage.error('修改角色失败')
  }
}

// 移除成员
const removeMember = async (member: CircleMember) => {
  try {
    await ElMessageBox.confirm(
      `确定要将 ${member.user?.username} 移出圈子吗？`,
      '移除成员',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await removeMemberApi(circleId.value, member.user_id)
    ElMessage.success('移除成功')
    await fetchMembers()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('移除成员失败:', error)
      ElMessage.error(error.response?.data?.message || '移除失败')
    }
  }
}

// 显示拒绝对话框
const showRejectDialog = (request: CircleMember) => {
  currentRequest.value = request
  rejectForm.reason = ''
  rejectDialogVisible.value = true
}

// 处理入群申请
const handleRequest = async (request: CircleMember, action: 'approve' | 'reject') => {
  try {
    processingId.value = request.user_id
    await handleJoinRequest(
      circleId.value,
      request.user_id,
      action,
      action === 'reject' ? rejectForm.reason : undefined
    )
    
    ElMessage.success(action === 'approve' ? '已通过申请' : '已拒绝申请')
    rejectDialogVisible.value = false
    await Promise.all([fetchPendingRequests(), fetchMembers()])
  } catch (error: any) {
    console.error('处理申请失败:', error)
    ElMessage.error(error.response?.data?.message || '操作失败')
  } finally {
    processingId.value = null
  }
}

// 全部通过
const approveAll = async () => {
  try {
    if (pendingRequests.value.length === 0) {
      return
    }
    await ElMessageBox.confirm(
      '确定要通过所有待审核申请吗？',
      '全部通过',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    await Promise.all(
      pendingRequests.value.map(request =>
        handleJoinRequest(circleId.value, request.user_id, 'approve')
      )
    )

    ElMessage.success('已全部通过')
    await Promise.all([fetchPendingRequests(), fetchMembers()])
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量通过失败:', error)
      ElMessage.error('批量通过失败')
    }
  }
}

const transferOwnership = async () => {
  if (!transferTarget.value) {
    ElMessage.warning('请选择要转让的成员')
    return
  }

  try {
    await ElMessageBox.confirm(
      '转让后您将失去圈子创建者身份，是否继续？',
      '转让圈子',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    transferring.value = true
    await transferCircle(circleId.value, Number(transferTarget.value))
    ElMessage.success('圈子已成功转让')
    transferTarget.value = ''
    await Promise.all([fetchCircleDetail(), fetchMembers(), fetchPendingRequests()])
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('圈子转让失败:', error)
      ElMessage.error(error.response?.data?.error || error.message || '圈子转让失败')
    }
  } finally {
    transferring.value = false
  }
}

// 保存设置
const saveSettings = async () => {
  try {
    savingSettings.value = true
    
    const updateData = {
      is_public: !settingsForm.is_private,
      need_approval: settingsForm.need_approval
    }
    
    await updateCircle(circleId.value, updateData)
    ElMessage.success('设置保存成功')
    await fetchCircleDetail()
  } catch (error: any) {
    console.error('保存设置失败:', error)
    ElMessage.error(error.response?.data?.message || '保存失败')
  } finally {
    savingSettings.value = false
  }
}

// 显示删除对话框
const showDeleteDialog = () => {
  deleteConfirm.value = ''
  deleteDialogVisible.value = true
}

// 删除圈子
const deleteCircle = async () => {
  try {
    deleting.value = true
    await deleteCircleApi(circleId.value)
    ElMessage.success('圈子已解散')
    router.push('/circles')
  } catch (error: any) {
    console.error('删除圈子失败:', error)
    ElMessage.error(error.response?.data?.message || '删除失败')
  } finally {
    deleting.value = false
    deleteDialogVisible.value = false
  }
}

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  switch (status) {
    case 'approved':
      return 'success'
    case 'pending':
      return 'warning'
    case 'rejected':
      return 'danger'
    case 'left':
      return 'info'
    default:
      return 'info'
  }
}

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'approved':
      return '已通过'
    case 'pending':
      return '待审核'
    case 'rejected':
      return '已拒绝'
    case 'left':
      return '已退出'
    default:
      return '未知'
  }
}

onMounted(() => {
  fetchCircleDetail()
  fetchMembers()
  fetchPendingRequests()
})
</script>

<style scoped>
.circle-manage-page {
  padding-top: 80px;
}

.circle-manage-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 10px 0;
  color: #303133;
}

.cover-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 300px;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.3s;
}

.cover-uploader:hover {
  border-color: #409EFF;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.member-stats {
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 5px;
}

.stat-label {
  color: #606266;
  font-size: 14px;
}

.member-actions {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.user-cell {
  display: flex;
  align-items: center;
}

.user-info {
  margin-left: 12px;
}

.username {
  font-weight: bold;
  color: #303133;
}

.user-nickname {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.pending-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.pending-header h3 {
  margin: 0;
  color: #303133;
}

.pending-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  margin-bottom: 15px;
}

.pending-item:last-child {
  margin-bottom: 0;
}

.user-details {
  margin-left: 15px;
}

.user-details h4 {
  margin: 0 0 5px 0;
  color: #303133;
}

.user-details p {
  margin: 0 0 5px 0;
  color: #606266;
}

.user-details span {
  font-size: 12px;
  color: #909399;
}

.request-actions {
  display: flex;
  gap: 10px;
}

.help-text {
  margin-top: 5px;
  font-size: 12px;
  color: #909399;
}

.danger-zone {
  margin-top: 40px;
}

.danger-zone h3 {
  color: #f56c6c;
  margin-bottom: 10px;
}

.action-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: #fef0f0;
  border-radius: 8px;
}

.danger-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.transfer-form {
  display: flex;
  align-items: center;
  gap: 12px;
}

.transfer-form .el-select {
  flex: 1;
}

.action-info h4 {
  margin: 0 0 5px 0;
  color: #303133;
}

.action-info p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.sidebar-card {
  margin-bottom: 20px;
}

.quick-actions {
  display: flex;
  flex-direction: column;
}

.stats-list {
  padding: 0;
}

.stats-list .stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
}

.stats-list .stat-item:last-child {
  border-bottom: none;
}

.delete-warning p {
  color: #606266;
  line-height: 1.6;
  margin: 0;
}
</style>
