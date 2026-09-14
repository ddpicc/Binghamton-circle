<template>
  <div class="admin-config-page">
    <NavHeader />
    <div class="admin-container">
      <div class="admin-layout">
        <!-- 左侧菜单 -->
        <div class="admin-sidebar">
          <el-card class="sidebar-card">
            <template #header>
              <div class="sidebar-header">
                <el-icon><Setting /></el-icon>
                <span>管理配置</span>
              </div>
            </template>
            <el-menu
              :default-active="activeMenu"
              mode="vertical"
              @select="handleMenuSelect"
            >
              <el-menu-item index="o2o-category">
              <el-icon><Plus /></el-icon>
              <span>新建o2o分类</span>
            </el-menu-item>
            <el-menu-item index="keyword-block">
              <el-icon><Lock /></el-icon>
              <span>关键词屏蔽</span>
            </el-menu-item>
            <el-menu-item index="allowed-login-emails">
              <el-icon><Message /></el-icon>
              <span>登录邮箱白名单</span>
            </el-menu-item>
            <el-menu-item index="home-banner">
              <el-icon><Picture /></el-icon>
              <span>首页 Banner 管理</span>
            </el-menu-item>
          </el-menu>
        </el-card>
      </div>

        <!-- 右侧配置区域 -->
        <div class="admin-content">
          <el-card class="content-card">
            <template #header>
              <div class="content-header">
                <h3>{{ currentMenuTitle }}</h3>
              </div>
            </template>

            <!-- O2O分类配置 -->
            <div v-if="activeMenu === 'o2o-category'" class="config-section">
              <div class="section-description">
                <p>创建新的O2O分类，帮助用户更好地分类和管理O2O内容。系统默认提供"二手"和"租房"分类，可直接使用。</p>
              </div>

              <el-form :model="o2oForm" :rules="o2oRules" ref="o2oFormRef" label-width="120px">
                <el-form-item label="分类标识" prop="code">
                  <el-input
                    v-model="o2oForm.code"
                    placeholder="内部使用，如 second_hand"
                    maxlength="50"
                  />
                </el-form-item>

                <el-form-item label="分类名称" prop="name">
                  <el-input
                    v-model="o2oForm.name"
                    placeholder="请输入分类名称"
                    maxlength="20"
                    show-word-limit
                  />
                </el-form-item>

                <el-form-item label="分类描述" prop="description">
                  <el-input
                    v-model="o2oForm.description"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入分类描述"
                    maxlength="200"
                    show-word-limit
                  />
                </el-form-item>


                <el-form-item label="排序权重" prop="sort_order">
                  <el-input-number
                    v-model="o2oForm.sort_order"
                    :min="0"
                    :max="999"
                    placeholder="数字越大排序越靠前"
                  />
                </el-form-item>

                <el-form-item>
                  <el-button type="primary" @click="submitO2oCategory" :loading="submitting">
                    创建分类
                  </el-button>
                  <el-button @click="resetO2oForm">重置</el-button>
                </el-form-item>
              </el-form>

              <!-- 已有分类列表 -->
              <div class="existing-categories">
                <h4>已有分类</h4>
                <el-table :data="categories" style="width: 100%">
                  <el-table-column prop="code" label="分类标识" width="160" />
                  <el-table-column prop="name" label="分类名称" />
                  <el-table-column prop="description" label="描述" show-overflow-tooltip />
                  <el-table-column prop="sort_order" label="排序" width="80" />
                  <el-table-column prop="created_at" label="创建时间" width="180">
                    <template #default="scope">
                      {{ formatDate(scope.row.created_at) }}
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="100">
                    <template #default="scope">
                      <el-button type="danger" size="small" @click="deleteCategory(scope.row.id)">
                        删除
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>

            <!-- 关键词屏蔽配置 -->
            <div v-if="activeMenu === 'keyword-block'" class="config-section">
              <div class="section-description">
                <p>设置需要屏蔽的关键词，包含这些关键词的内容将被自动过滤或标记。</p>
              </div>

              <el-form :model="keywordForm" :rules="keywordRules" ref="keywordFormRef" label-width="120px">
                <el-form-item label="屏蔽类型" prop="type">
                  <el-radio-group v-model="keywordForm.type">
                    <el-radio value="exact">完全匹配</el-radio>
                    <el-radio value="partial">包含匹配</el-radio>
                    <el-radio value="regex">正则表达式</el-radio>
                  </el-radio-group>
                </el-form-item>

                <el-form-item label="关键词" prop="keyword">
                  <el-input
                    v-model="keywordForm.keyword"
                    placeholder="请输入要屏蔽的关键词"
                  />
                </el-form-item>

                <el-form-item label="处理方式" prop="action">
                  <el-radio-group v-model="keywordForm.action">
                    <el-radio value="block">完全屏蔽</el-radio>
                    <el-radio value="mark">标记提醒</el-radio>
                    <el-radio value="replace">替换为***</el-radio>
                  </el-radio-group>
                </el-form-item>

                <el-form-item label="备注" prop="reason">
                  <el-input
                    v-model="keywordForm.reason"
                    type="textarea"
                    :rows="2"
                    placeholder="请输入屏蔽原因（可选）"
                  />
                </el-form-item>

                <el-form-item>
                  <el-button type="primary" @click="submitKeyword" :loading="submitting">
                    添加屏蔽
                  </el-button>
                  <el-button @click="resetKeywordForm">重置</el-button>
                </el-form-item>
              </el-form>

              <!-- 已有关键词列表 -->
              <div class="existing-keywords">
                <h4>已屏蔽关键词</h4>
                <el-table :data="keywords" style="width: 100%">
                  <el-table-column prop="keyword" label="关键词" />
                  <el-table-column prop="type" label="匹配类型" width="100">
                    <template #default="scope">
                      <el-tag :type="getTypeTagType(scope.row.type)">
                        {{ getTypeLabel(scope.row.type) }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="action" label="处理方式" width="100">
                    <template #default="scope">
                      <el-tag :type="getActionTagType(scope.row.action)">
                        {{ getActionLabel(scope.row.action) }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="reason" label="备注" show-overflow-tooltip />
                  <el-table-column prop="created_at" label="创建时间" width="180">
                    <template #default="scope">
                      {{ formatDate(scope.row.created_at) }}
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="100">
                    <template #default="scope">
                      <el-button type="danger" size="small" @click="deleteKeyword(scope.row.id)">
                        删除
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>

            <!-- 登录邮箱白名单 -->
            <div v-if="activeMenu === 'allowed-login-emails'" class="config-section">
              <div class="section-description">
                <p>维护非学校邮箱登录白名单。加入白名单后，非 edu 邮箱可通过邮箱验证码登录/注册。</p>
              </div>

              <el-form :model="allowedEmailForm" label-width="120px">
                <el-form-item label="邮箱地址">
                  <el-input
                    v-model="allowedEmailForm.email"
                    placeholder="请输入非学校邮箱，如 user@outlook.com"
                  />
                </el-form-item>
                <el-form-item label="备注">
                  <el-input
                    v-model="allowedEmailForm.note"
                    type="textarea"
                    :rows="2"
                    maxlength="200"
                    show-word-limit
                    placeholder="可选，记录加入原因"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="createAllowedEmail" :loading="allowedEmailSaving">
                    添加白名单
                  </el-button>
                </el-form-item>
              </el-form>

              <div class="non-edu-toolbar">
                <el-button size="small" @click="fetchAllowedEmails" :loading="allowedEmailLoading">
                  刷新
                </el-button>
              </div>

              <el-table
                :data="allowedEmails"
                style="width: 100%"
                v-loading="allowedEmailLoading"
                empty-text="暂无白名单邮箱"
              >
                <el-table-column prop="email" label="邮箱" min-width="260" />
                <el-table-column prop="note" label="备注" min-width="220" show-overflow-tooltip />
                <el-table-column label="状态" width="100">
                  <template #default="scope">
                    <el-tag :type="scope.row.isActive ? 'success' : 'info'">
                      {{ scope.row.isActive ? '启用' : '停用' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="创建时间" width="180">
                  <template #default="scope">
                    {{ formatDate(scope.row.createdAt) }}
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="120">
                  <template #default="scope">
                    <el-button
                      type="danger"
                      size="small"
                      @click="deleteAllowedEmail(scope.row)"
                      :loading="allowedEmailDeletingId === scope.row.id"
                    >
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <!-- 首页 Banner 管理 -->
            <div v-if="activeMenu === 'home-banner'" class="config-section">
              <div class="section-description">
                <p>配置首页展示 Banner 内容，支持从活动或通知中选择，并可覆盖标签、标题与按钮文案。</p>
              </div>

              <el-form :model="bannerForm" label-width="120px">
                <el-form-item label="内容类型">
                  <el-radio-group v-model="bannerForm.sourceType">
                    <el-radio value="activity">活动</el-radio>
                    <el-radio value="notice">通知</el-radio>
                  </el-radio-group>
                  <span class="banner-source-count">
                    活动 {{ activities.length }} 条，通知 {{ notices.length }} 条
                  </span>
                </el-form-item>

                <el-form-item label="展示内容">
                  <el-select
                    v-model="bannerForm.sourceId"
                    filterable
                    placeholder="请选择内容"
                    style="width: 100%;"
                  >
                    <el-option
                      v-for="item in currentBannerSourceOptions"
                      :key="item.id"
                      :label="item.label"
                      :value="item.id"
                    />
                  </el-select>
                </el-form-item>

                <el-form-item label="标签（可选）">
                  <el-input v-model="bannerForm.customTag" placeholder="例如：重要提醒" />
                </el-form-item>
                <el-form-item label="标题（可选）">
                  <el-input v-model="bannerForm.customTitle" placeholder="不填则使用原始标题" />
                </el-form-item>
                <el-form-item label="按钮文案（可选）">
                  <el-input v-model="bannerForm.customLinkText" placeholder="例如：查看详情" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="saveHomeBanner" :loading="bannerSaving">
                    保存 Banner
                  </el-button>
                  <el-button @click="fetchBannerData" :loading="bannerLoading">
                    刷新
                  </el-button>
                </el-form-item>
              </el-form>
            </div>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Setting, Plus, Lock, Message, Picture } from '@element-plus/icons-vue'
import NavHeader from '@/components/NavHeader.vue'
import { formatDate } from '@/utils'
import api from '@/services/api'

// 当前激活的菜单
const activeMenu = ref('o2o-category')
const submitting = ref(false)

// 菜单标题映射
const menuTitles = {
  'o2o-category': '新建o2o分类',
  'keyword-block': '关键词屏蔽',
  'allowed-login-emails': '登录邮箱白名单',
  'home-banner': '首页 Banner 管理'
}

const currentMenuTitle = computed(() => menuTitles[activeMenu.value] || '配置')

// O2O分类相关
const o2oFormRef = ref()
const o2oForm = ref({
  code: '',
  name: '',
  description: '',
  sort_order: 0
})

const o2oRules = {
  code: [
    { required: true, message: '请输入分类标识', trigger: 'blur' },
    { pattern: /^[a-z0-9_]+$/, message: '仅支持小写字母、数字和下划线', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 20, message: '长度在 1 到 20 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '长度不能超过 200 个字符', trigger: 'blur' }
  ],
  sort_order: [
    { type: 'number', message: '排序权重必须为数字值', trigger: 'blur' }
  ]
}

const categories = ref([])

// 关键词屏蔽相关
const keywordFormRef = ref()
const keywordForm = ref({
  type: 'exact',
  keyword: '',
  action: 'block',
  reason: ''
})

const keywordRules = {
  keyword: [
    { required: true, message: '请输入关键词', trigger: 'blur' }
  ]
}

const keywords = ref([])

// 登录白名单邮箱相关
const allowedEmails = ref<any[]>([])
const allowedEmailLoading = ref(false)
const allowedEmailSaving = ref(false)
const allowedEmailDeletingId = ref<number | null>(null)
const allowedEmailForm = ref({
  email: '',
  note: ''
})

// 首页 Banner 管理相关
const bannerLoading = ref(false)
const bannerSaving = ref(false)
const activities = ref<any[]>([])
const notices = ref<any[]>([])
const bannerForm = ref({
  sourceType: 'activity',
  sourceId: null as number | null,
  customTag: '',
  customTitle: '',
  customLinkText: ''
})

const currentBannerSourceOptions = computed(() => {
  const sourceList = bannerForm.value.sourceType === 'activity' ? activities.value : notices.value
  return sourceList.map((item: any) => ({
    id: item.id,
    label: `${item.title}${item.displayMeta ? ` (${item.displayMeta})` : ''}`
  }))
})

// 菜单选择处理
const handleMenuSelect = (key: string) => {
  activeMenu.value = key
  if (key === 'allowed-login-emails') {
    fetchAllowedEmails()
  }
  if (key === 'home-banner') {
    fetchBannerData()
  }
}

// 获取类型标签
const getTypeLabel = (type: string) => {
  const labels = {
    'exact': '完全匹配',
    'partial': '包含匹配',
    'regex': '正则表达式'
  }
  return labels[type] || type
}

const getTypeTagType = (type: string) => {
  const types = {
    'exact': '',
    'partial': 'warning',
    'regex': 'danger'
  }
  return types[type] || ''
}

// 获取处理方式标签
const getActionLabel = (action: string) => {
  const labels = {
    'block': '完全屏蔽',
    'mark': '标记提醒',
    'replace': '替换'
  }
  return labels[action] || action
}

const getActionTagType = (action: string) => {
  const types = {
    'block': 'danger',
    'mark': 'warning',
    'replace': 'info'
  }
  return types[action] || ''
}

// O2O分类相关方法
const submitO2oCategory = async () => {
  if (!o2oFormRef.value) return

  try {
    await o2oFormRef.value.validate()
    submitting.value = true

    // 调用API创建分类
    const response = await fetch('/api/admin/o2o-categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify(o2oForm.value)
    })

    if (response.ok) {
      ElMessage.success('分类创建成功')
      resetO2oForm()
      fetchCategories()
    } else {
      throw new Error('创建失败')
    }
  } catch (error) {
    console.error('创建分类失败:', error)
    ElMessage.error('创建失败，请重试')
  } finally {
    submitting.value = false
  }
}

const resetO2oForm = () => {
  o2oForm.value = {
    code: '',
    name: '',
    description: '',
    sort_order: 0
  }
  o2oFormRef.value?.clearValidate()
}

const deleteCategory = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个分类吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const response = await fetch(`/api/admin/o2o-categories/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    })

    if (response.ok) {
      ElMessage.success('删除成功')
      fetchCategories()
    } else {
      throw new Error('删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除分类失败:', error)
      ElMessage.error('删除失败，请重试')
    }
  }
}

// 关键词屏蔽相关方法
const submitKeyword = async () => {
  if (!keywordFormRef.value) return

  try {
    await keywordFormRef.value.validate()
    submitting.value = true

    const response = await fetch('/api/admin/keywords', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify(keywordForm.value)
    })

    if (response.ok) {
      ElMessage.success('关键词添加成功')
      resetKeywordForm()
      fetchKeywords()
    } else {
      throw new Error('添加失败')
    }
  } catch (error) {
    console.error('添加关键词失败:', error)
    ElMessage.error('添加失败，请重试')
  } finally {
    submitting.value = false
  }
}

const resetKeywordForm = () => {
  keywordForm.value = {
    type: 'exact',
    keyword: '',
    action: 'block',
    reason: ''
  }
  keywordFormRef.value?.clearValidate()
}

const deleteKeyword = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个关键词吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const response = await fetch(`/api/admin/keywords/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    })

    if (response.ok) {
      ElMessage.success('删除成功')
      fetchKeywords()
    } else {
      throw new Error('删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除关键词失败:', error)
      ElMessage.error('删除失败，请重试')
    }
  }
}

