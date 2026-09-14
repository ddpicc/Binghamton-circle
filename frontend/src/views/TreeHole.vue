<template>
  <div class="square">
    <NavHeader />
    <div class="square-container">
      <div class="square-header">
        <h2>校园树洞</h2>
        <p>分享你的心声，完全匿名</p>
      </div>
      
      <div class="post-form">
        <el-card>
          <div class="post-form-header">
            <el-avatar :size="40" src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png">
              匿
            </el-avatar>
            <div style="flex: 1;">
              <el-input
                v-model="postContent"
                type="textarea"
                :rows="3"
                placeholder="分享一些新鲜事..."
                resize="none"
              />
            </div>
          </div>
          
          <!-- 图片预览区域 -->
          <div v-if="selectedImages.length > 0" class="image-preview-container">
            <div class="image-preview-grid">
              <div v-for="(image, index) in selectedImages" :key="index" class="image-preview-item">
                <el-image 
                  :src="getImageUrl(image)" 
                  fit="cover"
                  :preview-src-list="selectedImages.map(img => getImageUrl(img))"
                  :initial-index="index"
                />
                <el-button 
                  type="danger" 
                  circle 
                  size="small" 
                  icon="Close"
                  class="remove-image-btn"
                  @click="removeImage(index)"
                />
              </div>
            </div>
            <div class="image-count">
              已选择 {{ selectedImages.length }} 张图片
            </div>
          </div>
          
          <div class="post-form-actions">
            <div class="post-options">
              <span class="anonymous-hint">🔒 所有发布均为匿名</span>
              <el-upload
                action="/api/upload"
                multiple
                :show-file-list="false"
                :before-upload="beforeUpload"
              >
                <el-button icon="Picture">图片</el-button>
              </el-upload>
            </div>
            <el-button type="primary" @click="publishPost" :loading="publishing">
              发布到树洞
            </el-button>
          </div>
        </el-card>
      </div>
      
      <div class="posts-list">
        <div v-if="loading" class="loading">
          <el-skeleton :rows="3" animated />
        </div>
        
        <div v-else-if="posts.length === 0" class="empty">
          <el-empty description="暂无帖子，快来发布第一条吧！" />
        </div>
        
        <div v-else>
          <div v-for="post in posts" :key="post.id" class="post-item">
            <el-card>
              <div class="post-header">
                <div class="post-author">
                  <el-avatar :size="40" src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png">
                    匿
                  </el-avatar>
                  <div class="post-author-info">
                    <span class="post-author-name">{{ isMyPost(post) ? '我' : '匿名用户' }}</span>
                    <div class="post-meta">
                      <span class="post-time">{{ formatDate(post.created_at) }}</span>
                      <span class="post-circle">
                        <el-icon><Lock /></el-icon>
                        树洞
                      </span>
                    </div>
                  </div>
                </div>
                <el-dropdown v-if="userStore.isAdmin">
                  <el-button icon="MoreFilled" circle />
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="deletePost(post)">删除</el-dropdown-item>
                      <el-dropdown-item>举报</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
              
              <div class="post-content">
                <p>{{ post.content }}</p>
                <div v-if="post.images && post.images.length > 0" class="post-images">
                  <div
                    v-for="(image, index) in post.images"
                    :key="`${post.id}-${index}`"
                    class="post-image-wrapper"
                    @click="openImageViewer(post.images, index)"
                  >
                    <el-image
                      :src="image"
                      fit="cover"
                      class="post-image"
                    />
                    <div class="post-image-overlay">
                      <el-icon>
                        <ZoomIn />
                      </el-icon>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="post-actions">
                <div class="post-action" @click="toggleLike(post)">
                  <el-icon :class="{ 'liked': post.is_liked }">
                    <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                      <path fill="currentColor" d="M923 283.6c-13.4-31.1-32.6-58.9-56.9-82.8-24.3-23.8-52.5-42.4-84-55.5-32.5-13.5-66.9-20.3-102.4-20.3-49.3 0-97.4 13.5-139.2 39-10 6.1-19.5 12.8-28.5 20.1-9-7.3-18.5-14-28.5-20.1-41.8-25.5-89.9-39-139.2-39-35.5 0-69.9 6.8-102.4 20.3-31.4 13-59.7 31.7-84 55.5-24.4 23.9-43.5 51.7-56.9 82.8-13.9 32.3-21 66.6-21 101.9 0 33.3 6.8 68 20.3 103.3 11.3 29.5 27.5 60.1 48.2 91 32.8 48.9 77.9 99.9 133.9 151.6 92.8 85.7 184.7 144.9 188.6 147.3l23.7 15.2c10.5 6.7 24 6.7 34.5 0l23.7-15.2c3.9-2.5 95.7-61.6 188.6-147.3 56-51.7 101.1-102.7 133.9-151.6 20.7-30.9 37-61.5 48.2-91 13.5-35.3 20.3-70 20.3-103.3 0.1-35.3-7-69.6-20.9-101.9z"/>
                    </svg>
                  </el-icon>
                  <span>{{ post.like_count }}</span>
                </div>
                <div class="post-action" @click="toggleComments(post)">
                  <el-icon>
                    <ChatDotRound />
                  </el-icon>
                  <span>{{ post.comment_count }}</span>
                </div>
                <div class="post-action">
                  <el-icon>
                    <Share />
                  </el-icon>
                  <span>分享</span>
                </div>
              </div>
              
              <div v-if="post.showComments" class="post-comments">
                <div class="comment-form">
                  <el-input
                    v-model="commentContent"
                    placeholder="写下你的评论..."
                    @keyup.enter="submitComment(post)"
                  >
                    <template #append>
                      <el-button @click="submitComment(post)">发送</el-button>
                    </template>
                  </el-input>
                </div>
                
                <div v-if="treeHoleStore.getCommentsByPostId(post.id).length > 0" class="comment-list">
                  <div v-for="comment in treeHoleStore.getCommentsByPostId(post.id)" :key="comment.id" class="comment-item">
                    <div class="comment-author">
                      <el-avatar :size="24" src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png">
                        匿
                      </el-avatar>
                      <span class="comment-author-name">匿名用户</span>
                      <span class="comment-time">{{ formatDate(comment.created_at) }}</span>
                    </div>
                    <div class="comment-content">
                      <p>{{ comment.content }}</p>
                      <div class="comment-actions">
                        <span class="reply-btn" @click="showReplyInput(comment)">回复</span>
                      </div>
                    </div>
                    <!-- 回复输入框 -->
                    <div v-if="replyingTo?.id === comment.id" class="reply-input-container">
                      <el-input
                        v-model="replyContent"
                        placeholder="写下你的回复..."
                        size="small"
                        @keyup.enter="submitReply(post, comment)"
                      />
                      <div class="reply-actions-below">
                        <el-button size="small" type="primary" @click="submitReply(post, comment)">发送</el-button>
                        <el-button size="small" @click="replyingTo = null">取消</el-button>
                      </div>
                    </div>
                    
                    <div v-if="comment.replies && comment.replies.length > 0" class="comment-replies">
                      <div v-for="reply in comment.replies" :key="reply.id" class="comment-item reply">
                        <div class="comment-author">
                          <el-avatar :size="20" src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png">
                            匿
                          </el-avatar>
                          <span class="comment-author-name">匿名用户</span>
                          <span class="comment-time">{{ formatDate(reply.created_at) }}</span>
                        </div>
                        <div class="comment-content">
                          <p>{{ reply.content }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </el-card>
          </div>
        </div>
      </div>
    </div>
    
    <el-image-viewer
      v-if="imageViewerVisible"
      :url-list="imageViewerImages"
      :initial-index="imageViewerIndex"
      @close="closeImageViewer"
      @switch="handleViewerSwitch"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ChatDotRound, Share, MoreFilled, Lock, ZoomIn } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useTreeHoleStore } from '@/stores/treeHole'
