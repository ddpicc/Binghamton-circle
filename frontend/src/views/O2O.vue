<template>
  <div class="o2o">
    <NavHeader />
    <div class="o2o-container">
      <div class="o2o-header">
        <h2>O2O服务平台</h2>
        <p>二手交易、租房等生活服务</p>
      </div>
      
      <div class="o2o-filters">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-input
              v-model="searchQuery"
              placeholder="搜索物品..."
              prefix-icon="Search"
              clearable
              @input="handleSearch"
            />
          </el-col>
          <el-col :span="6">
            <el-select v-model="selectedCategory" placeholder="选择分类" clearable @change="handleFilter">
              <el-option label="全部" value="" />
              <el-option
                v-for="category in categories"
                :key="category.id"
                :label="category.displayName"
                :value="Number(category.id)"
              />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-select v-model="sortBy" placeholder="排序方式" @change="handleFilter">
              <el-option label="最新发布" value="latest" />
              <el-option label="价格从低到高" value="price_low" />
              <el-option label="价格从高到低" value="price_high" />
              <el-option label="最受欢迎" value="popular" />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-button type="primary" @click="showPublishDialog" :disabled="!isLoggedIn">
              发布物品
            </el-button>
          </el-col>
        </el-row>
      </div>
      
      <div class="o2o-list">
        <div v-if="loading" class="loading">
          <el-skeleton :rows="3" animated />
        </div>
        
        <div v-else-if="items.length === 0" class="empty">
          <el-empty description="暂无物品，快来发布第一个吧！" />
        </div>
        
        <div v-else>
          <div v-for="item in items" :key="item.id" class="o2o-item">
            <el-card>
              <div class="item-header">
                <div class="item-title">
                  <el-tag :type="getStatusType(item.status)" size="small">
                    {{ getStatusName(item.status) }}
                  </el-tag>
                  <el-tag type="info" size="small" v-if="item.category">
                    {{ formatCategoryLabel(item.category) }}
                  </el-tag>
                  <h3>{{ item.title }}</h3>
                </div>
                <div class="item-price">
                  <span class="price">${{ item.price }}</span>
                  <span class="price-type">({{ getPriceTypeName(item.price_type) }})</span>
                </div>
              </div>
              
              <div class="item-content">
                <p>{{ item.description.substring(0, 100) }}...</p>
                <div v-if="item.images && item.images.length > 0" class="item-images">
                  <el-image
                    v-for="(image, index) in item.images.slice(0, 3)"
                    :key="index"
                    :src="image"
                    fit="cover"
                    class="item-image"
                    @click.stop="openImageViewer(item.images, index)"
                  />
                </div>
              </div>
              
              <div class="item-meta">
                <div class="item-meta-left">
                  <div class="item-publisher">
                    <el-avatar :size="28" :src="item.user?.avatar" class="item-publisher-avatar">
                      {{ getPublisherName(item).charAt(0).toUpperCase() }}
                    </el-avatar>
                    <span class="item-publisher-name">{{ getPublisherName(item) }}</span>
                  </div>
                  <div class="item-info">
                    <span class="item-condition" v-if="!isRentalItem(item)">成色：{{ getConditionLabel(item.condition) }}</span>
                    <span class="item-condition" v-else>面积：{{ item.area }}㎡</span>
                    <span class="item-time">{{ formatDate(item.created_at) }}</span>
                  </div>
                </div>
                <div class="item-actions">
                  <el-button size="small" @click="viewItem(item)">查看详情</el-button>
                  <el-dropdown v-if="userStore.user?.id === item.user_id || userStore.isAdmin" @command="(cmd) => handleItemCommand(cmd, item)">
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
            </el-card>
          </div>
        </div>
      </div>
      
      <!-- 分页 -->
      <div v-if="items.length > 0" class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
      
      <!-- 发布/编辑对话框 -->
      <el-dialog
        v-model="publishDialogVisible"
        :title="editingItem ? '编辑物品' : '发布物品'"
        width="80%"
        class="publish-dialog"
      >
        <el-form :model="itemForm" :rules="dynamicItemRules" ref="itemFormRef" label-width="100px">
          <el-form-item label="标题" prop="title">
            <el-input v-model="itemForm.title" placeholder="请输入物品标题" />
          </el-form-item>
          
          <el-form-item label="分类" prop="category_id">
            <el-select v-model="itemForm.category_id" placeholder="请选择分类" @change="onCategoryChange">
              <el-option
                v-for="category in categories"
                :key="category.id"
                :label="category.displayName"
                :value="Number(category.id)"
              />
            </el-select>
          </el-form-item>
          
          <!-- 租房信息专用字段 -->
          <template v-if="isRentalCategory">
            <el-form-item label="租金" prop="price">
              <el-input-number v-model="itemForm.price" :min="0" :precision="2" />
              <span style="margin-left: 10px;">$/月</span>
            </el-form-item>
            
            <el-form-item label="押金" prop="deposit">
              <el-input-number v-model="itemForm.deposit" :min="0" :precision="2" />
              <span style="margin-left: 10px;">$</span>
            </el-form-item>
            
            <el-form-item label="房屋类型" prop="house_type">
              <el-select v-model="itemForm.house_type" placeholder="请选择房屋类型">
                <el-option label="整租" value="whole" />
                <el-option label="合租" value="share" />
                <el-option label="单间" value="single" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="房间配置" prop="room_config">
              <el-select v-model="itemForm.room_config" placeholder="请选择房间配置">
                <el-option label="一室一厅" value="1室1厅" />
                <el-option label="两室一厅" value="2室1厅" />
                <el-option label="两室两厅" value="2室2厅" />
                <el-option label="三室一厅" value="3室1厅" />
                <el-option label="三室两厅" value="3室2厅" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="面积" prop="area">
              <el-input-number v-model="itemForm.area" :min="0" :precision="1" />
              <span style="margin-left: 10px;">平方米</span>
            </el-form-item>
            
            <el-form-item label="楼层" prop="floor">
              <el-input v-model="itemForm.floor" placeholder="例如：5/6 (第5层，共6层)" />
            </el-form-item>
            
            <el-form-item label="朝向" prop="orientation">
              <el-select v-model="itemForm.orientation" placeholder="请选择朝向">
                <el-option label="朝南" value="南" />
                <el-option label="朝北" value="北" />
                <el-option label="朝东" value="东" />
                <el-option label="朝西" value="西" />
                <el-option label="南北通透" value="南北" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="配套设施">
              <el-checkbox-group v-model="itemForm.facilities">
                <el-checkbox label="空调">空调</el-checkbox>
                <el-checkbox label="暖气">暖气</el-checkbox>
                <el-checkbox label="热水器">热水器</el-checkbox>
                <el-checkbox label="洗衣机">洗衣机</el-checkbox>
                <el-checkbox label="冰箱">冰箱</el-checkbox>
                <el-checkbox label="电视">电视</el-checkbox>
                <el-checkbox label="宽带">宽带</el-checkbox>
                <el-checkbox label="家具">家具</el-checkbox>
                <el-checkbox label="燃气">燃气</el-checkbox>
                <el-checkbox label="电梯">电梯</el-checkbox>
                <el-checkbox label="停车位">停车位</el-checkbox>
                <el-checkbox label="阳台">阳台</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            
            <el-form-item label="入住时间" prop="move_in_date">
              <el-date-picker
                v-model="itemForm.move_in_date"
                type="date"
                placeholder="选择可入住时间"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
            
            <el-form-item label="最短租期" prop="min_lease">
              <el-select v-model="itemForm.min_lease" placeholder="请选择最短租期">
                <el-option label="1个月" value="1个月" />
                <el-option label="3个月" value="3个月" />
                <el-option label="6个月" value="6个月" />
                <el-option label="1年" value="1年" />
                <el-option label="面议" value="面议" />
              </el-select>
            </el-form-item>
          </template>
          
          <!-- 其他分类通用字段 -->
          <template v-else>
            <el-form-item label="价格" prop="price">
              <el-input-number v-model="itemForm.price" :min="0" :precision="2" />
              <el-select v-model="itemForm.price_type" style="margin-left: 10px;">
                <el-option label="固定价格" value="fixed" />
                <el-option label="可议价" value="negotiable" />
                <el-option label="免费" value="free" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="成色" prop="condition">
              <el-select v-model="itemForm.condition" placeholder="请选择成色">
                <el-option label="全新" value="new" />
                <el-option label="九成新" value="like_new" />
                <el-option label="八成新" value="good" />
                <el-option label="七成新" value="fair" />
                <el-option label="一般" value="poor" />
              </el-select>
            </el-form-item>
          </template>
          
          <el-form-item label="位置" prop="location">
            <el-input v-model="itemForm.location" placeholder="请输入交易位置" />
          </el-form-item>
          
          <el-form-item label="联系方式" prop="contact_info">
            <el-input v-model="itemForm.contact_info" placeholder="请输入联系方式" />
          </el-form-item>
          
          <el-form-item label="描述" prop="description">
            <el-input
              v-model="itemForm.description"
              type="textarea"
              :rows="4"
              placeholder="请输入物品描述"
            />
          </el-form-item>
          
          <el-form-item label="物品图片">
            <el-upload
              action="#"
              list-type="picture-card"
              :auto-upload="false"
              :on-change="handleImageChange"
              :on-remove="handleImageRemove"
              :limit="5"
              :file-list="imageFileList"
            >
              <el-icon><Plus /></el-icon>
              <template #tip>
                <div class="el-upload__tip">
                  只能上传JPG/PNG文件，且不超过5MB
                </div>
              </template>
            </el-upload>
          </el-form-item>
          
          <el-form-item label="标签">
            <el-input
              v-model="tagsInput"
              placeholder="输入标签，按回车添加"
              @keyup.enter="addTag"
            />
            <div class="tags-list">
              <el-tag
                v-for="(tag, index) in itemForm.tags"
                :key="index"
                closable
                @close="removeTag(index)"
              >
                {{ tag }}
              </el-tag>
            </div>
          </el-form-item>
          
          <el-form-item label="过期时间">
            <el-date-picker
              v-model="itemForm.expire_date"
              type="date"
              placeholder="选择过期时间"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              />
          </el-form-item>
        </el-form>
        
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="publishDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="saveItem" :loading="saving">
              {{ editingItem ? '更新' : '发布' }}
            </el-button>
          </div>
        </template>
      </el-dialog>
      
      <!-- 详情对话框 -->
      <el-dialog
        v-model="detailDialogVisible"
        :title="selectedItem?.title"
        width="70%"
        class="detail-dialog"
      >
        <div v-if="selectedItem" class="item-detail">
          <div class="detail-header">
            <div class="detail-meta">
              <el-tag :type="getStatusType(selectedItem.status)">
                {{ getStatusName(selectedItem.status) }}
              </el-tag>
              <el-tag type="info" v-if="selectedItem.categoryInfo || selectedItem.category">
                {{ formatCategoryLabel(selectedItem.categoryInfo || selectedItem.category) }}
              </el-tag>
              <span class="detail-price">${{ selectedItem.price }}</span>
              <span class="detail-price-type">({{ getPriceTypeName(selectedItem.price_type) }})</span>
            </div>
          </div>
          
          <div class="detail-content">
            <div class="detail-section">
              <h4>物品描述</h4>
              <p>{{ selectedItem.description }}</p>
            </div>
            
            <!-- 租房信息详情 -->
            <div v-if="isRentalCategorySelected" class="detail-section">
              <h4>房屋信息</h4>
              <el-row :gutter="20">
                <el-col :span="8">
                  <div class="detail-info-item">
                    <span class="label">租金：</span>
                    <span class="value">${{ selectedItem.price }}/月</span>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="detail-info-item">
                    <span class="label">押金：</span>
                    <span class="value">${{ selectedItem.deposit }}</span>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="detail-info-item">
                    <span class="label">房屋类型：</span>
                    <span class="value">{{ getHouseTypeLabel(selectedItem.house_type) }}</span>
                  </div>
                </el-col>
              </el-row>
              
              <el-row :gutter="20">
                <el-col :span="8">
                  <div class="detail-info-item">
                    <span class="label">房间配置：</span>
                    <span class="value">{{ selectedItem.room_config }}</span>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="detail-info-item">
                    <span class="label">面积：</span>
                    <span class="value">{{ selectedItem.area }}平方米</span>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="detail-info-item">
                    <span class="label">楼层：</span>
                    <span class="value">{{ selectedItem.floor }}</span>
                  </div>
                </el-col>
              </el-row>
              
              <el-row :gutter="20">
                <el-col :span="8">
                  <div class="detail-info-item">
                    <span class="label">朝向：</span>
                    <span class="value">{{ selectedItem.orientation }}</span>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="detail-info-item">
                    <span class="label">可入住时间：</span>
                    <span class="value">{{ formatDate(selectedItem.move_in_date) }}</span>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="detail-info-item">
                    <span class="label">最短租期：</span>
                    <span class="value">{{ selectedItem.min_lease }}</span>
                  </div>
                </el-col>
              </el-row>
              
              <div v-if="selectedItem.facilities && selectedItem.facilities.length > 0" class="detail-section">
                <h4>配套设施</h4>
                <div class="detail-tags">
                  <el-tag v-for="facility in selectedItem.facilities" :key="facility">{{ facility }}</el-tag>
                </div>
              </div>
            </div>
            
            <!-- 其他分类详情 -->
            <div v-else class="detail-section">
              <h4>详细信息</h4>
              <el-row :gutter="20">
                <el-col :span="8">
                  <div class="detail-info-item">
                    <span class="label">成色：</span>
                    <span class="value">{{ getConditionLabel(selectedItem.condition) }}</span>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="detail-info-item">
                    <span class="label">位置：</span>
                    <span class="value">{{ selectedItem.location }}</span>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="detail-info-item">
                    <span class="label">发布时间：</span>
                    <span class="value">{{ formatDate(selectedItem.created_at) }}</span>
                  </div>
                </el-col>
              </el-row>
            </div>
            
            <div v-if="selectedItem.images && selectedItem.images.length > 0" class="detail-section">
              <h4>物品图片</h4>
              <div class="detail-images">
                <el-image
                  v-for="(image, index) in selectedItem.images"
                  :key="index"
                  :src="image"
                  fit="cover"
                  class="detail-image"
                  @click.stop="openImageViewer(selectedItem.images, index)"
                />
              </div>
            </div>
            
            <div v-if="selectedItem.tags && selectedItem.tags.length > 0" class="detail-section">
              <h4>标签</h4>
              <div class="detail-tags">
                <el-tag v-for="tag in selectedItem.tags" :key="tag">{{ tag }}</el-tag>
              </div>
            </div>
            
            <div class="detail-section">
              <h4>联系信息</h4>
              <div v-if="selectedItem.contact_info">
                <p v-if="selectedItem.contact_info.wechat">微信: {{ selectedItem.contact_info.wechat }}</p>
                <p v-if="selectedItem.contact_info.phone">电话: {{ selectedItem.contact_info.phone }}</p>
                <p v-if="selectedItem.contact_info.email">邮箱: {{ selectedItem.contact_info.email }}</p>
                <p v-if="typeof selectedItem.contact_info === 'string'">{{ selectedItem.contact_info }}</p>
              </div>
            </div>
            
            <div class="detail-section">
              <h4>发布者</h4>
              <div class="publisher-info">
                <!-- 点击头像预览图片 -->
                <el-avatar 
                  :size="40" 
                  :src="selectedItem.user?.avatar" 
                  @click="previewAvatar(selectedItem.user?.avatar)"
                  class="clickable-avatar"
                >
                  {{ getPublisherName(selectedItem).charAt(0).toUpperCase() }}
                </el-avatar>
                <div
                  class="publisher-link"
                  @click="goToUserProfile(selectedItem.user?.id)"
                >
                  <span class="publisher-name clickable-name">
                    {{ getPublisherName(selectedItem) }}
                  </span>
                  <span class="publisher-link-hint">查看主页</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="detailDialogVisible = false">关闭</el-button>
            <el-button v-if="userStore.user?.id === selectedItem?.user_id" type="primary" @click="editItem(selectedItem)">
              编辑
            </el-button>
          </div>
        </template>
      </el-dialog>

      <el-image-viewer
        v-if="imageViewerVisible"
        :url-list="imageViewerUrls"
        :initial-index="imageViewerIndex"
        :teleported="true"
        @close="closeImageViewer"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, MoreFilled, Plus } from '@element-plus/icons-vue'