// 获取数据
const fetchCategories = async () => {
  try {
    const response = await fetch('/api/admin/o2o-categories', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    })

    if (response.ok) {
      const data = await response.json()
      categories.value = data.categories || []
    }
  } catch (error) {
    console.error('获取分类失败:', error)
  }
}

const fetchKeywords = async () => {
  try {
    const response = await fetch('/api/admin/keywords', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    })

    if (response.ok) {
      const data = await response.json()
      keywords.value = data.keywords || []
    }
  } catch (error) {
    console.error('获取关键词失败:', error)
  }
}

const fetchAllowedEmails = async () => {
  try {
    allowedEmailLoading.value = true
    const response = await fetch('/api/admin/allowed-login-emails', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    })

    if (response.ok) {
      const data = await response.json()
      allowedEmails.value = data.items || []
    } else {
      throw new Error('获取登录邮箱白名单失败')
    }
  } catch (error) {
    console.error('获取登录邮箱白名单失败:', error)
    ElMessage.error('获取登录邮箱白名单失败')
  } finally {
    allowedEmailLoading.value = false
  }
}

const createAllowedEmail = async () => {
  const email = String(allowedEmailForm.value.email || '').trim().toLowerCase()
  const note = String(allowedEmailForm.value.note || '').trim()
  if (!email) {
    ElMessage.warning('请输入邮箱')
    return
  }
  try {
    allowedEmailSaving.value = true
    const response = await fetch('/api/admin/allowed-login-emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify({ email, note })
    })

    const data = await response.json()
    if (response.ok) {
      ElMessage.success(data.message || '保存成功')
      allowedEmailForm.value.email = ''
      allowedEmailForm.value.note = ''
      fetchAllowedEmails()
    } else {
      throw new Error(data.error || '保存失败')
    }
  } catch (error: any) {
    console.error('保存登录邮箱白名单失败:', error)
    ElMessage.error(error?.message || '保存失败，请重试')
  } finally {
    allowedEmailSaving.value = false
  }
}