import { treeHoleApi, uploadService } from '@/services'
import { formatDate } from '@/utils'
import type { TreeHolePost, TreeHoleComment, TreeHolePostCreateData } from '@/types'
import NavHeader from '@/components/NavHeader.vue'

const router = useRouter()
const userStore = useUserStore()
const treeHoleStore = useTreeHoleStore()

const postContent = ref('')
const publishing = ref(false)
const commentContent = ref('')
const replyContent = ref('')
const replyingTo = ref<any>(null)
const selectedImages = ref<File[]>([])
const imageViewerVisible = ref(false)
const imageViewerImages = ref<string[]>([])
const imageViewerIndex = ref(0)

const isLoggedIn = computed(() => userStore.isLoggedIn)
const loading = computed(() => treeHoleStore.loading)
const posts = computed(() => treeHoleStore.posts)

// 判断是否为当前用户发布的帖子
const isMyPost = (post: any) => {
  const currentId = userStore.user?.id
  if (!currentId || !post) return false
  return (
    post.user_id === currentId ||
    post?.author?.id === currentId ||
    post?.is_mine === true ||
    post?.isMine === true ||
    post?.mine === true
  )
}


// 获取图片预览URL
const getImageUrl = (file: File) => {
  return URL.createObjectURL(file)
}