import { useO2OStore } from '@/stores/o2o'
import { useUserStore } from '@/stores/user'
import { uploadService } from '@/services/upload'
import { formatDate } from '@/utils'
import NavHeader from '@/components/NavHeader.vue'
import type { O2OCategory } from '@/services/o2o'

const router = useRouter()
const o2oStore = useO2OStore()
const userStore = useUserStore()

const searchQuery = ref('')
const selectedCategory = ref<number | '' | undefined>('')
const sortBy = ref('latest')
const currentPage = ref(1)
const pageSize = ref(10)
const publishDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const selectedItem = ref(null)
const editingItem = ref(null)
const saving = ref(false)
const itemFormRef = ref()
const tagsInput = ref('')
const imageFileList = ref([])
const uploadingImages = ref(false)
const imageViewerVisible = ref(false)
const imageViewerUrls = ref<string[]>([])
const imageViewerIndex = ref(0)

const toDateInputValue = (value: string | null | undefined): string | null => {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString().slice(0, 10)
}

const itemForm = ref({
  title: '',
  description: '',
  category_id: '',
  price: 0,
  price_type: 'fixed',
  condition: '',
  location: '',
  contact_info: '',
  tags: [],
  expire_date: null as string | null,
  // 租房信息专用字段
  deposit: 0,
  house_type: '',
  room_config: '',
  area: 0,
  floor: '',
  orientation: '',
  facilities: [] as string[],
  move_in_date: null as string | null,
  min_lease: ''
})

