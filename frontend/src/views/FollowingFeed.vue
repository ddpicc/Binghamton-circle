<template>
  <div class="following-feed-page">
    <NavHeader />
    
    <div class="feed-container">
      <!-- 页头：我的圈子 + 更多圈子入口 -->
      <div class="page-header">
        <h2>我的圈子</h2>
        <div class="header-actions">
          <el-button type="primary" @click="openPublishDialog" :disabled="userCircles.length === 0">
            <el-icon><EditPen /></el-icon>
            发布帖子
          </el-button>
          <el-link type="primary" @click="goToCircles">更多圈子</el-link>
        </div>
      </div>

      <el-row :gutter="20" class="feed-layout">
        <el-col :xs="24" :lg="17" class="main-column">
          <!-- 筛选器 -->
          <div class="filter-section">
            <el-select v-model="selectedCircle" placeholder="选择圈子" clearable @change="handleFilterChange">
              <el-option label="全部圈子" value="" />
              <el-option
                v-for="circle in userCircles"
                :key="circle.id || circle.name"
                :label="circle.name"
                :value="circle.id"
              />
            </el-select>

            <el-select v-model="sortBy" placeholder="排序方式" @change="handleFilterChange">
              <el-option label="最新发布" value="created_at" />
              <el-option label="最多点赞" value="like_count" />
              <el-option label="最多评论" value="comment_count" />
              <el-option label="最多浏览" value="view_count" />
            </el-select>

            <el-button @click="refreshFeed" :loading="loading">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>

          <WaterfallPosts
            :posts="posts"
            :is-loading="loading"
            :has-more="hasMore"
            :empty-description="userCircles.length === 0 ? '你还没有加入任何圈子' : '暂无帖子'"
            :show-join-circle-button="userCircles.length === 0"
            :no-padding="true"
            @load-more="loadMorePosts"
            @refresh="refreshFeed"
            @view-post="viewPost"
            @view-user="viewUser"
            @join-circle="goToCircles"
            @toggle-like="toggleLike"
          />
        </el-col>

        <el-col :xs="24" :lg="7" class="sidebar-column">
          <el-card class="sidebar-card">
            <template #header>
              <div class="card-header">
                <span>我的圈子</span>
              </div>
            </template>
            <div v-if="userCircles.length > 0" class="my-circles-list">
              <div
                v-for="circle in userCircles.slice(0, 5)"
                :key="circle.id"
                class="my-circle-item"
                :style="{ backgroundImage: `url(${circle.cover_image || '/default-circle-cover.jpg'})` }"
                @click="viewCircle(circle.id)"
              >
                <div class="my-circle-overlay"></div>
                <div class="my-circle-info">
                  <h4>{{ circle.name }}</h4>
                  <span>{{ circle.member_count || 0 }} 成员</span>
                </div>
              </div>
            </div>
            <el-empty v-else description="还没有加入任何圈子" :image-size="60" />
          </el-card>

          <el-card class="sidebar-card">
            <template #header>
              <div class="card-header">
                <span>热门圈子</span>
              </div>
            </template>
            <div v-if="hotCircles.length > 0" class="hot-circles-list">
              <div
                v-for="circle in hotCircles"
                :key="circle.id"
                class="hot-circle-item"
                :style="{ backgroundImage: `url(${circle.cover_image || '/default-circle-cover.jpg'})` }"
                @click="viewCircle(circle.id)"
              >
                <div class="hot-circle-overlay"></div>
                <div class="hot-circle-info">
                  <h4>{{ circle.name }}</h4>
                  <span>{{ circle.member_count || 0 }} 成员</span>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无热门圈子" :image-size="60" />
          </el-card>
        </el-col>
      </el-row>
    </div>

    <el-dialog
      v-model="publishDialogVisible"
      title="发布帖子"
      width="600px"
      :close-on-click-modal="false"
      @closed="resetPostForm"
    >
      <el-form ref="postFormRef" :model="postForm" :rules="postRules" label-width="100px">
        <el-form-item label="圈子" prop="circle_id">
          <el-select v-model="postForm.circle_id" placeholder="请选择圈子">
            <el-option
              v-for="circle in userCircles"
              :key="circle.id"
              :label="circle.name"
              :value="circle.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="标题" prop="title">
          <el-input
            v-model="postForm.title"
            placeholder="请输入帖子标题"
            maxlength="60"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="内容" prop="content">
          <el-input
            v-model="postForm.content"
            type="textarea"
            :rows="6"
            placeholder="请输入帖子内容"
            maxlength="2000"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="图片">
          <el-upload
            v-model:file-list="postForm.images"
            action="#"
            list-type="picture-card"
            :auto-upload="false"
            :limit="9"
            :on-change="handleImageChange"
            :on-remove="handleImageChange"
            :on-exceed="handleImageExceed"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="publishDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPost" :loading="submitting">
          发布
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import NavHeader from '@/components/NavHeader.vue'
import WaterfallPosts from '@/components/WaterfallPosts.vue'
import { Refresh, Plus, EditPen } from '@element-plus/icons-vue'
import {
  getMyCircles,
  getUserCirclePosts,
  getCircles,
  uploadService,
  postService,
  type Circle,
  type Post
} from '@/services'
import type { UploadUserFile, FormInstance } from 'element-plus'

