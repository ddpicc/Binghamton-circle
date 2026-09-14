<template>
  <div class="circle-detail-page">
    <NavHeader />
    <div class="circle-detail-container">
      <!-- 圈子头部 -->
      <div class="circle-header" v-if="circle">
      <div class="cover-section">
        <el-image
          :src="circle.cover_image || '/default-circle-cover.jpg'"
          fit="cover"
          class="cover-image"
        >
          <template #error>
            <div class="image-error">
              <el-icon><Picture /></el-icon>
            </div>
          </template>
        </el-image>
        <div class="cover-overlay"></div>
      </div>
      
      <div class="header-content">
        <el-row :gutter="20">
          <el-col :span="18">
            <div class="circle-info">
              <div class="title-section">
                <h1>{{ circle.name }}</h1>
                <el-tag v-if="circle.is_private" type="warning" size="large">
                  <el-icon><Lock /></el-icon>
                  私密圈子
                </el-tag>
              </div>
              
              <p class="description">{{ circle.description }}</p>
              
              <div class="meta-info">
                <span>
                  <el-icon><User /></el-icon>
                  {{ circle.member_count }} 成员
                </span>
                <span>
                  <el-icon><Document /></el-icon>
                  {{ circle.post_count }} 帖子
                </span>
                <span v-if="circle.category">
                  <el-icon><Folder /></el-icon>
                  {{ circle.category.name }}
                </span>
                <span>
                  <el-icon><Calendar /></el-icon>
                  创建于 {{ formatDate(circle.created_at) }}
                </span>
              </div>
              
              <div class="rules-section" v-if="circle.rules">
                <h3>圈子规则</h3>
                <pre>{{ circle.rules }}</pre>
              </div>
            </div>
          </el-col>
          
          <el-col :span="6">
            <div class="action-section">
              <template v-if="!circle.is_member">
                <el-button
                  type="primary"
                  size="large"
                  @click="handleJoin"
                  :loading="joining"
                  style="width: 100%"
                >
                  {{ circle.is_private ? '申请加入' : '加入圈子' }}
                </el-button>
              </template>
              <template v-else>
                <el-button
                  v-if="!isCircleCreator"
                  type="danger"
                  plain
                  @click="handleLeave"
                  :loading="leaving"
                  style="width: 100%"
                >
                  退出圈子
                </el-button>

                <el-button
                  v-if="isCircleCreator"
                  type="primary"
                  plain
                  @click="router.push(`/circles/${circleId}/manage`)"
                  style="width: 100%; margin-top: 10px"
                >
                  管理圈子
                </el-button>
              </template>
              
              <div class="creator-info">
                <span>创建者：</span>
                <el-link
                  type="primary"
                  @click="router.push(`/profile/${circle.creator_id}`)"
                >
                  {{ circle.creator?.username }}
                </el-link>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <el-empty description="加载失败" :image-size="100">
        <el-button type="primary" @click="fetchCircleDetail">重试</el-button>
      </el-empty>
    </div>

    <!-- 圈子不存在或无权限查看 -->
    <div v-else-if="!loading && !error && (!circle || circle.can_view === false)" class="no-access-container">
      <el-empty :description="!circle ? '圈子不存在' : '无权限查看此圈子'" :image-size="100">
        <el-button type="primary" @click="router.push('/circles')">返回圈子列表</el-button>
      </el-empty>
    </div>

    <!-- 圈子内容 -->
    <div class="circle-content" v-else-if="circle && circle.can_view !== false">
      <el-row :gutter="20">
        <!-- 左侧主内容 -->
        <el-col :span="18">
          <!-- Tab导航 -->
          <el-tabs v-model="activeTab" @tab-click="handleTabChange" @update:modelValue="handleTabChange">
            <el-tab-pane label="帖子" name="posts">
              <!-- 发布帖子按钮 -->
              <div class="post-actions" v-if="circle.is_member">
                <el-button type="primary" @click="showPostDialog = true">
                  <el-icon><Plus /></el-icon>
                  发布帖子
                </el-button>
              </div>

              <!-- 帖子列表 -->
              <div class="posts-list">
                <div v-if="posts.length > 0">
                  <div
                    v-for="post in posts"
                    :key="post.id"
                    class="post-item"
                    @click="viewPost(post)"
                  >
                    <div class="post-header">
                      <div class="user-info">
                        <el-avatar
                          :size="40"
                          :src="post.user?.avatar"
                          @click.stop="previewAvatar(post.user?.avatar)"
                          class="clickable-avatar"
                        >
                          <el-icon><UserFilled /></el-icon>
                        </el-avatar>
                        <div class="user-details">
                          <div class="username">
                            <span @click.stop="router.push(`/profile/${post.user?.id}`)" class="clickable-username">
                              {{ post.user?.username }}
                            </span>
                            <el-tag v-if="post.is_anonymous" size="small" type="info">
                              <el-icon><Lock /></el-icon>
                              匿名
                            </el-tag>
                          </div>
                          <div class="post-time">{{ formatDate(post.created_at) }}</div>
                        </div>
                      </div>
                      <div class="post-actions" v-if="canManagePost(post)" @click.stop>
                        <el-dropdown>
                          <el-button type="text" size="small">
                            <el-icon><More /></el-icon>
                          </el-button>
                          <template #dropdown>
                            <el-dropdown-menu>
                              <el-dropdown-item @click="editPost(post)">
                                <el-icon><Edit /></el-icon>
                                编辑
                              </el-dropdown-item>
                              <el-dropdown-item @click="deletePost(post)">
                                <el-icon><Delete /></el-icon>
                                删除
                              </el-dropdown-item>
                            </el-dropdown-menu>
                          </template>
                        </el-dropdown>
                      </div>
                    </div>
                    
                    <div class="post-content">
                      <h3 class="post-title">{{ post.title }}</h3>
                      <p class="post-excerpt">{{ post.content }}</p>
                      
                      <!-- 图片展示 -->
                      <div v-if="post.images && post.images.length > 0" class="post-images">
                        <el-row :gutter="8">
                          <el-col
                            v-for="(image, index) in post.images.slice(0, 6)"
                            :key="index"
                            :span="post.images.length === 1 ? 24 : post.images.length === 2 ? 12 : 8"
                          >
                            <el-image
                              :src="image"
                              fit="cover"
                              class="post-image"
                              :preview-src-list="post.images"
                              :initial-index="index"
                              loading="lazy"
                            >
                              <template #error>
                                <div class="image-error">
                                  <el-icon><Picture /></el-icon>
                                </div>
                              </template>
                            </el-image>
                          </el-col>
                        </el-row>
                        <div v-if="post.images.length > 6" class="more-images">
                          +{{ post.images.length - 6 }} 张图片
                        </div>
                      </div>
                    </div>
                    
                    <div class="post-footer">
                      <div class="post-stats">
                        <span class="stat-item" @click.stop="toggleLike(post)">
                          <el-icon><Goods /></el-icon>
                          {{ post.like_count || 0 }}
                        </span>
                        <span class="stat-item">
                          <el-icon><ChatDotRound /></el-icon>
                          {{ post.comment_count || 0 }}
                        </span>
                        <span class="stat-item">
                          <el-icon><View /></el-icon>
                          {{ post.view_count || 0 }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- 加载更多 -->
                <div v-if="hasMorePosts" class="load-more-posts">
                  <el-button
                    type="primary"
                    plain
                    @click="loadMorePosts"
                    :loading="loadingPosts"
                  >
                    加载更多
                  </el-button>
                </div>
                
                <el-empty
                  v-else-if="!loadingPosts && posts.length === 0"
                  description="暂无帖子"
                >
                  <el-button type="primary" @click="showPostDialog = true" v-if="circle.is_member">
                    发布第一个帖子
                  </el-button>
                </el-empty>
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="成员" name="members">
              <div class="members-list">
                <template v-if="members.length > 0">
                  <el-row :gutter="20">
                    <el-col
                      v-for="member in members"
                      :key="member.id"
                      :span="8"
                      class="member-item-col"
                    >
                      <el-card class="member-card">
                        <div class="member-info">
                          <el-avatar
                            :size="60"
                            :src="member.user?.avatar"
                            @click="router.push(`/profile/${member.user_id}`)"
                          >
                            <el-icon><UserFilled /></el-icon>
                          </el-avatar>
                          <div class="member-details">
                            <h4>{{ member.user?.username }}</h4>
                            <p>{{ member.user?.profile?.nickname || '暂无昵称' }}</p>
                            <el-tag
                              :type="getRoleTagType(member.role)"
                              size="small"
                            >
                              {{ getRoleText(member.role) }}
                            </el-tag>
                          </div>
                        </div>
                      </el-card>
                    </el-col>
                  </el-row>
                  
                  <!-- 加载更多 -->
                  <div v-if="hasMoreMembers" class="load-more">
                    <el-button
                      type="primary"
                      plain
                      @click="loadMoreMembers"
                      :loading="loadingMembers"
                    >
                      加载更多
                    </el-button>
                  </div>
                </template>
                
                <el-empty
                  v-else-if="!loadingMembers"
                  description="暂无成员"
                />
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-col>
        
        <!-- 右侧边栏 -->
        <el-col :span="6">
          <!-- 圈子统计 -->
          <el-card class="sidebar-card">
            <template #header>
              <span>圈子统计</span>
            </template>
            <div class="stats-list">
              <div class="stat-item">
                <span class="stat-label">成员总数</span>
                <span class="stat-value">{{ circle?.member_count || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">帖子总数</span>
                <span class="stat-value">{{ circle?.post_count || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">今日新增</span>
                <span class="stat-value">0</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">活跃度</span>
                <span class="stat-value">高</span>
              </div>
            </div>
          </el-card>
          
          <!-- 管理员 -->
          <el-card class="sidebar-card" v-if="admins.length > 0">
            <template #header>
              <span>管理员</span>
            </template>
            <div class="admins-list">
              <div
                v-for="admin in admins"
                :key="admin.id"
                class="admin-item"
                @click="router.push(`/profile/${admin.user_id}`)"
              >
                <el-avatar :size="32" :src="admin.user?.avatar">
                  <el-icon><UserFilled /></el-icon>
                </el-avatar>
                <span>{{ admin.user?.username }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 无权限提示 -->
    <div v-else class="no-permission">
      <el-result
        icon="lock"
        title="私密圈子"
        sub-title="这是一个私密圈子，您需要先申请加入才能查看内容"
      >
        <template #extra>
          <el-button
            type="primary"
            @click="handleJoin"
            :loading="joining"
          >
            申请加入
          </el-button>
        </template>
      </el-result>
    </div>

    <!-- 发布帖子对话框 -->
    <el-dialog
      v-model="showPostDialog"
      title="发布帖子"
      width="600px"
      @closed="resetPostForm"
    >
      <el-form
        ref="postFormRef"
        :model="postForm"
        :rules="postRules"
        label-width="80px"
      >
        <el-form-item label="标题" prop="title">
          <el-input
            v-model="postForm.title"
            placeholder="请输入帖子标题"
            maxlength="200"
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
        <el-button @click="showPostDialog = false">取消</el-button>
        <el-button
          type="primary"
          @click="submitPost"
          :loading="submitting"
        >
          发布
        </el-button>
      </template>
    </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import NavHeader from '@/components/NavHeader.vue'
import {
  Picture,
  User,
  Document,
  Folder,
  Calendar,
  Lock,
  Plus,
  More,
  ChatDotRound,
  UserFilled
} from '@element-plus/icons-vue'
import {
  getCircleById,
  joinCircle,
  leaveCircle,
  getCircleMembers,
  getCirclePosts,
  type Circle,
  type CircleMember,
  type Post
} from '@/services'
import { postService } from '@/services/post'
import { formatDate } from '@/utils'
import { useUserStore } from '@/stores/user'
import { uploadService } from '@/services/upload'
import type { UploadUserFile, FormInstance } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
userStore.initUser()

// 数据
const circleId = computed(() => parseInt(route.params.id as string))
const circle = ref<Circle>()
const posts = ref<Post[]>([])
const members = ref<CircleMember[]>([])
const admins = ref<CircleMember[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const joining = ref(false)
const leaving = ref(false)
const loadingPosts = ref(false)
const loadingMembers = ref(false)

// 分页
const currentPagePosts = ref(1)
const currentPageMembers = ref(1)
const pageSizePosts = ref(10)
const pageSizeMembers = ref(20)
const totalPosts = ref(0)
const totalMembers = ref(0)
const hasMorePosts = computed(() => posts.value.length < totalPosts.value)
const hasMoreMembers = computed(() => members.value.length < totalMembers.value)

// Tab
const activeTab = ref('posts')
const isCircleCreator = computed(() => circle.value?.user_role === 'creator')
const currentUserId = computed(() => userStore.user?.id ?? null)

onMounted(() => {
  fetchCircleDetail()
  fetchPosts()
})

// 发布帖子
const showPostDialog = ref(false)
const submitting = ref(false)
const postFormRef = ref<FormInstance>()
const postForm = ref({
  title: '',
  content: '',
  images: [] as UploadUserFile[]
})
const postRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

// 获取圈子详情
const previewAvatar = (avatarUrl) => {
  if (avatarUrl) {
    ElMessage.info('头像预览功能开发中')
  }
}

// 获取帖子列表
const fetchPosts = async (append = false) => {
  try {
    loadingPosts.value = true
    const res = await getCirclePosts(circleId.value, {
      page: currentPagePosts.value,
      limit: pageSizePosts.value
    })
    
    console.log('获取圈子帖子响应:', res)
    
    // 处理响应数据
    const postData = res.data || res
    const postsList = postData.posts || []
    
    if (append) {
      posts.value.push(...postsList)
    } else {
      posts.value = postsList
    }
    
    const pagination = postData.pagination || {}
    totalPosts.value = pagination.total || 0
  } catch (error) {
    console.error('获取帖子列表失败:', error)
    ElMessage.error('获取帖子列表失败')
  } finally {
    loadingPosts.value = false
  }
}

// 获取成员列表
const fetchMembers = async (append = false) => {
  try {
    loadingMembers.value = true
    const res = await getCircleMembers(circleId.value, {
      page: currentPageMembers.value,
      limit: pageSizeMembers.value
    })
    
    if (append) {
      members.value.push(...res.members)
    } else {
      members.value = res.members || []
    }
    
    totalMembers.value = res.pagination?.total || 0
    
    // 提取管理员
    admins.value = members.value.filter(m => m.role === 'creator' || m.role === 'admin')
  } catch (error: any) {
    console.error('获取成员列表失败:', error)
    if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请稍后重试')
    } else {
      ElMessage.error(error.response?.data?.message || '获取成员列表失败')
    }
  } finally {
    loadingMembers.value = false
  }
}

// 处理Tab切换
const handleTabChange = (tab) => {
  currentPagePosts.value = 1
  currentPageMembers.value = 1
  
  if (activeTab.value === 'posts') {
    fetchPosts()
  } else if (activeTab.value === 'members') {
    fetchMembers()
  }
}

// 加载更多帖子
const loadMorePosts = () => {
  currentPagePosts.value++
  fetchPosts(true)
}

// 加载更多成员
const loadMoreMembers = () => {
  currentPageMembers.value++
  fetchMembers(true)
}

// 加入圈子
const handleJoin = async () => {
  try {
    joining.value = true
    
    if (circle.value?.is_private) {
      await ElMessageBox.confirm(
        '这是一个私密圈子，申请后需要等待管理员审核',
        '申请加入圈子',
        {
          confirmButtonText: '申请加入',
          cancelButtonText: '取消',
          type: 'info'
        }
      )
    }

    await joinCircle(circleId.value)
    ElMessage.success(circle.value?.is_private ? '申请已提交' : '加入成功')
    await fetchCircleDetail()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('加入圈子失败:', error)
      ElMessage.error(error.response?.data?.message || '加入圈子失败')
    }
  } finally {
    joining.value = false
  }
}

// 退出圈子
const handleLeave = async () => {
  if (!circle.value) return
  try {
    await ElMessageBox.confirm(
      '确定要退出这个圈子吗？',
      '退出圈子',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    leaving.value = true
    console.log('[CircleDetail] leaveCircle request start', { circleId: circleId.value })
    await leaveCircle(circleId.value)
    console.log('[CircleDetail] leaveCircle request success')
    ElMessage.success('已退出圈子')
    router.push('/following')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('[CircleDetail] leaveCircle error:', error)
      console.error('退出圈子失败:', error)
      ElMessage.error(error.response?.data?.message || '退出圈子失败')
    }
  } finally {
    console.log('[CircleDetail] leaveCircle finished')
    leaving.value = false
  }
}

// 查看帖子
const viewPost = (post) => {
  router.push(`/posts/${post.id}`)
}

// 切换点赞
const toggleLike = async (post: Post) => {
  // TODO: 实现点赞功能
  ElMessage.info('点赞功能待实现')
}

// 判断是否可以管理帖子
const canManagePost = (post: Post) => {
  if (!circle.value) return false
  const userId = currentUserId.value
  if (!userId) return false
  const isGlobalAdmin = userStore.user?.role === 'admin'
  return (
    isGlobalAdmin ||
    circle.value.user_role === 'creator' ||
    circle.value.user_role === 'admin' ||
    post.user_id === userId
  )
}

// 编辑帖子
const editPost = (post: Post) => {
  // TODO: 实现编辑帖子功能
  ElMessage.info('编辑功能待实现')
}

// 删除帖子
const deletePost = async (post: Post) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个帖子吗？',
      '删除帖子',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await postService.deletePost(post.id)
    posts.value = posts.value.filter(p => p.id !== post.id)
    ElMessage.success('帖子已删除')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除帖子失败:', error)
      ElMessage.error('删除帖子失败')
    }
  }
}

// 处理图片超出限制
const handleImageChange = (_file: UploadUserFile, fileList: UploadUserFile[]) => {
  postForm.value.images = fileList
}

const handleImageExceed = () => {
  ElMessage.warning('最多只能上传9张图片')
}

// 提交帖子
const submitPost = async () => {
  if (!postFormRef.value || !circle.value) return
  
  try {
    await postFormRef.value.validate()
    submitting.value = true

    const title = postForm.value.title.trim()
    const content = postForm.value.content.trim()
    if (!title) {
      ElMessage.error('标题不能为空')
      submitting.value = false
      return
    }
    if (!content) {
      ElMessage.error('内容不能为空')
      submitting.value = false
      return
    }

    const imageUrls: string[] = []
    for (const file of postForm.value.images) {
      if (file.url && !file.raw) {
        imageUrls.push(file.url)
      } else if (file.raw) {
        const uploadResult = await uploadService.uploadImage(file.raw as File, 'circle/posts')
        imageUrls.push(uploadResult.image.url)
        file.url = uploadResult.image.url
        file.status = 'success'
        Reflect.deleteProperty(file, 'raw')
      }
    }

    const response = await postService.createPost({
      title,
      content,
      images: imageUrls,
      circle_id: circle.value.id,
      is_anonymous: false
    })

    posts.value.unshift(response.post)
    totalPosts.value += 1

    ElMessage.success('发布成功')
    showPostDialog.value = false
    resetPostForm()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('发布帖子失败:', error)
      ElMessage.error(error?.response?.data?.message || error.message || '发布帖子失败')
    }
  } finally {
    submitting.value = false
  }
}

// 重置帖子表单
const resetPostForm = () => {
  postFormRef.value?.resetFields()
  postForm.value = {
    title: '',
    content: '',
    images: []
  }
}

// 获取角色标签类型
const getRoleTagType = (role: string) => {
  switch (role) {
    case 'creator':
      return 'danger'
    case 'admin':
      return 'warning'
    default:
      return 'info'
  }
}

// 获取角色文本
const getRoleText = (role: string) => {
  switch (role) {
    case 'creator':
      return '创建者'
    case 'admin':
      return '管理员'
    default:
      return '成员'
  }
}

</script>

<style scoped>
.circle-detail-page {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding-top: 60px;
}

.circle-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  overflow: visible;
  display: block;
}