const itemRules = {
  title: [
    { required: true, message: '请输入物品标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在2到100个字符', trigger: 'blur' }
  ],
  category_id: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ],
  price: [
    { required: true, message: '请输入价格', trigger: 'blur' }
  ],
  location: [
    { required: true, message: '请输入位置', trigger: 'blur' }
  ],
  contact_info: [
    { required: true, message: '请输入联系方式', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入物品描述', trigger: 'blur' },
    { min: 10, message: '描述至少10个字符', trigger: 'blur' }
  ]
}

// 动态验证规则，根据分类类型调整
const dynamicItemRules = computed(() => {
  const rules = { ...itemRules }
  
  // 如果是租房信息分类，添加租房专用验证规则
  if (isRentalCategory.value) {
    rules.deposit = [
      { required: true, message: '请输入押金', trigger: 'blur' }
    ]
    rules.house_type = [
      { required: true, message: '请选择房屋类型', trigger: 'change' }
    ]
    rules.room_config = [
      { required: true, message: '请选择房间配置', trigger: 'change' }
    ]
    rules.area = [
      { required: true, message: '请输入面积', trigger: 'blur' }
    ]
    rules.orientation = [
      { required: true, message: '请选择朝向', trigger: 'change' }
    ]
    rules.move_in_date = [
      { required: true, message: '请选择可入住时间', trigger: 'change' }
    ]
    rules.min_lease = [
      { required: true, message: '请选择最短租期', trigger: 'change' }
    ]
  } else {
    // 其他分类需要成色字段
    rules.condition = [
      { required: true, message: '请选择成色', trigger: 'change' }
    ]
  }
  
  return rules
})