const router = useRouter()

// 数据
const posts = ref<Post[]>([])
const userCircles = ref<Circle[]>([])
const hotCircles = ref<Circle[]>([])
const loading = ref(false)
const hasMore = ref(true)
const currentPage = ref(1)
const pageSize = ref(20)
const selectedCircle = ref<number | string>('')
const sortBy = ref('created_at')
const publishDialogVisible = ref(false)
const submitting = ref(false)
const postFormRef = ref<FormInstance>()
const postForm = ref({
  circle_id: '' as number | string,
  title: '',
  content: '',
  images: [] as UploadUserFile[]
})

const postRules = {
  circle_id: [{ required: true, message: '请选择圈子', trigger: 'change' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

// 获取用户圈子列表
const fetchUserCircles = async () => {
  try {
    const response = await getMyCircles()
    // 处理响应数据 - 后端返回 { circles: [...] }
    let circles = []
    if (response && response.circles && Array.isArray(response.circles)) {
      circles = response.circles
    } else if (Array.isArray(response)) {
      circles = response
    } else if (response && response.data && Array.isArray(response.data)) {
      circles = response.data
    }
    
    // 确保是数组并过滤无效数据
    userCircles.value = Array.isArray(circles) 
      ? circles.filter(circle => circle && circle.id && circle.name)
      : []
    
    if (userCircles.value.length > 0 && !postForm.value.circle_id) {
      postForm.value.circle_id = userCircles.value[0].id
    }

  } catch (error) {
    console.error('获取用户圈子失败:', error)
    ElMessage.error('获取用户圈子失败')
    userCircles.value = []
  }
}

const fetchHotCircles = async () => {
  try {
    const response = await getCircles({
      page: 1,
      limit: 5,
      sortBy: 'member_count',
      sortOrder: 'DESC'
    })

    const circles = response?.circles || response?.items || []
    hotCircles.value = Array.isArray(circles) ? circles.slice(0, 5) : []
  } catch (error) {
    console.error('获取热门圈子失败:', error)
    hotCircles.value = []
  }
}

// 获取帖子列表
const fetchPosts = async (append = false) => {
  try {
    loading.value = true
    
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      circle_id: selectedCircle.value || undefined,
      sortBy: sortBy.value,
      sortOrder: 'DESC'
    }
    
    const response = await getUserCirclePosts(params)
    
    const postData = response.data || response
    const allPosts = postData.posts || []
    
    if (append) {
      posts.value.push(...allPosts)
    } else {
      posts.value = allPosts
    }
    
    // 检查是否还有更多数据
    const pagination = postData.pagination || {}
    hasMore.value = (pagination.page || 0) < (pagination.totalPages || 0)
    
      
  } catch (error) {
    console.error('获取帖子失败:', error)
    ElMessage.error('获取帖子失败')
  } finally {
    loading.value = false
  }
}

// 加载更多帖子
const loadMorePosts = () => {
  if (!loading.value && hasMore.value) {
    currentPage.value++
    fetchPosts(true)
  }
}

// 刷新动态
const refreshFeed = () => {
  currentPage.value = 1
  posts.value = []
  fetchPosts()
}

// 处理筛选变化
const handleFilterChange = () => {
  currentPage.value = 1
  posts.value = []
  fetchPosts()
}

// 查看帖子
const viewPost = (post: Post) => {
  router.push(`/posts/${post.id}`)
}

// 查看用户
const viewUser = (userId: number) => {
  router.push(`/profile/${userId}`)
}

// 跳转到圈子页面
const goToCircles = () => {
  router.push('/circles')
}

// 点赞功能
const toggleLike = async (post: Post) => {
  try {
    // 临时更新UI
    const currentLikeStatus = post.is_liked || false
    const currentLikeCount = post.like_count || 0

    // 更新本地状态
    post.is_liked = !currentLikeStatus
    post.like_count = currentLikeStatus ? currentLikeCount - 1 : currentLikeCount + 1

    // 调用API
    const response = await fetch(`/api/posts/${post.id}/like`, {
      method: post.is_liked ? 'POST' : 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    })

    if (!response.ok) {
      // 如果失败，恢复原来的状态
      post.is_liked = currentLikeStatus
      post.like_count = currentLikeCount
      throw new Error('点赞操作失败')
    }

  } catch (error) {
    console.error('点赞失败:', error)

    // 恢复原来的状态
    const currentLikeStatus = post.is_liked || false
    const currentLikeCount = post.like_count || 0
    post.is_liked = !currentLikeStatus
    post.like_count = currentLikeStatus ? currentLikeCount - 1 : currentLikeCount + 1
  }
}

const viewCircle = (circleId: number) => {
  router.push(`/circles/${circleId}`)
}

const openPublishDialog = () => {
  if (userCircles.value.length === 0) {
    ElMessage.warning('加入圈子后才能发布帖子')
    return
  }
  if (!postForm.value.circle_id) {
    postForm.value.circle_id = userCircles.value[0].id
  }
  publishDialogVisible.value = true
}

const handleImageChange = (_file: UploadUserFile, fileList: UploadUserFile[]) => {
  postForm.value.images = fileList
}

const handleImageExceed = () => {
  ElMessage.warning('最多只能上传9张图片')
}

const resetPostForm = () => {
  postForm.value = {
    circle_id: userCircles.value[0]?.id || '',
    title: '',
    content: '',
    images: []
  }
}

const submitPost = async () => {
  if (!postFormRef.value) return

  try {
    await postFormRef.value.validate()
    const trimmedTitle = postForm.value.title.trim()
    const trimmedContent = postForm.value.content.trim()
    if (!trimmedTitle) {
      ElMessage.error('标题不能为空')
      return
    }
    if (!trimmedContent) {
      ElMessage.error('内容不能为空')
      return
    }

    submitting.value = true

    const circleId = Number(postForm.value.circle_id)
    if (Number.isNaN(circleId)) {
      ElMessage.error('请选择有效的圈子')
      return
    }

    const imageUrls: string[] = []
    for (const file of postForm.value.images) {
      if (file.url && !file.raw) {
        imageUrls.push(file.url)
      } else if (file.raw) {
        const response = await uploadService.uploadImage(file.raw as File)
        imageUrls.push(response.image.url)
      }
    }

    await postService.createPost({
      title: trimmedTitle,
      content: trimmedContent,
      images: imageUrls,
      circle_id: circleId
    })

    ElMessage.success('发布成功')
    publishDialogVisible.value = false
    resetPostForm()
    refreshFeed()
  } catch (error: any) {
    console.error('发布帖子失败:', error)
    ElMessage.error(error?.response?.data?.message || error?.message || '发布失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchUserCircles()
  fetchPosts()
  fetchHotCircles()
})

watch(publishDialogVisible, (visible) => {
  if (!visible) {
    resetPostForm()
  }
})
</script>

<style scoped>
.following-feed-page {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding-top: 60px;
}

.feed-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
}

.feed-layout {
  margin-top: 12px;
}

.main-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sidebar-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-header h2 {
  margin: 0;
  font-size: 22px;
  color: #303133;
}

.filter-section {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: nowrap;
}

.filter-section .el-select {
  min-width: 150px;
}

.filter-section .el-button {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sidebar-card {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.my-circles-list,
.hot-circles-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.my-circle-item,
.hot-circle-item {
  position: relative;
  height: 72px;
  border-radius: 8px;
  background-size: cover;
  background-position: center;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.my-circle-item:hover,
.hot-circle-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.12);
}

.my-circle-overlay,
.hot-circle-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.15));
}

.my-circle-info,
.hot-circle-info {
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 8px;
  color: #fff;
  z-index: 1;
}

.my-circle-info h4,
.hot-circle-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
}

.my-circle-info span,
.hot-circle-info span {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
}

:deep(.waterfall-grid) {
  column-count: 2 !important;
}

@media (max-width: 768px) {
  :deep(.waterfall-grid) {
    column-count: 1 !important;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  :deep(.waterfall-grid) {
    column-count: 2 !important;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .feed-container {
    padding: 12px;
  }
  
  .feed-layout {
    margin-top: 8px;
  }

  .header-actions {
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
  }

  .header-actions .el-button {
    width: 100%;
  }

  .filter-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-section .el-select {
    width: 100%;
    min-width: auto;
  }

  .sidebar-column {
    margin-top: 12px;
  }
}

</style>