.loading-container,
.error-container,
.no-access-container {
  padding: 60px 20px;
  text-align: center;
}

.circle-header {
  background-color: white;
  margin-bottom: 20px;
}

.cover-section {
  position: relative;
  height: 300px;
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
}

.cover-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
}

.header-content {
  padding: 20px;
}

.circle-info {
  max-width: 800px;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.title-section h1 {
  margin: 0;
  font-size: 32px;
  color: #303133;
}

.description {
  font-size: 16px;
  color: #606266;
  line-height: 1.6;
  margin: 0 0 20px 0;
}

.meta-info {
  display: flex;
  gap: 30px;
  margin-bottom: 20px;
}

.meta-info span {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #909399;
  font-size: 14px;
}

.rules-section {
  margin-top: 20px;
}

.rules-section h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #303133;
}

.rules-section pre {
  margin: 0;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  white-space: pre-wrap;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
}

.action-section {
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.creator-info {
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
  color: #606266;
}

.circle-content {
  padding: 0 20px 20px;
}

.post-actions {
  margin-bottom: 20px;
}

.members-list {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
}

.member-item-col {
  margin-bottom: 15px;
}

.member-card {
  height: 100%;
}

.member-info {
  display: flex;
  align-items: center;
}

.member-details {
  margin-left: 12px;
  flex: 1;
}

.member-details h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #303133;
}