const loading = computed(() => o2oStore.loading)
const items = computed(() => o2oStore.items)
type DisplayCategory = Partial<O2OCategory> & { id: number; displayName: string }

const categories = computed<DisplayCategory[]>(() => {
  const source = o2oStore.categories || []
  
  // 直接使用从后端获取的所有分类，不进行过滤
  return source.map(category => ({
    ...category,
    id: Number(category.id),
    displayName: category.name || category.description || '未分类'
  }))
})

const isRentalCategoryData = (category: Partial<O2OCategory> | null | undefined) => {
  if (!category) return false
  return category.code === 'rental'
    || category.name === '租房'
    || category.name === '租房信息'
    || category.description === '租房信息'
}

// 判断是否为租房信息分类
const isRentalCategory = computed(() => {
  const categoryId = itemForm.value.category_id
  if (!categoryId) return false
  
  const category = categories.value.find(cat => cat.id === Number(categoryId))
  return isRentalCategoryData(category)
})

const total = computed(() => o2oStore.pagination.total)
const isLoggedIn = computed(() => userStore.isLoggedIn)

const getStatusName = (status) => {
  const statusMap = {
    available: '可交易',
    sold: '已售出',
    expired: '已过期',
    reserved: '已预订'
  }
  return statusMap[status] || '未知'
}

