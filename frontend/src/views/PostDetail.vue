<template>
  <div class="post-detail-page">
    <NavHeader />

    <div class="post-detail-container">
      <div class="page-header">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item to="/following">我的圈子</el-breadcrumb-item>
          <el-breadcrumb-item>帖子详情</el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <el-card v-loading="loading" class="post-card">
        <template #header>
          <div class="post-title-wrap">
            <h2 class="post-title">{{ post?.title || '帖子详情' }}</h2>
            <div class="meta">
              <span v-if="post?.circle" class="meta-item link" @click="goCircle(post!.circle!.id)">
                <el-icon><Collection /></el-icon>
                {{ post?.circle?.name }}
              </span>
              <span class="meta-item">
                <el-icon><Timer /></el-icon>
                {{ formatTime(post?.created_at) }}
              </span>
              <span v-if="post?.user && !post?.is_anonymous" class="meta-item link" @click="goUser(post!.user!.id)">
                <el-avatar :size="20" :src="post?.user?.avatar" style="margin-right:6px">
                  <el-icon><UserFilled /></el-icon>
                </el-avatar>
                {{ post?.user?.username }}
              </span>
              <span v-else class="meta-item">
                <el-icon><Lock /></el-icon>
                匿名
              </span>
            </div>
          </div>
        </template>

        <!-- 图片区域 -->
        <div v-if="post?.images && post.images.length" class="images-grid">
          <el-image
            v-for="(img, idx) in post.images"
            :key="idx"
            :src="img"
            fit="cover"
            :preview-src-list="post.images"
            :initial-index="idx"
            class="detail-image"
          >
            <template #error>
              <div class="image-fallback"><el-icon><Picture /></el-icon></div>
            </template>
          </el-image>
        </div>

        <!-- 正文内容 -->
        <div class="post-content" v-if="post">
          <p class="content-text">{{ post.content }}</p>
        </div>

        <!-- 动作区 -->
        <div class="actions">
          <el-button :loading="likeLoading" @click="toggleLike" plain>
            <el-icon><Goods /></el-icon>
            {{ liked ? '已赞' : '点赞' }} · {{ likeCount }}
          </el-button>
          <span class="action-stat">
            <el-icon><ChatDotRound /></el-icon>
            {{ post?.comment_count || 0 }} 评论
          </span>
          <span class="action-stat">
            <el-icon><View /></el-icon>
            {{ post?.view_count || 0 }} 浏览
          </span>
        </div>
      </el-card>

      <!-- 评论区 -->
      <el-card class="comments-card">
        <template #header>
          <div class="comments-header">
            <h3>评论</h3>
          </div>
        </template>

        <div class="comment-editor" v-if="isLoggedIn">
          <el-input
            v-model="newComment"
            type="textarea"
            :rows="3"
            placeholder="写下你的看法..."
          />
          <div class="editor-actions">
            <el-button type="primary" :loading="commentLoading" @click="submitComment">发布评论</el-button>
          </div>
        </div>
        <div v-else class="comment-login-hint">
          <el-button type="primary" @click="router.push('/login')">登录后参与讨论</el-button>
        </div>

        <el-empty v-if="!comments.length && !commentsLoading" description="暂无评论" />
        <el-skeleton v-if="commentsLoading" :rows="3" animated />

        <div class="comments-list" v-if="comments.length">
          <div v-for="c in comments" :key="c.id" class="comment-item">
            <el-avatar :size="32" :src="getAvatar(c)" class="comment-avatar">
              <el-icon><UserFilled /></el-icon>
            </el-avatar>
            <div class="comment-body">
              <div class="comment-meta">
                <span class="comment-username" @click="goUser(getUserId(c))">{{ getDisplayName(c) }}</span>
                <span class="comment-time">{{ formatTime(c.created_at) }}</span>
                <el-link type="primary" :underline="false" @click="startReply(c)">回复</el-link>
              </div>
              <div class="comment-content">{{ c.content }}</div>

              <!-- 操作区：点赞 / 删除 -->
              <div class="comment-actions">
                <el-button link :loading="commentLikeLoading[c.id]" @click="toggleCommentLike(c)">
                  <el-icon><Goods /></el-icon>
                  {{ c.is_liked ? '已赞' : '点赞' }} · {{ c.like_count || 0 }}
                </el-button>
                <el-popconfirm
                  v-if="canDelete(c)"
                  title="确认删除这条评论？"
                  confirm-button-text="删除"
                  cancel-button-text="取消"
                  @confirm="removeComment(c)"
                >
                  <template #reference>
                    <el-button link type="danger">删除</el-button>
                  </template>
                </el-popconfirm>
              </div>

              <!-- 子回复 -->
              <div v-if="c.replies && c.replies.length" class="reply-list">
                <div v-for="r in c.replies" :key="r.id" class="reply-item">
                  <el-avatar :size="24" :src="getAvatar(r)" class="reply-avatar">
                    <el-icon><UserFilled /></el-icon>
                  </el-avatar>
                  <div class="reply-body">
                    <div class="reply-meta">
                      <span class="reply-username" @click="goUser(getUserId(r))">{{ getDisplayName(r) }}</span>
                      <span class="reply-time">{{ formatTime(r.created_at) }}</span>
                      <el-link type="primary" :underline="false" @click="startReply(c, r)">回复</el-link>
                    </div>
                    <div class="reply-content">{{ r.content }}</div>

                    <div class="reply-actions">
                      <el-button link :loading="commentLikeLoading[r.id]" @click="toggleCommentLike(r)">
                        <el-icon><Goods /></el-icon>
                        {{ r.is_liked ? '已赞' : '点赞' }} · {{ r.like_count || 0 }}
                      </el-button>
                      <el-popconfirm
                        v-if="canDelete(r)"
                        title="确认删除这条回复？"
                        confirm-button-text="删除"
                        cancel-button-text="取消"
                        @confirm="removeComment(r)"
                      >
                        <template #reference>
                          <el-button link type="danger">删除</el-button>
                        </template>
                      </el-popconfirm>
                    </div>
                  </div>
                </div>
                <!-- 加载更多回复 -->
                <div class="more-replies" v-if="hasMoreReplies(c) || canCollapse(c)">
                  <el-button
                    v-if="hasMoreReplies(c)"
                    size="small"
                    text
                    :loading="isReplyLoading(c.id)"
                    @click="loadMoreReplies(c)"
                  >
                    查看更多回复
                  </el-button>
                  <el-button
                    v-if="canCollapse(c)"
                    size="small"
                    text
                    @click="collapseReplies(c)"
                  >
                    收起回复
                  </el-button>
                </div>
              </div>

              <!-- 回复框（顶级/子级共用） -->
              <div v-if="activeReplyId === c.id" class="reply-editor">
                <el-input
                  v-model="replyText"
                  type="textarea"
                  :rows="2"
                  placeholder="回复 @{{ replyTargetName }}..."
                />
                <div class="reply-actions">
                  <el-button size="small" @click="cancelReply">取消</el-button>
                  <el-button size="small" type="primary" :loading="replyLoading" @click="submitReply(c.id)">回复</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
  
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NavHeader from '@/components/NavHeader.vue'
import { postService, type Post } from '@/services/post'
import { commentService, type Comment } from '@/services/comment'
import { useUserStore } from '@/stores/user'
import { Picture, Goods, ChatDotRound, View, Collection, Timer, UserFilled, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const post = ref<Post | null>(null)
const likeLoading = ref(false)
const liked = ref(false)
const likeCount = ref(0)

const comments = ref<Comment[]>([])
const commentsLoading = ref(false)
const newComment = ref('')
const commentLoading = ref(false)
const activeReplyId = ref<number | null>(null)
const replyText = ref('')
const replyLoading = ref(false)
const replyTargetName = ref('')
const commentLikeLoading = ref<Record<number, boolean>>({})
const replyLoadingMap = ref<Record<number, boolean>>({})

// 每个顶级评论的回复分页状态
const replyState = ref<Record<number, { page: number; totalPages: number }>>({})
const replyPageSize = 5
const initialReplyPreviewCount = 3

const isLoggedIn = computed(() => userStore.isLoggedIn)

const formatTime = (iso?: string) => {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleString()
  } catch {
    return iso
  }
}