// 移除图片
const removeImage = (index: number) => {
  selectedImages.value.splice(index, 1)
  ElMessage.success('图片已移除')
}

const openImageViewer = (images: string[] = [], index = 0) => {
  const normalizedImages = (images || []).filter((img): img is string => Boolean(img))
  if (!normalizedImages.length) return

  const safeIndex = Math.min(Math.max(index, 0), normalizedImages.length - 1)
  imageViewerImages.value = normalizedImages
  imageViewerIndex.value = safeIndex
  imageViewerVisible.value = true
}

const closeImageViewer = () => {
  imageViewerVisible.value = false
}

const handleViewerSwitch = (index: number) => {
  imageViewerIndex.value = index
}

const beforeUpload = (file: File) => {
  // 验证文件类型
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  
  // 验证文件大小（10MB）
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过 10MB')
    return false
  }
  
  selectedImages.value.push(file)
  ElMessage.success('图片已选择')
  return false
}

const publishPost = async () => {
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  if (!postContent.value.trim()) {
    ElMessage.warning('请输入帖子内容')
    return
  }
  
  publishing.value = true
  
  try {
    let imageUrls: string[] = []
    
    // 上传图片
    if (selectedImages.value.length > 0) {
      for (const file of selectedImages.value) {
        const response = await uploadService.uploadImage(file)
        imageUrls.push(response.image.url)
      }
    }
    
    const payload: TreeHolePostCreateData = {
      content: postContent.value.trim(),
      images: imageUrls
    }

    // 创建树洞帖子
    await treeHoleStore.createPost(payload)

    postContent.value = ''
    selectedImages.value = []
    ElMessage.success('发布成功')
    
  } catch (error: any) {
    console.error('发布失败:', error)
    ElMessage.error(error || '发布失败')
  } finally {
    publishing.value = false
  }
}

const toggleLike = async (post: any) => {
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录')
    return
  }
  
  try {
    await treeHoleStore.likePost(post.id)
  } catch (error: any) {
    console.error('点赞失败:', error)
    ElMessage.error(error || '点赞失败')
  }
}

const toggleComments = async (post: any) => {
  post.showComments = !post.showComments
  if (post.showComments) {
    await loadCommentsForPost(post)
  }
}

const submitComment = async (post: any) => {
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录')
    return
  }
  
  if (!commentContent.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }
  
  try {
    await treeHoleStore.createComment(post.id, {
      content: commentContent.value
    })
    
    // 更新本地评论数
    post.comment_count++
    commentContent.value = ''
    ElMessage.success('评论成功')
    
  } catch (error: any) {
    console.error('评论失败:', error)
    ElMessage.error(error || '评论失败')
  }
}

const showReplyInput = (comment: any) => {
  replyingTo.value = comment
  replyContent.value = ''
}

const submitReply = async (post: any, parentComment: any) => {
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录')
    return
  }
  
  if (!replyContent.value.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }
  
  try {
    await treeHoleStore.createComment(post.id, {
      content: replyContent.value,
      parent_id: parentComment.id
    })
    
    // 更新本地评论数
    post.comment_count++
    replyContent.value = ''
    replyingTo.value = null
    ElMessage.success('回复成功')
    
  } catch (error: any) {
    console.error('回复失败:', error)
    ElMessage.error(error || '回复失败')
  }
}

const deletePost = async (post: any) => {
  try {
    await ElMessageBox.confirm('确定要删除这条帖子吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await treeHoleStore.deletePost(post.id)
    ElMessage.success('删除成功')
    
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error(error || '删除失败')
    }
  }
}


onMounted(async () => {
  // 初始化用户状态
  userStore.initUser()
  
  // 加载树洞帖子列表
  try {
    await treeHoleStore.fetchPosts()
  } catch (error: any) {
    console.error('加载失败:', error)
    ElMessage.error('加载失败')
  }
})