const getStatusType = (status) => {
  const typeMap = {
    available: 'success',
    sold: 'info',
    expired: 'warning',
    reserved: 'primary'
  }
  return typeMap[status] || 'info'
}

const getPriceTypeName = (type) => {
  const typeMap = {
    fixed: '固定价格',
    negotiable: '可议价',
    free: '免费'
  }
  return typeMap[type] || '固定价格'
}

const formatCategoryLabel = (category: Partial<O2OCategory> | null | undefined) => {
  if (!category) return '其他'
  return category.name || category.description || '其他'
}

const getConditionLabel = (condition: string) => {
  const conditionMap = {
    new: '全新',
    like_new: '九成新',
    good: '八成新',
    fair: '七成新',
    poor: '一般'
  }
  return conditionMap[condition] || condition
}

const getHouseTypeLabel = (houseType: string) => {
  const houseTypeMap = {
    whole: '整租',
    share: '合租',
    single: '单间'
  }
  return houseTypeMap[houseType] || houseType
}

const getPublisherName = (item: any) => {
  return item?.user?.nickname?.trim() || item?.user?.username?.trim() || '用户'
}

// 判断详情页选中物品是否为租房分类
const isRentalCategorySelected = computed(() => {
  if (!selectedItem.value) return false
  
  const category = selectedItem.value.categoryInfo || selectedItem.value.category
  return isRentalCategoryData(category)
})

// 判断列表中的物品是否为租房信息
const isRentalItem = (item: any) => {
  return isRentalCategoryData(item?.category)
}

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    const categoryId = selectedCategory.value === '' || selectedCategory.value === undefined ? undefined : Number(selectedCategory.value)
    o2oStore.searchO2OItems({
      search: searchQuery.value,
      sort: sortBy.value,
      page: currentPage.value,
      limit: pageSize.value,
      ...(categoryId !== undefined ? { category_id: categoryId } : {})
    })
  } else {
    handleFilter()
  }
}

const handleFilter = () => {
  const categoryId = selectedCategory.value === '' || selectedCategory.value === undefined ? undefined : Number(selectedCategory.value)
  o2oStore.fetchO2OItems({
    sort: sortBy.value,
    page: currentPage.value,
    limit: pageSize.value,
    ...(categoryId !== undefined ? { category_id: categoryId } : {})
  })
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  handleFilter()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  handleFilter()
}

const showPublishDialog = () => {
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录')
    return
  }
  
  editingItem.value = null
  itemForm.value = {
    title: '',
    description: '',
    category_id: '',
    price: 0,
    price_type: 'fixed',
    condition: '',
    location: '',
    contact_info: '',
    tags: [],
    expire_date: null
  }
  if (categories.value.length > 0) {
    itemForm.value.category_id = Number(categories.value[0].id)
  }
  imageFileList.value = []
  publishDialogVisible.value = true
}

const addTag = () => {
  if (tagsInput.value.trim() && !itemForm.value.tags.includes(tagsInput.value.trim())) {
    itemForm.value.tags.push(tagsInput.value.trim())
    tagsInput.value = ''
  }
}