const fetchPost = async () => {
  try {
    loading.value = true
    const id = Number(route.params.id)
    const res = await postService.getPostById(id)
    post.value = res.post || (res as any).data?.post || (res as any)
    liked.value = !!post.value?.is_liked
    likeCount.value = post.value?.like_count || 0
  } catch (e) {
    ElMessage.error('获取帖子失败')
  } finally {
    loading.value = false
  }
}

const fetchComments = async () => {
  if (!post.value) return
  try {
    commentsLoading.value = true
    const res = await commentService.getComments(post.value.id, 1, 50)
    comments.value = res.comments || (res as any).data?.comments || []
  } catch (e) {
    comments.value = []
  } finally {
    commentsLoading.value = false
  }
}

const toggleLike = async () => {
  if (!post.value) return
  try {
    likeLoading.value = true
    const res = await postService.likePost(post.value.id)
    liked.value = res.liked
    likeCount.value = res.like_count
  } catch (e) {
    ElMessage.error('操作失败')
  } finally {
    likeLoading.value = false
  }
}

const submitComment = async () => {
  if (!post.value || !newComment.value.trim()) return
  try {
    commentLoading.value = true
    await commentService.createComment(post.value.id, { content: newComment.value.trim() })
    newComment.value = ''
    await fetchComments()
    ElMessage.success('评论已发布')
  } catch (e) {
    ElMessage.error('发布失败')
  } finally {
    commentLoading.value = false
  }
}

