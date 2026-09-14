<template>
  <div class="circles-page">
    <NavHeader />
    <div class="circles-container">
      <el-row :gutter="20">
      <!-- 左侧内容区 -->
      <el-col :span="24">
        <!-- 顶部操作栏 -->
        <div class="page-header">
          <h2>圈子</h2>
          <el-button type="primary" @click="router.push('/create-circle')">
            <el-icon><Plus /></el-icon>
            创建圈子
          </el-button>
        </div>

        <!-- 搜索和筛选 -->
        <el-card class="filter-card">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索圈子..."
                clearable
                @clear="handleSearch"
                @keyup.enter="handleSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </el-col>
            <el-col :span="6">
              <el-select v-model="selectedCategory" placeholder="选择分类" clearable @change="handleSearch">
                <el-option label="全部分类" value="" />
                <el-option
                  v-for="category in categories"
                  :key="category.id"
                  :label="category.name"
                  :value="category.id"
                />
              </el-select>
            </el-col>
            <el-col :span="6">
              <el-select v-model="sortBy" @change="handleSearch">
                <el-option label="最新创建" value="created_at" />
                <el-option label="成员最多" value="member_count" />
                <el-option label="帖子最多" value="post_count" />
              </el-select>
            </el-col>
            <el-col :span="4">
              <el-select v-model="filterType" @change="handleSearch">
                <el-option label="全部圈子" value="all" />
                <el-option label="公开圈子" value="public" />
                <el-option label="私密圈子" value="private" />
              </el-select>
            </el-col>
          </el-row>
        </el-card>

        <!-- 圈子列表 -->
        <div class="circles-list">
          <el-row :gutter="20">
            <el-col
              v-for="circle in circles"
              :key="circle.id"
              :span="12"
              class="circle-item-col"
            >
              <el-card class="circle-card" :body-style="{ padding: '0px' }">
                <div class="circle-cover" @click="viewCircle(circle.id)">
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
                  <div class="circle-badges">
                    <el-tag type="warning" size="small" v-if="circle.is_private">私密</el-tag>
                    <el-tag type="success" size="small" v-if="circle.is_member">我的圈子</el-tag>
                  </div>
                </div>
                <div class="circle-info">
                  <h3 @click="viewCircle(circle.id)">{{ circle.name }}</h3>
                  <p class="description">{{ circle.description }}</p>
                  <div class="circle-meta">
                    <span>
                      <el-icon><User /></el-icon>
                      {{ circle.member_count }} 成员
                    </span>
                    <span>
                      <el-icon><Document /></el-icon>
                      {{ circle.post_count }} 帖子
                    </span>
                  </div>
                  <div class="circle-category" v-if="circle.category">
                    <el-tag size="small" :icon="circle.category.icon">
                      {{ circle.category.name }}
                    </el-tag>
                  </div>
                  <div class="circle-actions">
                    <el-button
                      v-if="!circle.is_member"
                      type="primary"
                      size="small"
                      @click="joinCircle(circle)"
                      :loading="joiningId === circle.id"
                    >
                      加入圈子
                    </el-button>
                    <el-button
                      v-else
                      type="info"
                      size="small"
                      plain
                      @click="viewCircle(circle.id)"
                    >
                      进入圈子
                    </el-button>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>

          <!-- 加载更多 -->
          <div v-if="hasMore" class="load-more">
            <el-button
              type="primary"
              plain
              @click="loadMore"
              :loading="loading"
            >
              加载更多
            </el-button>
          </div>

          <!-- 空状态 -->
          <el-empty
            v-if="circles.length === 0 && !loading"
            description="暂无圈子"
          >
            <el-button type="primary" @click="router.push('/create-circle')">
              创建第一个圈子
            </el-button>
          </el-empty>
        </div>
      </el-col>
    </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import NavHeader from '@/components/NavHeader.vue'
import {
  Search,
  Plus,
  User,
  Document,
  Picture,
  UserFilled
} from '@element-plus/icons-vue'
import {
  getCircles,
  joinCircle as joinCircleApi,
  type Circle,
  type CircleListParams
} from '@/services'

const router = useRouter()

// 数据
const circles = ref<Circle[]>([])
const loading = ref(false)
const joiningId = ref<number | null>(null)

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const hasMore = computed(() => circles.value.length < total.value)

// 筛选条件
const searchKeyword = ref('')
const selectedCategory = ref<number | ''>('')
const sortBy = ref('created_at')
const filterType = ref('all')

// 分类数据
const categories = ref([
  { id: 1, name: '学习交流', icon: 'Book' },
  { id: 2, name: '生活分享', icon: 'Coffee' },
  { id: 3, name: '兴趣小组', icon: 'Star' },
  { id: 4, name: '校园活动', icon: 'Calendar' },
  { id: 5, name: '求职招聘', icon: 'Briefcase' }
])

