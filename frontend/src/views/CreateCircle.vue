<template>
  <div class="create-circle-page">
    <NavHeader />
    <div class="create-circle-container">
      <el-card class="form-card">
      <template #header>
        <div class="card-header">
          <h2>创建圈子</h2>
          <el-button @click="router.push('/circles')">返回列表</el-button>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        size="large"
      >
        <el-form-item label="圈子名称" prop="name">
          <el-input
            v-model="form.name"
            placeholder="请输入圈子名称（2-50个字符）"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="圈子描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入圈子描述（10-500个字符）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="圈子分类" prop="category_id">
          <el-select
            v-model="form.category_id"
            placeholder="请选择圈子分类"
            style="width: 100%"
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
            :before-upload="beforeCoverUpload"
          >
            <img
              v-if="form.cover_image"
              :src="form.cover_image"
              class="cover-image"
            />
            <el-icon v-else class="cover-uploader-icon"><Plus /></el-icon>
            <div class="cover-upload-tip">
              点击上传封面图片
            </div>
          </el-upload>
          <div class="upload-tip">
            支持 JPG、PNG 格式，大小不超过 5MB，建议尺寸 1200x300
          </div>
        </el-form-item>

        <el-form-item label="圈子类型">
          <div class="circle-type-container">
            <el-radio-group v-model="form.is_private">
              <el-radio :label="false">
                <el-icon><Unlock /></el-icon>
                公开圈子
              </el-radio>
              <el-radio :label="true">
                <el-icon><Lock /></el-icon>
                私密圈子
              </el-radio>
            </el-radio-group>
            <div class="type-description">
              <span v-if="!form.is_private" class="public-circle-text">
                公开圈子所有用户都可以查看内容，直接加入即可
              </span>
              <span v-else class="private-circle-text">
                私密圈子需要用户申请加入，管理员审核通过后才能查看内容
              </span>
            </div>
          </div>
        </el-form-item>

  
        <el-form-item label="圈子规则">
          <el-input
            v-model="form.rules"
            type="textarea"
            :rows="6"
            placeholder="请输入圈子规则（可选）"
            maxlength="1000"
            show-word-limit
          />
          <div class="help-text">
            设置圈子的行为规范和管理规则，新成员加入时会看到
          </div>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            @click="submitForm"
            :loading="submitting"
            size="large"
            style="width: 200px"
          >
            创建圈子
          </el-button>
          <el-button
            @click="resetForm"
            size="large"
            style="width: 100px; margin-left: 20px"
          >
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 创建须知 -->
    <el-card class="tips-card">
      <template #header>
        <span>创建须知</span>
      </template>
      <ul class="tips-list">
        <li>每个用户最多只能创建 <strong>1个</strong> 圈子（管理员除外）</li>
        <li>圈子名称需要简洁明了，能够体现圈子主题</li>
        <li>请确保圈子内容符合法律法规和社区规范</li>
        <li>创建后您将成为圈子的创建者，拥有管理权限</li>
        <li>圈子创建后无法删除，只能解散或转让</li>
        <li>请定期维护圈子，保持活跃度</li>
      </ul>
    </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import NavHeader from '@/components/NavHeader.vue'
import { Plus, Unlock, Lock } from '@element-plus/icons-vue'
import { createCircle, uploadService, type CreateCircleData } from '@/services'
import type { UploadUserFile } from 'element-plus'

const router = useRouter()

// 表单数据
const formRef = ref()
const submitting = ref(false)
const coverFileList = ref<UploadUserFile[]>([])

const form = reactive<{
  name: string
  description: string
  category_id: number | ''
  is_private: boolean
  rules: string
  cover_image?: string
}>({
  name: '',
  description: '',
  category_id: '',
  is_private: false,
  rules: '',
  cover_image: ''
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入圈子名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入圈子描述', trigger: 'blur' },
    { min: 10, max: 500, message: '长度在 10 到 500 个字符', trigger: 'blur' }
  ],
  category_id: [
    { required: true, message: '请选择圈子分类', trigger: 'change' }
  ]
}