const openImageViewer = (images: string[] = [], index = 0) => {
  const validImages = (images || []).filter((img) => typeof img === 'string' && img.trim())
  if (!validImages.length) return
  imageViewerUrls.value = validImages
  imageViewerIndex.value = Math.max(0, Math.min(index, validImages.length - 1))
  imageViewerVisible.value = true
}

const closeImageViewer = () => {
  imageViewerVisible.value = false
}

const removeTag = (index: number) => {
  itemForm.value.tags.splice(index, 1)
}

const saveItem = async () => {
  if (!itemFormRef.value) return
  
  try {
    await itemFormRef.value.validate()
    const categoryId = selectedCategory.value === '' || selectedCategory.value === undefined ? undefined : Number(selectedCategory.value)
    if (categoryId === undefined) {
      ElMessage.error('请选择分类')
      return
    }
    saving.value = true

    // 上传图片
    const imageUrls = await uploadImages()
    
    const expireDateValue =
      itemForm.value.expire_date && itemForm.value.expire_date !== 'Invalid date'
        ? itemForm.value.expire_date
        : null

    // 构建物品数据
    const itemData: any = {
      title: itemForm.value.title,
      description: itemForm.value.description,
      category_id: categoryId,
      category: categoryId,
      location: itemForm.value.location,
      contact_info: itemForm.value.contact_info,
      tags: itemForm.value.tags,
      expire_date: expireDateValue,
      images: imageUrls
    }

    // 根据分类类型添加相应字段
    if (isRentalCategory.value) {
      // 租房信息字段
      itemData.price = itemForm.value.price
      itemData.deposit = itemForm.value.deposit
      itemData.house_type = itemForm.value.house_type
      itemData.room_config = itemForm.value.room_config
      itemData.area = itemForm.value.area
      itemData.floor = itemForm.value.floor
      itemData.orientation = itemForm.value.orientation
      itemData.facilities = itemForm.value.facilities
      itemData.move_in_date = itemForm.value.move_in_date
      itemData.min_lease = itemForm.value.min_lease
      itemData.price_type = 'fixed' // 租房默认为固定价格
      itemData.condition = 'new' // 租房不需要成色
    } else {
      // 其他分类字段
      itemData.price = itemForm.value.price
      itemData.price_type = itemForm.value.price_type
      itemData.condition = itemForm.value.condition
    }
    
    if (editingItem.value) {
      await o2oStore.updateO2OItem(editingItem.value.id, itemData)
      ElMessage.success('更新成功')
    } else {
      await o2oStore.createO2OItem(itemData)
      ElMessage.success('发布成功')
    }
    
    publishDialogVisible.value = false
    imageFileList.value = []
    
  } catch (error: any) {
    console.error('保存物品失败:', error)
    ElMessage.error(error || '保存失败')
  } finally {
    saving.value = false
  }
}

const viewItem = async (item) => {
  selectedItem.value = item
  detailDialogVisible.value = true
  
  try {
    await o2oStore.fetchO2OItemById(item.id)
    selectedItem.value = o2oStore.currentItem
  } catch (error: any) {
    console.error('获取物品详情失败:', error)
    ElMessage.error('获取物品详情失败')
  }
}

const goToUserProfile = (userId) => {
  if (userId) {
    router.push(`/profile/${userId}`)
  }
}

const previewAvatar = (avatarUrl) => {
  if (avatarUrl) {
    // 使用Element Plus的图片预览功能
    ElMessage.info('头像预览功能开发中')
    // 这里可以实现头像预览逻辑
  }
}

const onCategoryChange = (value) => {
  // 当分类改变时，重置特定字段
  if (isRentalCategory.value) {
    // 切换到租房分类时，设置默认值
    itemForm.value.price_type = 'fixed'
    itemForm.value.condition = 'new'
  } else {
    // 切换到其他分类时，清除租房字段
    itemForm.value.deposit = 0
    itemForm.value.house_type = ''
    itemForm.value.room_config = ''
    itemForm.value.area = 0
    itemForm.value.floor = ''
    itemForm.value.orientation = ''
    itemForm.value.facilities = []
    itemForm.value.move_in_date = null
    itemForm.value.min_lease = ''
  }
}

const toggleLike = async (item) => {
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录')
    return
  }
  
  try {
    await o2oStore.likeO2OItem(item.id)
  } catch (error: any) {
    console.error('点赞失败:', error)
    ElMessage.error(error || '点赞失败')
  }
}

const handleItemCommand = async (command: string, item: any) => {
  if (command === 'edit') {
    editItem(item)
  } else if (command === 'delete') {
    try {
      await ElMessageBox.confirm('确定要删除这个物品吗？', '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      
      await o2oStore.deleteO2OItem(item.id)
      ElMessage.success('删除成功')
      
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('删除失败:', error)
        ElMessage.error(error || '删除失败')
      }
    }
  }
}

