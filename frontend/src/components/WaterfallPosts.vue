<template>
  <div class="waterfall-container" :class="{ 'no-padding': props.noPadding }">
    <div class="waterfall-grid" ref="waterfallGrid">
      <div 
        v-for="(post, index) in posts" 
        :key="post.id"
        class="post-card"
        :class="{ 'skeleton': isLoading && index >= posts.length - skeletonCount }"
        :style="{ '--delay': `${index * 0.1}s` }"
        @click="viewPost(post)"
      >
        <!-- 帖子图片 -->
        <div class="post-image-container">
          <el-image
            :src="post.images?.[0] || '/default-post-image.jpg'"
            fit="cover"
            class="post-image"
            :preview-src-list="post.images || []"
            :initial-index="0"
            loading="lazy"
          >
            <template #placeholder>
              <div class="image-placeholder">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
            <template #error>
              <div class="image-error">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
          
          <!-- 图片数量指示器 -->
          <div v-if="post.images && post.images.length > 1" class="image-count">
            <el-icon><Picture /></el-icon>
            {{ post.images.length }}
          </div>
          
          <!-- 圈子标签 -->
          <div v-if="post.circle" class="circle-tag">
            {{ post.circle.name }}
          </div>
        </div>
        
        <!-- 帖子内容 -->
        <div class="post-content">
          <h3 class="post-title" :title="post.title">{{ post.title }}</h3>
          <p class="post-excerpt" :title="post.content">{{ getExcerpt(post.content) }}</p>
          
          <!-- 用户信息 -->
          <div class="user-info">
            <el-avatar
              :size="24"
              :src="post.user?.avatar"
              @click.stop="viewUser(post.user?.id)"
            >
              <el-icon><UserFilled /></el-icon>
            </el-avatar>
            <span class="username" @click.stop="viewUser(post.user?.id)">
              {{ post.user?.username }}
            </span>
            <span v-if="post.is_anonymous" class="anonymous-tag">
              <el-icon><Lock /></el-icon>
              匿名
            </span>
          </div>
          
          <!-- 互动信息 -->
          <div class="post-stats">
            <span class="stat-item like-btn" @click.stop="toggleLike(post)">
              <el-icon :class="{ 'liked': post.is_liked }">
                <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                  <path fill="currentColor" d="M923 283.6c-13.4-31.1-32.6-58.9-56.9-82.8-24.3-23.8-52.5-42.4-84-55.5-32.5-13.5-66.9-20.3-102.4-20.3-49.3 0-97.4 13.5-139.2 39-10 6.1-19.5 12.8-28.5 20.1-9-7.3-18.5-14-28.5-20.1-41.8-25.5-89.9-39-139.2-39-35.5 0-69.9 6.8-102.4 20.3-31.4 13-59.7 31.7-84 55.5-24.4 23.9-43.5 51.7-56.9 82.8-13.9 32.3-21 66.6-21 101.9 0 33.3 6.8 68 20.3 103.3 11.3 29.5 27.5 60.1 48.2 91 32.8 48.9 77.9 99.9 133.9 151.6 92.8 85.7 184.7 144.9 188.6 147.3l23.7 15.2c10.5 6.7 24 6.7 34.5 0l23.7-15.2c3.9-2.5 95.7-61.6 188.6-147.3 56-51.7 101.1-102.7 133.9-151.6 20.7-30.9 37-61.5 48.2-91 13.5-35.3 20.3-70 20.3-103.3 0.1-35.3-7-69.6-20.9-101.9z"/>
                </svg>
              </el-icon>
              {{ post.like_count || 0 }}
            </span>
            <span class="stat-item">
              <el-icon><ChatDotRound /></el-icon>
              {{ post.comment_count || 0 }}
            </span>
            </div>
        </div>
      </div>
    </div>
    
    <!-- 加载更多指示器 -->
    <div v-if="hasMore && !isLoading" class="load-more-trigger" ref="loadMoreTrigger">
      <div class="loading-indicator">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <span>加载更多...</span>
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="isLoading && posts.length === 0" class="loading-container">
      <div v-for="i in 6" :key="i" class="post-card skeleton">
        <div class="post-image-container">
          <el-skeleton-item variant="image" class="skeleton-image" />
        </div>
        <div class="post-content">
          <el-skeleton-item variant="h3" class="skeleton-title" />
          <el-skeleton-item variant="text" class="skeleton-text" />
          <el-skeleton-item variant="text" class="skeleton-text" style="width: 60%" />
        </div>
      </div>
    </div>
    
    <!-- 空状态 -->
    <div v-if="!isLoading && posts.length === 0" class="empty-state">
      <el-empty :description="emptyDescription">
        <el-button type="primary" @click="$emit('refresh')">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button v-if="showJoinCircleButton" @click="$emit('join-circle')">
          <el-icon><Plus /></el-icon>
          加入圈子
        </el-button>
      </el-empty>
    </div>
    
    <!-- 无更多数据 -->
    <div v-if="!hasMore && posts.length > 0" class="no-more">
      <span>没有更多帖子了</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  Picture,
  UserFilled,
  Lock,
  ChatDotRound,
  Loading,
  Refresh,
  Plus
} from '@element-plus/icons-vue'
import type { Post } from '@/services'