const deleteAllowedEmail = async (item: any) => {
  try {
    await ElMessageBox.confirm(`确认移除 ${item.email} 吗？`, '删除白名单邮箱', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    allowedEmailDeletingId.value = item.id
    const response = await fetch(`/api/admin/allowed-login-emails/${item.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    })

    const data = await response.json()
    if (response.ok) {
      ElMessage.success(data.message || '删除成功')
      fetchAllowedEmails()
    } else {
      throw new Error(data.error || '删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除登录邮箱白名单失败:', error)
      ElMessage.error(error?.message || '删除失败，请重试')
    }
  } finally {
    allowedEmailDeletingId.value = null
  }
}

const normalizeBannerSourceList = (items: any[], type: 'activity' | 'notice') => {
  return (items || []).map((item: any) => {
    const rawTime = type === 'activity' ? (item.time || item.created_at) : item.created_at
    const metaParts = [rawTime ? formatDate(rawTime) : '']
    if (type === 'activity' && item.location) metaParts.push(item.location)
    if (type === 'notice' && item.category) metaParts.push(item.category)
    return {
      ...item,
      displayMeta: metaParts.filter(Boolean).join(' · ')
    }
  })
}

const fetchBannerData = async () => {
  try {
    bannerLoading.value = true
    const [bannerData, activityData, noticeData] = await Promise.all([
      api.get('/home/banner'),
      api.get('/activities', { params: { limit: 20, sortBy: 'created_at', sortOrder: 'DESC' } }),
      api.get('/notices', { params: { limit: 20, sortBy: 'created_at', sortOrder: 'DESC' } })
    ])

    activities.value = normalizeBannerSourceList(activityData.items || activityData.activities || [], 'activity')
    notices.value = normalizeBannerSourceList(noticeData.notices || noticeData.items || noticeData.data || [], 'notice')

    const banner = bannerData.banner || null
    bannerForm.value.sourceType = banner?.sourceType || banner?.type || 'activity'
    bannerForm.value.sourceId = banner?.sourceId || banner?.id || null
    bannerForm.value.customTag = banner?.customTag || ''
    bannerForm.value.customTitle = banner?.customTitle || ''
    bannerForm.value.customLinkText = banner?.customLinkText || ''

    if ((activities.value.length + notices.value.length) === 0) {
      ElMessage.warning('暂无可选候选内容，请先发布活动或通知')
    }
  } catch (error) {
    console.error('获取 Banner 配置失败:', error)
    ElMessage.error('获取 Banner 配置失败，请检查后端地址或网络')
  } finally {
    bannerLoading.value = false
  }
}

const saveHomeBanner = async () => {
  if (!bannerForm.value.sourceId) {
    ElMessage.warning('请选择要展示的内容')
    return
  }
  try {
    bannerSaving.value = true
    const response = await fetch('/api/home/banner', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify({
        source_type: bannerForm.value.sourceType,
        source_id: bannerForm.value.sourceId,
        custom_tag: bannerForm.value.customTag.trim(),
        custom_title: bannerForm.value.customTitle.trim(),
        custom_link_text: bannerForm.value.customLinkText.trim()
      })
    })

    const data = await response.json()
    if (response.ok) {
      ElMessage.success(data.message || 'Banner 已更新')
      fetchBannerData()
    } else {
      throw new Error(data.error || '保存失败')
    }
  } catch (error: any) {
    console.error('保存 Banner 失败:', error)
    ElMessage.error(error?.message || '保存失败')
  } finally {
    bannerSaving.value = false
  }
}

// 初始化默认分类
const initDefaultCategories = async () => {
  try {
    // 检查是否已有分类
    const response = await fetch('/api/admin/o2o-categories', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    })

    if (response.ok) {
      const data = await response.json()
      const existingCategories = data.categories || []

      // 如果没有分类，创建默认的租房和二手分类
      if (existingCategories.length === 0) {
        const defaultCategories = [
          {
            name: '二手',
            description: '闲置物品转让，让资源循环利用',
            sort_order: 1
          },
          {
            name: '租房',
            description: '房屋租赁信息发布平台',
            sort_order: 2
          }
        ]

        for (const category of defaultCategories) {
          await fetch('/api/admin/o2o-categories', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            },
            body: JSON.stringify(category)
          })
        }

        ElMessage.success('已创建默认分类：二手、租房')
      }
    }
  } catch (error) {
    console.error('初始化默认分类失败:', error)
  }
}

onMounted(() => {
  fetchCategories()
  fetchKeywords()
  fetchAllowedEmails()
  fetchBannerData()
  // 初始化默认分类
  initDefaultCategories()
})
</script>

<style scoped>
.admin-config-page {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding-top: 60px;
}

.admin-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.admin-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 20px;
  min-height: calc(100vh - 100px);
}

.admin-sidebar {
  height: fit-content;
  position: sticky;
  top: 80px;
}

.sidebar-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.admin-content {
  min-height: 600px;
}

.content-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.content-header h3 {
  margin: 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.config-section {
  padding: 20px 0;
}

.section-description {
  margin-bottom: 24px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #409EFF;
}

.section-description p {
  margin: 0;
  color: #606266;
  line-height: 1.6;
}


.existing-categories,
.existing-keywords {
  margin-top: 32px;
}

.existing-categories h4,
.existing-keywords h4 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.non-edu-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.banner-source-count {
  margin-left: 12px;
  color: #909399;
  font-size: 13px;
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table__header) {
  background-color: #f8f9fa;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #303133;
}

:deep(.el-card__body) {
  padding: 20px;
}

:deep(.el-menu) {
  border-right: none;
}

:deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
  margin: 4px 0;
  border-radius: 6px;
}

:deep(.el-menu-item.is-active) {
  background-color: #409EFF;
  color: white;
}

:deep(.el-menu-item:hover) {
  background-color: #ecf5ff;
  color: #409EFF;
}

:deep(.el-menu-item.is-active:hover) {
  background-color: #337ecc;
  color: white;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .admin-layout {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .admin-sidebar {
    position: static;
  }

  .admin-container {
    padding: 16px;
  }

  .config-section {
    padding: 16px 0;
  }
}
</style>
