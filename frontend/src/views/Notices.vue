<template>
  <div class="notices">
    <NavHeader />
    <div class="notices-container">
      <div class="notices-header">
        <h2>重要通知</h2>
        <p>及时了解学校最新动态</p>
      </div>
      
      <div class="notices-filters">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-input
              v-model="searchQuery"
              placeholder="搜索通知..."
              prefix-icon="Search"
              clearable
            />
          </el-col>
          <el-col :span="8">
            <el-select v-model="selectedCategory" placeholder="选择分类" clearable>
              <el-option label="全部" value="" />
              <el-option label="教务通知" value="academic" />
              <el-option label="校园活动" value="activity" />
              <el-option label="紧急通知" value="urgent" />
              <el-option label="其他" value="other" />
            </el-select>
          </el-col>
          <el-col :span="8">
            <div style="display: flex; gap: 10px;">
              <el-select v-model="sortBy" placeholder="排序方式" style="flex: 1;">
                <el-option label="最新发布" value="newest" />
                <el-option label="置顶优先" value="pinned" />
              </el-select>
              <el-button v-if="isAdmin" type="primary" @click="showCreateDialog">
                发布通知
              </el-button>
            </div>
          </el-col>
        </el-row>
      </div>
      
      <div class="notices-list">
        <div v-if="loading" class="loading">
          <el-skeleton :rows="3" animated />
        </div>
        
        <div v-else-if="filteredNotices.length === 0" class="empty">
          <el-empty description="暂无通知" />
        </div>
        
        <div v-else>
          <div v-for="notice in filteredNotices" :key="notice.id" class="notice-item">
            <el-card :class="{ 'pinned': notice.is_pinned }">
              <div class="notice-header">
                <div class="notice-title">
                  <el-tag v-if="notice.is_pinned" type="danger" size="small">置顶</el-tag>
                  <el-tag :type="getCategoryType(notice.category)" size="small">
                    {{ getCategoryName(notice.category) }}
                  </el-tag>
                  <h3>{{ notice.title }}</h3>
                </div>
                <div class="notice-meta">
                  <span class="notice-time">{{ formatDate(notice.created_at) }}</span>
                  <el-dropdown v-if="isAdmin" @command="(cmd) => handleNoticeCommand(cmd, notice)">
                    <el-button icon="MoreFilled" circle size="small" />
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="edit">编辑</el-dropdown-item>
                        <el-dropdown-item command="delete" type="danger">删除</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>
              
              <div class="notice-content">
                <p>{{ notice.content.substring(0, 150) }}...</p>
              </div>
              
              <div class="notice-actions">
                <el-button type="primary" @click="viewNotice(notice)">
                  查看详情
                </el-button>
              </div>
            </el-card>
          </div>
        </div>
      </div>
      
      <!-- 通知详情对话框 -->
      <el-dialog
        v-model="dialogVisible"
        :title="selectedNotice?.title"
        width="80%"
        class="notice-dialog"
      >
        <div v-if="selectedNotice" class="notice-detail">
          <div class="notice-detail-header">
            <div class="notice-detail-meta">
              <el-tag v-if="selectedNotice.is_pinned" type="danger">置顶</el-tag>
              <el-tag :type="getCategoryType(selectedNotice.category)">
                {{ getCategoryName(selectedNotice.category) }}
              </el-tag>
              <span class="notice-detail-time">{{ formatDate(selectedNotice.created_at) }}</span>
            </div>
          </div>
          
          <div class="notice-detail-content">
            <div v-html="selectedNotice.content"></div>
          </div>
        </div>
        
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="dialogVisible = false">关闭</el-button>
            <el-button v-if="isAdmin" type="primary" @click="editNotice(selectedNotice)">
              编辑
            </el-button>
          </div>
        </template>
      </el-dialog>
      
      <!-- 创建/编辑通知对话框 -->
      <el-dialog
        v-model="createDialogVisible"
        :title="editingNotice ? '编辑通知' : '发布通知'"
        width="80%"
        class="notice-dialog"
      >
        <el-form :model="noticeForm" :rules="noticeRules" ref="noticeFormRef" label-width="100px">
          <el-form-item label="标题" prop="title">
            <el-input v-model="noticeForm.title" placeholder="请输入通知标题" />
          </el-form-item>
          
          <el-form-item label="分类" prop="category">
            <el-select v-model="noticeForm.category" placeholder="请选择分类">
              <el-option label="教务通知" value="academic" />
              <el-option label="校园活动" value="activity" />
              <el-option label="紧急通知" value="urgent" />
              <el-option label="其他" value="other" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="内容" prop="content">
            <el-input
              v-model="noticeForm.content"
              type="textarea"
              :rows="10"
              placeholder="请输入通知内容"
            />
          </el-form-item>
          
          <el-form-item label="置顶">
            <el-switch v-model="noticeForm.is_pinned" />
          </el-form-item>
        </el-form>
        
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="createDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="saveNotice" :loading="saving">
              {{ editingNotice ? '更新' : '发布' }}
            </el-button>
          </div>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Star, StarFilled } from '@element-plus/icons-vue'
import { useNoticeStore } from '@/stores/notice'
import { useUserStore } from '@/stores/user'
import { formatDate } from '@/utils'
import NavHeader from '@/components/NavHeader.vue'

const noticeStore = useNoticeStore()
const userStore = useUserStore()

const searchQuery = ref('')
const selectedCategory = ref('')
const sortBy = ref('newest')
const dialogVisible = ref(false)
const selectedNotice = ref(null)
const createDialogVisible = ref(false)
const editingNotice = ref(null)
const saving = ref(false)
const noticeFormRef = ref()