onUnmounted(() => {
  // 清理所有创建的 Object URL
  selectedImages.value.forEach(image => {
    const url = getImageUrl(image)
    URL.revokeObjectURL(url)
  })
  closeImageViewer()
  imageViewerImages.value = []
})

// 监听帖子显示评论状态，加载对应评论
const loadCommentsForPost = async (post: any) => {
  if (post.showComments) {
    try {
      await treeHoleStore.fetchComments(post.id)
    } catch (error: any) {
      console.error('加载评论失败:', error)
      ElMessage.error('加载评论失败')
    }
  }
}
</script>

<style scoped>
.square {
  min-height: 100vh;
  background: var(--background-light);
  padding-top: 80px;
}

.square-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.square-header {
  text-align: center;
  margin-bottom: 30px;
  animation: fadeIn 0.6s ease-out;
}

.square-header h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 700;
}

.square-header p {
  margin: 8px 0 0 0;
  color: var(--text-secondary);
  font-size: clamp(0.875rem, 2vw, 1rem);
}

.post-form {
  margin-bottom: 30px;
  animation: slideUp 0.5s ease-out;
}

.post-form-header {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.image-preview-container {
  margin-top: 15px;
  padding: 10px;
  background: var(--bg-color);
  border-radius: var(--border-radius-base);
  border: 1px dashed var(--border-color);
}

.image-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
  margin-bottom: 10px;
}

.image-preview-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--border-radius-base);
  overflow: hidden;
}

.image-preview-item .el-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  z-index: 2;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.remove-image-btn:hover {
  opacity: 1;
}

.image-count {
  font-size: 0.85rem;
  color: var(--text-secondary);
  text-align: center;
}

.anonymous-hint {
  color: var(--text-secondary);
  font-size: 0.875rem;
  background: var(--primary-light);
  padding: 4px 8px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.post-form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.post-options {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.posts-list {
  min-height: 400px;
}

.loading {
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.empty {
  padding: 60px 0;
  text-align: center;
}

.post-item {
  margin-bottom: 20px;
  animation: fadeIn 0.4s ease-out;
  transition: all var(--transition-base);
}

.post-item:hover {
  transform: translateY(-2px);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.post-author {
  display: flex;
  align-items: center;
  gap: 10px;
}

.post-author-info {
  display: flex;
  flex-direction: column;
}

.post-author-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 2px;
}

.post-time {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.post-circle {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 0.75rem;
  color: var(--primary-color);
  background-color: var(--primary-light);
  padding: 2px 6px;
  border-radius: 12px;
}

.post-content {
  margin-bottom: 15px;
}

.post-content p {
  margin: 0;
  line-height: 1.6;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.post-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
  margin-top: 10px;
}

.post-image-wrapper {
  position: relative;
  border-radius: var(--border-radius-base);
  overflow: hidden;
  cursor: zoom-in;
}

.post-image-wrapper .post-image {
  width: 100%;
  height: 100%;
  transition: transform var(--transition-fast);
}

.post-image-wrapper:hover .post-image {
  transform: scale(1.05);
  box-shadow: var(--shadow-base);
}

.post-image-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
  color: #fff;
  font-size: 1.5rem;
  opacity: 0;
  transition: opacity var(--transition-fast);
  pointer-events: none;
}

.post-image-wrapper:hover .post-image-overlay {
  opacity: 1;
}

.post-image {
  width: 100%;
  height: 120px;
  border-radius: var(--border-radius-base);
  object-fit: cover;
  transition: all var(--transition-fast);
}

.post-image:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-base);
}

.post-actions {
  display: flex;
  gap: 20px;
  padding-top: 15px;
  border-top: 1px solid var(--border-light);
  flex-wrap: wrap;
}

.post-action {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
  padding: 5px 10px;
  border-radius: var(--border-radius-small);
}

.post-action:hover {
  color: var(--primary-color);
  background-color: rgba(64, 158, 255, 0.1);
}

.post-action.liked {
  color: var(--danger-color);
}

.post-comments {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid var(--border-light);
  animation: slideUp 0.3s ease-out;
  /* Add left indent and a subtle divider to distinguish from post content */
  padding-left: 12px;
  border-left: 3px solid var(--border-light);
}

.comment-form {
  margin-bottom: 15px;
}

.comment-list {
  max-height: 300px;
  overflow-y: auto;
  padding-right: 5px;
  padding-left: 6px; /* slight extra indent for comments */
}

.comment-list::-webkit-scrollbar {
  width: 4px;
}

.comment-list::-webkit-scrollbar-track {
  background: var(--background-light);
}

.comment-list::-webkit-scrollbar-thumb {
  background: var(--border-base);
  border-radius: 2px;
}

.comment-item {
  margin-bottom: 12px;
  padding: 10px;
  background: var(--bg-color);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-small);
  transition: all var(--transition-fast);
}