const handleImageChange = (file: any) => {
  // 验证文件类型
  const isImage = file.raw.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  
  // 验证文件大小（5MB）
  const isLt5M = file.raw.size / 1024 / 1024 < 5
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }
  
  return true
}

const handleImageRemove = (file: any) => {
  const index = imageFileList.value.findIndex(item => item.uid === file.uid)
  if (index !== -1) {
    imageFileList.value.splice(index, 1)
  }
}

const uploadImages = async (): Promise<string[]> => {
  if (imageFileList.value.length === 0) {
    return []
  }
  
  uploadingImages.value = true
  const imageUrls: string[] = []
  
  try {
    for (const file of imageFileList.value) {
      const response = await uploadService.uploadImage(file.raw)
      imageUrls.push(response.image.url)
    }
    
    ElMessage.success('图片上传成功')
    return imageUrls
  } catch (error: any) {
    console.error('图片上传失败:', error)
    ElMessage.error('图片上传失败')
    throw error
  } finally {
    uploadingImages.value = false
  }
}

onMounted(async () => {
  // 初始化用户状态
  userStore.initUser()
  
  // 加载分类列表
  try {
    await o2oStore.fetchCategories()
  } catch (error: any) {
    console.error('加载分类失败:', error)
  }
  
  // 加载物品列表
  try {
    await o2oStore.fetchO2OItems()
  } catch (error: any) {
    console.error('加载物品失败:', error)
    ElMessage.error('加载物品失败')
  }
})
</script>

<style scoped>
.o2o {
  min-height: 100vh;
  background: var(--background-light);
  padding: 20px;
  padding-top: 80px;
}

.o2o-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.o2o-header {
  text-align: center;
  margin-bottom: 30px;
  animation: fadeIn 0.6s ease-out;
}

.o2o-header h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 700;
}

.o2o-header p {
  margin: 8px 0 0 0;
  color: var(--text-secondary);
  font-size: clamp(0.875rem, 2vw, 1rem);
}

.o2o-filters {
  margin-bottom: 30px;
  animation: slideUp 0.5s ease-out;
}

.o2o-list {
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

.o2o-item {
  margin-bottom: 20px;
  animation: fadeIn 0.4s ease-out;
  transition: all var(--transition-base);
}

.o2o-item:hover {
  transform: translateY(-2px);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
  gap: 15px;
}

.item-title {
  flex: 1;
  min-width: 0;
}

.item-title h3 {
  margin: 8px 0 0 0;
  color: var(--text-primary);
  font-size: clamp(1rem, 2vw, 1.125rem);
  line-height: 1.4;
  font-weight: 600;
}

.item-title .el-tag {
  margin-right: 8px;
  margin-bottom: 4px;
}

.item-price {
  text-align: right;
  white-space: nowrap;
}

.price {
  font-size: clamp(1.125rem, 2vw, 1.25rem);
  font-weight: bold;
  color: var(--danger-color);
}

.price-type {
  font-size: 0.75rem;
  color: var(--text-secondary);
  display: block;
}

.item-content {
  margin-bottom: 15px;
}

.item-content p {
  margin: 0;
  line-height: 1.6;
  color: var(--text-regular);
  font-size: 0.95rem;
}

.item-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
  margin-top: 10px;
}

.item-image {
  width: 100%;
  height: 80px;
  border-radius: var(--border-radius-base);
  object-fit: cover;
  transition: all var(--transition-fast);
}

.item-image:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-base);
}

.item-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
  border-top: 1px solid var(--border-light);
  flex-wrap: wrap;
  gap: 10px;
}

.item-meta-left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
}

.item-publisher {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.item-publisher-avatar {
  flex-shrink: 0;
}

.item-publisher-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1;
}

.item-info {
  display: flex;
  gap: 15px;
  font-size: 0.75rem;
  color: var(--text-secondary);
  flex-wrap: wrap;
}

.item-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pagination {
  margin-top: 30px;
  text-align: center;
  animation: fadeIn 0.4s ease-out;
}

.tags-list {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tags-list .el-tag {
  margin-right: 0;
  margin-bottom: 0;
  font-size: 0.875rem;
}

.detail-header {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--border-light);
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.detail-price {
  font-size: clamp(1.25rem, 3vw, 1.5rem);
  font-weight: bold;
  color: var(--danger-color);
}

.detail-price-type {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.detail-content {
  line-height: 1.8;
}

.detail-section {
  margin-bottom: 30px;
  animation: slideUp 0.3s ease-out;
}

.detail-section h4 {
  margin-bottom: 15px;
  color: var(--text-primary);
  font-size: 1.125rem;
  font-weight: 600;
}

.detail-info-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.detail-info-item .label {
  font-weight: 600;
  color: var(--text-regular);
  margin-right: 8px;
  min-width: 60px;
}

.detail-info-item .value {
  color: var(--text-primary);
}

.detail-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.detail-image {
  width: 100%;
  height: 150px;
  border-radius: var(--border-radius-base);
  object-fit: cover;
  transition: all var(--transition-fast);
}

.detail-image:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-base);
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.publisher-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  background: var(--background-light);
  border-radius: var(--border-radius-base);
  transition: all var(--transition-fast);
}