const noticeForm = ref({
  title: '',
  content: '',
  category: '',
  is_pinned: false
})

const noticeRules = {
  title: [
    { required: true, message: '请输入通知标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在2到100个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入通知内容', trigger: 'blur' },
    { min: 10, message: '内容至少10个字符', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ]
}

const loading = computed(() => noticeStore.loading)
const notices = computed(() => noticeStore.notices)
const isLoggedIn = computed(() => userStore.isLoggedIn)
const isAdmin = computed(() => userStore.isAdmin)

const filteredNotices = computed(() => {
  let filtered = notices.value

  // 搜索过滤
  if (searchQuery.value) {
    filtered = filtered.filter(notice => 
      notice.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      notice.content.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  // 分类过滤
  if (selectedCategory.value) {
    filtered = filtered.filter(notice => notice.category === selectedCategory.value)
  }

  // 排序
  if (sortBy.value === 'newest') {
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  } else if (sortBy.value === 'pinned') {
    filtered.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1
      if (!a.is_pinned && b.is_pinned) return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }

  return filtered
})

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

const viewNotice = async (notice) => {
  selectedNotice.value = notice
  dialogVisible.value = true
  
  try {
    await noticeStore.fetchNoticeById(notice.id)
    selectedNotice.value = noticeStore.currentNotice
  } catch (error: any) {
    console.error('获取通知详情失败:', error)
    ElMessage.error('获取通知详情失败')
  }
}

const showCreateDialog = () => {
  editingNotice.value = null
  noticeForm.value = {
    title: '',
    content: '',
    category: '',
    is_pinned: false
  }
  createDialogVisible.value = true
}

const editNotice = (notice) => {
  editingNotice.value = notice
  noticeForm.value = {
    title: notice.title,
    content: notice.content,
    category: notice.category,
    is_pinned: notice.is_pinned
  }
  createDialogVisible.value = true
}

const saveNotice = async () => {
  if (!noticeFormRef.value) return
  
  try {
    await noticeFormRef.value.validate()
    saving.value = true
    
    if (editingNotice.value) {
      await noticeStore.updateNotice(editingNotice.value.id, noticeForm.value)
      ElMessage.success('更新成功')
    } else {
      await noticeStore.createNotice(noticeForm.value)
      ElMessage.success('发布成功')
    }
    
    createDialogVisible.value = false
    
  } catch (error: any) {
    console.error('保存通知失败:', error)
    ElMessage.error(error || '保存失败')
  } finally {
    saving.value = false
  }
}

const handleNoticeCommand = async (command: string, notice: any) => {
  if (command === 'edit') {
    editNotice(notice)
  } else if (command === 'delete') {
    try {
      await ElMessageBox.confirm('确定要删除这条通知吗？', '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      
      await noticeStore.deleteNotice(notice.id)
      ElMessage.success('删除成功')
      
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('删除失败:', error)
        ElMessage.error(error || '删除失败')
      }
    }
  }
}

onMounted(async () => {
  // 初始化用户状态
  userStore.initUser()
  
  // 加载通知列表
  try {
    await noticeStore.fetchNotices()
  } catch (error: any) {
    console.error('加载通知失败:', error)
    ElMessage.error('加载通知失败')
  }
})
</script>

<style scoped>
.notices {
  min-height: 100vh;
  background: #f5f7fa;
  padding-top: 80px;
}

.notices-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.notices-header {
  text-align: center;
  margin-bottom: 30px;
}

.notices-header h2 {
  margin: 0;
  color: #303133;
  font-size: 32px;
}

.notices-header p {
  margin: 8px 0 0 0;
  color: #909399;
  font-size: 16px;
}

.notices-filters {
  margin-bottom: 30px;
}

.notices-list {
  min-height: 400px;
}

.loading {
  padding: 20px;
}

.empty {
  padding: 60px 0;
}

.notice-item {
  margin-bottom: 20px;
}

.notice-item.pinned .el-card {
  border: 2px solid #f56c6c;
  box-shadow: 0 2px 12px rgba(245, 108, 108, 0.1);
}

.notice-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.notice-title {
  flex: 1;
}

.notice-title h3 {
  margin: 8px 0 0 0;
  color: #303133;
  font-size: 18px;
  line-height: 1.4;
}

.notice-title .el-tag {
  margin-right: 8px;
}

.notice-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.notice-time {
  font-size: 12px;
  color: #909399;
}

.notice-views {
  font-size: 12px;
  color: #c0c4cc;
}

.notice-content {
  margin-bottom: 15px;
}

.notice-content p {
  margin: 0;
  line-height: 1.6;
  color: #606266;
}

.notice-actions {
  display: flex;
  gap: 10px;
}

.notice-actions .el-button {
  padding: 8px 16px;
}

.notice-actions .favorited {
  color: #e6a23c;
}

.notice-detail-header {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e4e7ed;
}

.notice-detail-meta {
  display: flex;
  align-items: center;
  gap: 15px;
}

.notice-detail-time {
  color: #909399;
  font-size: 14px;
}

.notice-detail-views {
  color: #c0c4cc;
  font-size: 14px;
}

.notice-detail-content {
  line-height: 1.8;
  color: #303133;
}

.notice-detail-content h3 {
  margin: 20px 0 10px 0;
  color: #303133;
}

.notice-detail-content ul {
  margin: 10px 0;
  padding-left: 20px;
}

.notice-detail-content li {
  margin-bottom: 5px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 768px) {
  .notices-filters .el-col {
    margin-bottom: 15px;
  }
  
  .notice-header {
    flex-direction: column;
    gap: 10px;
  }
  
  .notice-meta {
    flex-direction: row;
    justify-content: space-between;
  }
}
</style>