interface Props {
  posts: Post[]
  isLoading?: boolean
  hasMore?: boolean
  skeletonCount?: number
  emptyDescription?: string
  showJoinCircleButton?: boolean
  noPadding?: boolean
}

interface Emits {
  (e: 'load-more'): void
  (e: 'refresh'): void
  (e: 'view-post', post: Post): void
  (e: 'view-user', userId: number): void
  (e: 'join-circle'): void
  (e: 'toggle-like', post: Post): void
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  hasMore: false,
  skeletonCount: 3,
  emptyDescription: '暂无帖子',
  showJoinCircleButton: false,
  noPadding: false
})

const emit = defineEmits<Emits>()

const router = useRouter()
const waterfallGrid = ref<HTMLElement>()
const loadMoreTrigger = ref<HTMLElement>()
const observer = ref<IntersectionObserver>()

// 获取文本摘要
const getExcerpt = (text: string, length: number = 80) => {
  if (!text) return ''
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

// 查看帖子
const viewPost = (post: Post) => {
  emit('view-post', post)
}

// 查看用户
const viewUser = (userId: number) => {
  emit('view-user', userId)
}

// 点赞功能
const toggleLike = (post: Post) => {
  emit('toggle-like', post)
}

// 设置无限滚动
const setupInfiniteScroll = () => {
  if (!loadMoreTrigger.value) return

  observer.value = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && props.hasMore && !props.isLoading) {
          emit('load-more')
        }
      })
    },
    {
      rootMargin: '100px',
      threshold: 0.1
    }
  )

  observer.value.observe(loadMoreTrigger.value)
}

// 优化瀑布流布局
const optimizeLayout = () => {
  if (!waterfallGrid.value) return
  
  const cards = waterfallGrid.value.querySelectorAll('.post-card:not(.skeleton)')
  if (cards.length === 0) return
  
  // 使用CSS columns实现瀑布流，这里可以添加额外的优化逻辑
  nextTick(() => {
    cards.forEach((card, index) => {
      card.style.opacity = '1'
      card.style.transform = 'translateY(0)'
    })
  })
}

onMounted(() => {
  setupInfiniteScroll()
  optimizeLayout()
})

onUnmounted(() => {
  if (observer.value) {
    observer.value.disconnect()
  }
})

// 监听帖子变化，重新优化布局
watch(() => props.posts, () => {
  nextTick(() => {
    optimizeLayout()
  })
}, { deep: true })
</script>

<style scoped>
.waterfall-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
}

.waterfall-container.no-padding {
  padding-left: 0;
  padding-right: 0;
}

.waterfall-grid {
  column-count: 3;
  column-gap: 12px;
  
  @media (max-width: 768px) {
    column-count: 1;
  }
  
  @media (min-width: 769px) and (max-width: 1024px) {
    column-count: 2;
  }
  
  @media (min-width: 1025px) {
    column-count: 3;
  }
}

.post-card {
  break-inside: avoid;
  margin-bottom: 12px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInUp 0.5s ease forwards;
  animation-delay: var(--delay, 0s);
}

.post-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.post-card.skeleton {
  pointer-events: none;
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.post-image-container {
  position: relative;
  width: 100%;
  aspect-ratio: 0.9;
  overflow: hidden;
  background: #f5f5f5;
}

.post-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.post-card:hover .post-image {
  transform: scale(1.05);
}

.image-placeholder,
.image-error {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  color: #999;
  font-size: 24px;
}

.image-count {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 1;
}

.circle-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  z-index: 1;
  backdrop-filter: blur(10px);
}

.post-content {
  padding: 10px;
  background: white;
}

.post-title {
  margin: 0 0 6px 0;
  font-size: 13px;
  font-weight: 600;
  color: #000000;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-excerpt {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #333333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.username {
  font-size: 12px;
  color: #000000;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.3s ease;
}

.username:hover {
  color: #409EFF;
}

.anonymous-tag {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  color: #999;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 8px;
}

.post-stats {
  display: flex;
  gap: 12px;
  align-items: center;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #333333;
  transition: color 0.3s ease;
}

.stat-item:hover {
  color: #409EFF;
}

.like-btn {
  cursor: pointer;
}

.like-btn:hover {
  transform: scale(1.1);
}

.like-btn .liked {
  color: #ff4757;
  animation: heartBeat 0.3s ease-in-out;
}

@keyframes heartBeat {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.load-more-trigger {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #999;
  font-size: 14px;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
  
  @media (min-width: 769px) and (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.skeleton-image {
  width: 100%;
  aspect-ratio: 0.9;
  border-radius: 0;
}

.skeleton-title {
  height: 20px;
  margin-bottom: 8px;
}

.skeleton-text {
  height: 14px;
  margin-bottom: 4px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.no-more {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
}

</style>