.member-details p {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #909399;
}

.load-more {
  text-align: center;
  margin-top: 30px;
}

.sidebar-card {
  margin-bottom: 20px;
}

.stats-list {
  padding: 0;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  color: #606266;
}

.stat-value {
  font-weight: bold;
  color: #303133;
}

.admins-list {
  padding: 0;
}

.admin-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  cursor: pointer;
  transition: background-color 0.3s;
  border-radius: 4px;
}

.admin-item:hover {
  background-color: #f5f7fa;
}

.admin-item span {
  margin-left: 8px;
  font-size: 14px;
  color: #303133;
}

.no-permission {
  padding: 60px 20px;
  background-color: white;
  border-radius: 8px;
  text-align: center;
}

.image-error {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 50px;
}

/* 帖子列表样式 */
.posts-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-item {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
  cursor: pointer;
}

.post-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: 600;
  color: #000000;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.post-time {
  color: #999999;
  font-size: 12px;
  margin-top: 2px;
}

.username .clickable-username {
  cursor: pointer;
  color: var(--el-color-primary);
}

.username .clickable-username:hover {
  text-decoration: underline;
}

.clickable-avatar {
  cursor: pointer;
}

.post-actions {
  display: flex;
  gap: 8px;
}

.post-content {
  margin-bottom: 16px;
}

.post-title {
  font-size: 18px;
  font-weight: 600;
  color: #000000;
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.post-excerpt {
  color: #333333;
  line-height: 1.6;
  margin: 0;
  font-size: 14px;
}

.post-images {
  margin-bottom: 16px;
}

.post-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.post-image:hover {
  transform: scale(1.02);
}

.more-images {
  text-align: center;
  margin-top: 8px;
  color: #666;
  font-size: 12px;
}

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.post-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #666666;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.3s ease;
}

.stat-item:hover {
  color: #409EFF;
}

.load-more-posts {
  text-align: center;
  margin-top: 30px;
}
</style>