// 分类数据
const categories = ref([
  { id: 1, name: '学习交流', icon: '📚' },
  { id: 2, name: '生活分享', icon: '☕' },
  { id: 3, name: '兴趣小组', icon: '⭐' },
  { id: 4, name: '校园活动', icon: '📅' },
  { id: 5, name: '求职招聘', icon: '💼' },
  { id: 6, name: '其他', icon: '📌' }
])

// 处理封面图片变化
const handleCoverChange = (file: UploadUserFile) => {
  const rawFile = file.raw as File | undefined
  if (!rawFile) return false

  const isImage = rawFile.type.startsWith('image/')
  const isLt5M = rawFile.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB!')
    return false
  }

  // 创建预览
  if (form.cover_image && form.cover_image.startsWith('blob:')) {
    URL.revokeObjectURL(form.cover_image)
  }
  const previewUrl = URL.createObjectURL(rawFile)
  form.cover_image = previewUrl
  file.url = previewUrl
  file.status = 'ready'
  coverFileList.value = [file]
  return true
}

// 上传前验证
const beforeCoverUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB!')
  }
  return isImage && isLt5M
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    // 准备提交数据
    const categoryId = Number(form.category_id)
    if (!categoryId || Number.isNaN(categoryId)) {
      ElMessage.error('请选择圈子分类')
      submitting.value = false
      return
    }

    const isPrivate = !!form.is_private

    const submitData: CreateCircleData = {
      name: form.name.trim(),
      description: form.description.trim(),
      category_id: categoryId,
      is_public: !isPrivate,
      need_approval: isPrivate,
      rules: form.rules?.trim() || ''
    }

    if (!submitData.rules) {
      delete submitData.rules
    }

    // 上传封面到 COS
    if (coverFileList.value.length > 0) {
      const fileItem = coverFileList.value[0]
      if (fileItem.raw) {
        const uploadResult = await uploadService.uploadImage(fileItem.raw as File, 'circle/background')
        submitData.cover_image = uploadResult.image.url
        fileItem.url = uploadResult.image.url
        fileItem.status = 'success'
        Reflect.deleteProperty(fileItem, 'raw')
        form.cover_image = uploadResult.image.url
      } else if (fileItem.url) {
        submitData.cover_image = fileItem.url
      }
    } else if (form.cover_image) {
      submitData.cover_image = form.cover_image
    }

    await createCircle(submitData)
    
    ElMessage.success('圈子创建成功！')
    coverFileList.value = []
    router.push('/circles')
  } catch (error: any) {
    console.error('创建圈子失败:', error)
    ElMessage.error(error.response?.data?.message || '创建圈子失败')
  } finally {
    submitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  if (form.cover_image && form.cover_image.startsWith('blob:')) {
    URL.revokeObjectURL(form.cover_image)
  }
  form.cover_image = ''
  form.category_id = ''
  coverFileList.value = []
}
</script>

<style scoped>
.create-circle-page {
  padding-top: 80px;
}

.create-circle-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.form-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  color: #303133;
}

.cover-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 200px;
  display: flex;
  flex-direction: column;
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
  margin-bottom: 10px;
}

.cover-upload-tip {
  color: #8c939d;
  font-size: 14px;
}

.upload-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.circle-type-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.type-description {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: #f0f9ff;
  border-radius: 4px;
  font-size: 14px;
  color: #409eff;
}

.private-circle-text {
  color: #e6a23c;
}

.help-text {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.tips-card {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
}

.tips-list {
  margin: 0;
  padding-left: 20px;
  color: #606266;
  line-height: 1.8;
}

.tips-list li {
  margin-bottom: 8px;
}

.tips-list li:last-child {
  margin-bottom: 0;
}
</style>