// 获取圈子列表
const resolveSelectedCategoryId = () => {
  const value = selectedCategory.value
  if (value === '' || value === undefined || value === null) return undefined
  return typeof value === 'number' ? value : Number(value)
}

const fetchCircles = async (append = false) => {
  try {
    loading.value = true
    const categoryId = resolveSelectedCategoryId()
    const params: CircleListParams = {
      page: currentPage.value,
      limit: pageSize.value,
      sort: sortBy.value,
      order: 'DESC',
      sortBy: sortBy.value,
      sortOrder: 'DESC'
    }

    if (searchKeyword.value) {
      params.search = searchKeyword.value
    }
    if (categoryId !== undefined && !Number.isNaN(categoryId)) {
      params.category_id = categoryId
    }
    if (filterType.value === 'public') {
      params.is_private = false
    } else if (filterType.value === 'private') {
      params.is_private = true
    }

    const res = await getCircles(params)
    
    // 使用 Set 去重，确保每个圈子只显示一次
    const newCircles = res.circles || []
    if (append) {
      // 合并时去重
      const existingIds = new Set(circles.value.map(c => c.id))
      const uniqueNewCircles = newCircles.filter(c => !existingIds.has(c.id))
      circles.value.push(...uniqueNewCircles)
    } else {
      // 直接去重
      const uniqueCircles = []
      const seenIds = new Set()
      for (const circle of newCircles) {
        if (!seenIds.has(circle.id)) {
          seenIds.add(circle.id)
          uniqueCircles.push(circle)
        }
      }
      circles.value = uniqueCircles
    }
    
    total.value = res.pagination.total
  } catch (error) {
    console.error('获取圈子列表失败:', error)
    ElMessage.error('获取圈子列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchCircles()
}

// 加载更多
const loadMore = () => {
  currentPage.value++
  fetchCircles(true)
}

// 查看圈子
const viewCircle = (circleId: number) => {
  router.push(`/circles/${circleId}`)
}

// 加入圈子
const joinCircle = async (circle: Circle) => {
  try {
    joiningId.value = circle.id
    
    if (circle.is_private) {
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

    await joinCircleApi(circle.id)
    ElMessage.success(circle.is_private ? '申请已提交' : '加入成功')
    
    // 刷新列表
    await fetchCircles()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('加入圈子失败:', error)
      ElMessage.error(error.response?.data?.message || '加入圈子失败')
    }
  } finally {
    joiningId.value = null
  }
}

onMounted(() => {
  fetchCircles()
})
</script>

<style scoped>
.circles-page {
  padding-top: 80px;
}

.circles-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.filter-card {
  margin-bottom: 20px;
}

.circles-list {
  min-height: 400px;
}

.circle-item-col {
  margin-bottom: 20px;
}

.circle-card {
  transition: all 0.3s;
  cursor: pointer;
}

.circle-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.circle-cover {
  position: relative;
  height: 160px;
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
}

.image-error {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 30px;
}

.circle-type {
  position: absolute;
  top: 10px;
  right: 10px;
}

.circle-info {
  padding: 15px;
}

.circle-info h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #303133;
  cursor: pointer;
}

.circle-info h3:hover {
  color: #409EFF;
}

.description {
  color: #606266;
  font-size: 14px;
  margin: 0 0 10px 0;
  line-height: 1.4;
  height: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.circle-meta {
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
  font-size: 13px;
  color: #909399;
}

.circle-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.circle-category {
  margin-bottom: 12px;
}

.circle-actions {
  display: flex;
  justify-content: flex-end;
}

.load-more {
  text-align: center;
  margin-top: 30px;
}

.sidebar-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.my-circles-list,
.hot-circles-list {
  max-height: none; /* 展开展示更多 */
  overflow-y: visible; /* 去掉滚动条 */
}

.my-circle-item,
.hot-circle-item {
  position: relative;
  display: block;
  width: 100%;
  height: 72px; /* 固定高度 */
  cursor: pointer;
  border-radius: 8px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  margin-bottom: 10px; /* 卡片间距 */
}

.my-circle-item:hover,
.hot-circle-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0,0,0,0.12);
}

.my-circle-overlay,
.hot-circle-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgba(0,0,0,0.35), rgba(0,0,0,0.15));
}

.my-circle-info,
.hot-circle-info {
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 8px;
  z-index: 1;
  color: #fff;
}

.my-circle-item:last-child,
.hot-circle-item:last-child {
  margin-bottom: 0;
}

.my-circle-info h4,
.hot-circle-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #fff;
}

.my-circle-info span,
.hot-circle-info span {
  font-size: 12px;
  color: rgba(255,255,255,0.9);
}
</style>