.publisher-info:hover {
  background: rgba(64, 158, 255, 0.05);
}

.clickable-avatar {
  cursor: pointer;
}

.publisher-link {
  display: flex;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;
}

.clickable-name {
  font-weight: 600;
  color: var(--text-primary);
  text-decoration: none;
}

.publisher-link:hover .clickable-name {
  color: var(--primary-color);
  text-decoration: underline;
}

.publisher-name {
  font-weight: 600;
  color: var(--text-primary);
}

.publisher-link-hint {
  font-size: 0.75rem;
  color: var(--text-secondary);
  transition: color var(--transition-fast);
}

.publisher-link:hover .publisher-link-hint {
  color: var(--primary-color);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .o2o {
    padding: 15px;
  }
  
  .o2o-container {
    max-width: 100%;
  }
  
  .o2o-header {
    margin-bottom: 20px;
  }
  
  .o2o-header h2 {
    font-size: 1.75rem;
  }
  
  .o2o-filters {
    margin-bottom: 20px;
  }
  
  .o2o-filters .el-col {
    margin-bottom: 15px;
    width: 100%;
  }
  
  .item-header {
    flex-direction: column;
    gap: 10px;
  }
  
  .item-title h3 {
    font-size: 1rem;
  }
  
  .item-price {
    text-align: left;
  }
  
  .price {
    font-size: 1.125rem;
  }
  
  .item-images {
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
    gap: 6px;
  }
  
  .item-image {
    height: 60px;
  }
  
  .item-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .item-meta-left {
    width: 100%;
  }
  
  .item-info {
    font-size: 0.7rem;
    gap: 10px;
  }
  
  .item-actions {
    justify-content: flex-start;
    width: 100%;
  }
  
  .detail-images {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
  }
  
  .detail-image {
    height: 120px;
  }
  
  .detail-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .detail-price {
    font-size: 1.25rem;
  }
  
  .publisher-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .dialog-footer {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .o2o {
    padding: 10px;
  }
  
  .o2o-header h2 {
    font-size: 1.5rem;
  }
  
  .o2o-header p {
    font-size: 0.875rem;
  }
  
  .item-title h3 {
    font-size: 0.95rem;
  }
  
  .item-images {
    grid-template-columns: repeat(2, 1fr);
    gap: 4px;
  }
  
  .item-image {
    height: 50px;
  }
  
  .item-info {
    flex-direction: column;
    gap: 4px;
    font-size: 0.65rem;
  }

  .item-publisher-name {
    font-size: 0.8125rem;
  }
  
  .item-actions {
    gap: 6px;
  }
  
  .detail-images {
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }
  
  .detail-image {
    height: 100px;
  }
  
  .detail-section h4 {
    font-size: 1rem;
  }
  
  .detail-info-item {
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 8px;
  }
  
  .detail-info-item .label {
    min-width: auto;
    margin-right: 0;
    margin-bottom: 4px;
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

/* 对话框响应式 */
.publish-dialog,
.detail-dialog {
  max-width: 90vw;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .publish-dialog,
  .detail-dialog {
    width: 95% !important;
    max-width: 95vw;
  }
  
  .publish-dialog .el-form-item {
    margin-bottom: 18px;
  }
  
  .publish-dialog .el-form-item__label {
    width: 80px !important;
    font-size: 0.875rem;
  }
}

/* 加载状态增强 */
.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--text-secondary);
  padding: 40px 20px;
}

.loading-spinner .el-icon {
  animation: spin 1s linear infinite;
  font-size: 1.5rem;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 按钮悬停效果 */
.o2o-item .el-button {
  transition: all var(--transition-fast);
}

.o2o-item .el-button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-light);
}

/* 标签悬停效果 */
.tags-list .el-tag {
  transition: all var(--transition-fast);
}

.tags-list .el-tag:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-light);
}

/* 图片上传区域增强 */
.el-upload--picture-card {
  transition: all var(--transition-fast);
}

.el-upload--picture-card:hover {
  border-color: var(--primary-color);
  transform: scale(1.02);
}

/* 分页响应式 */
.pagination .el-pagination {
  justify-content: center;
  flex-wrap: wrap;
}

@media (max-width: 480px) {
  .pagination .el-pagination {
    font-size: 0.875rem;
  }
  
  .pagination .el-pagination .el-pagination__sizes {
    margin-right: 0;
    margin-bottom: 8px;
  }
}
</style>