// 计算头像和用户名（兼容后端返回 author/user.profile）
const getAvatar = (c: any) => c?.author?.avatar || c?.user?.profile?.avatar || c?.user?.avatar || ''
const getDisplayName = (c: any) => c?.author?.nickname || c?.author?.username || c?.user?.profile?.nickname || c?.user?.username || '用户'
const getUserId = (c: any) => c?.author?.id || c?.user?.id

const startReply = (root: any, target?: any) => {
  activeReplyId.value = root.id
  replyTargetName.value = target ? getDisplayName(target) : getDisplayName(root)
  replyText.value = ''
}

const cancelReply = () => {
  activeReplyId.value = null
  replyText.value = ''
  replyTargetName.value = ''
}

const submitReply = async (rootCommentId: number) => {
  if (!post.value || !replyText.value.trim()) return
  try {
    replyLoading.value = true
    await commentService.createComment(post.value.id, { content: replyText.value.trim(), parentId: rootCommentId })
    cancelReply()
    await fetchComments()
    ElMessage.success('回复已发布')
  } catch (e) {
    ElMessage.error('发布失败')
  } finally {
    replyLoading.value = false
  }
}

// 评论点赞/取消点赞
const toggleCommentLike = async (c: any) => {
  try {
    commentLikeLoading.value[c.id] = true
    const res = await commentService.likeComment(0, c.id)
    c.is_liked = res.liked
    if (typeof res.like_count === 'number') {
      c.like_count = res.like_count
    } else {
      c.like_count = (c.like_count || 0) + (c.is_liked ? 1 : -1)
    }
  } catch (e) {
    ElMessage.error('操作失败')
  } finally {
    commentLikeLoading.value[c.id] = false
  }
}