.comment-item:hover {
  background-color: rgba(64, 158, 255, 0.03);
}

.comment-item:last-child {
  margin-bottom: 0;
}

.comment-author {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.comment-author-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.875rem;
}

.comment-time {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.comment-content p {
  margin: 0;
  color: var(--text-regular);
  font-size: 0.875rem;
  line-height: 1.5;
}

.comment-actions {
  margin-top: 8px;
}

.reply-btn {
  color: var(--text-secondary);
  font-size: 0.75rem;
  cursor: pointer;
  transition: color var(--transition-fast);
}

.reply-btn:hover {
  color: var(--primary-color);
}

.reply-input-container {
  margin-top: 10px;
  padding: 8px;
  background: var(--bg-color);
  border-radius: var(--border-radius-small);
  border: 1px solid var(--border-light);
}

/* Ensure append buttons don’t overlap */
.reply-input-container :deep(.el-input-group__append) {
  padding: 0 6px;
}

.reply-actions-below {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

.reply-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.comment-replies {
  margin-top: 12px;
  padding-left: 24px; /* deeper indent for nested replies */
  border-left: 3px solid var(--border-light);
}

.comment-item.reply {
  margin-bottom: 10px;
  padding: 8px;
  background: var(--background-light);
  border-radius: var(--border-radius-small);
}

.comment-item.reply .comment-author {
  margin-bottom: 4px;
}

.comment-item.reply .comment-author-name {
  font-size: 0.8rem;
}

.comment-item.reply .comment-time {
  font-size: 0.7rem;
}

.comment-item.reply .comment-content p {
  font-size: 0.8rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .square {
    padding: 15px;
  }
  
  .square-container {
    max-width: 100%;
  }
  
  .square-header {
    margin-bottom: 20px;
  }
  
  .square-header h2 {
    font-size: 1.75rem;
  }
  
  .post-form {
    margin-bottom: 20px;
  }
  
  .post-form-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .post-form-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  
  .post-options {
    justify-content: center;
  }
  
  .post-images {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 6px;
  }
  
  .post-image {
    height: 100px;
  }
  
  .post-actions {
    gap: 15px;
    justify-content: space-around;
  }
  
  .post-action {
    padding: 8px 12px;
    font-size: 0.875rem;
  }
  
  .comment-author {
    flex-wrap: wrap;
  }
  
  .comment-list {
    max-height: 250px;
  }
}

@media (max-width: 480px) {
  .square {
    padding: 10px;
  }
  
  .square-header h2 {
    font-size: 1.5rem;
  }
  
  .square-header p {
    font-size: 0.875rem;
  }
  
  .post-form-header {
    align-items: center;
  }
  
  .post-images {
    grid-template-columns: repeat(2, 1fr);
    gap: 4px;
  }
  
  .post-image {
    height: 80px;
  }
  
  .post-actions {
    gap: 10px;
  }
  
  .post-action {
    padding: 6px 8px;
    font-size: 0.75rem;
  }
  
  .comment-author {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .comment-author-name {
    font-size: 0.8rem;
  }
  
  .comment-time {
    font-size: 0.7rem;
  }
  
  .comment-content p {
    font-size: 0.8rem;
  }
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 图片上传区域增强 */
.image-upload-area {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.selected-image {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: var(--border-radius-base);
  overflow: hidden;
  border: 2px solid var(--primary-color);
}

.selected-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.selected-image .remove-image {
  position: absolute;
  top: 2px;
  right: 2px;
  background: var(--danger-color);
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all var(--transition-fast);
}

.selected-image .remove-image:hover {
  background: #f78989;
  transform: scale(1.1);
}

/* 加载状态增强 */
.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--text-secondary);
}

.loading-spinner .el-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