// 删除评论/回复
const removeComment = async (c: any) => {
  try {
    await commentService.deleteComment(0, c.id)
    await fetchComments()
    ElMessage.success('删除成功')
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

// 权限：本人或管理员可删除
const canDelete = (c: any) => {
  const current = userStore.user
  if (!current) return false
  const isOwner = c.user_id && current.id === c.user_id
  const isAdmin = current.role === 'admin'
  return isOwner || isAdmin
}

// 更多回复分页逻辑
const hasMoreReplies = (c: any) => {
  const state = replyState.value[c.id]
  if (state) return state.page < state.totalPages
  return (c.replies?.length || 0) >= initialReplyPreviewCount // 首屏后端限制3条，默认显示入口
}

const isReplyLoading = (id: number) => !!replyLoadingMap.value[id]

const loadMoreReplies = async (c: any) => {
  if (!post.value) return
  const state = replyState.value[c.id] || { page: 0, totalPages: 9999 }
  const nextPage = state.page === 0 ? 1 : state.page + 1
  try {
    replyLoadingMap.value[c.id] = true
    const res: any = await commentService.getComments(post.value.id, nextPage, replyPageSize, c.id)
    const list = res.comments || res.data?.comments || []
    const pagination = res.pagination || res.data?.pagination || { page: nextPage, totalPages: nextPage }
    // 合并去重
    const existing = new Set((c.replies || []).map((r: any) => r.id))
    const merged = [...(c.replies || []), ...list.filter((r: any) => !existing.has(r.id))]
    c.replies = merged
    replyState.value[c.id] = { page: pagination.page, totalPages: pagination.totalPages || pagination.total || pagination.page }
  } catch (e) {
    ElMessage.error('加载回复失败')
  } finally {
    delete replyLoadingMap.value[c.id]
  }
}

// 收起回复（回到首屏预览数量）
const canCollapse = (c: any) => (c.replies?.length || 0) > initialReplyPreviewCount
const collapseReplies = (c: any) => {
  if (Array.isArray(c.replies)) {
    c.replies = c.replies.slice(0, initialReplyPreviewCount)
  }
  // 保留分页状态以便 hasMoreReplies 正确判断是否还有更多
}

const goCircle = (id: number) => router.push(`/circles/${id}`)
const goUser = (id?: number) => { if (id) router.push(`/profile/${id}`) }

onMounted(async () => {
  userStore.initUser()
  await fetchPost()
  await fetchComments()
})
</script>

<style scoped>
.post-detail-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding-top: 60px;
}

.post-detail-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 16px;
}

.page-header {
  margin-bottom: 12px;
}

.post-card {
  margin-bottom: 16px;
}

.post-title-wrap {
  display: flex;
  flex-direction: column;
}

.post-title {
  margin: 0 0 6px 0;
  font-size: 22px;
  color: #303133;
}

.meta {
  display: flex;
  gap: 12px;
  align-items: center;
  color: #909399;
  font-size: 13px;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.meta-item.link {
  cursor: pointer;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.detail-image {
  width: 100%;
  aspect-ratio: 1;
}

.image-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #f0f2f5;
  color: #bbb;
}

.post-content {
  padding: 8px 0 0;
}

.content-text {
  white-space: pre-wrap;
  line-height: 1.7;
  color: #303133;
}

.actions {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-top: 8px;
}

.action-stat {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #909399;
  font-size: 13px;
}

.comments-card {
  margin-bottom: 24px;
}

.comment-editor {
  margin-bottom: 12px;
}

.editor-actions {
  margin-top: 8px;
  text-align: right;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-item {
  display: flex;
  gap: 10px;
}

.comment-avatar {
  flex: 0 0 auto;
}

.comment-body {
  background: #fff;
  border-radius: 8px;
  padding: 8px 12px;
  flex: 1;
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #909399;
  font-size: 12px;
  margin-bottom: 6px;
}

.comment-username {
  color: #303133;
  cursor: pointer;
}

.comment-content {
  color: #303133;
  line-height: 1.6;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

.reply-list {
  margin-top: 8px;
  padding-left: 8px;
  border-left: 2px solid #ebeef5;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reply-item {
  display: flex;
  gap: 8px;
}

.reply-avatar {
  flex: 0 0 auto;
}

.reply-body {
  background: #fafafa;
  border-radius: 6px;
  padding: 6px 10px;
  flex: 1;
}

.reply-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #909399;
  font-size: 12px;
  margin-bottom: 4px;
}

.reply-username {
  color: #303133;
  cursor: pointer;
}

.reply-content {
  color: #303133;
}

.reply-editor {
  margin-top: 8px;
}

.reply-actions {
  margin-top: 6px;
  text-align: right;
}

.more-replies {
  margin-top: 6px;
}

@media (max-width: 768px) {
  .post-detail-container {
    padding: 12px;
  }
  .images-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
