<template>
  <div class="non-edu-complete">
    <div class="complete-container">
      <el-card class="complete-card">
        <template #header>
          <div class="card-header">
            <h2>完成账号设置</h2>
            <p v-if="verificationInfo">邮箱：{{ verificationInfo.email }}</p>
          </div>
        </template>

        <div v-if="loading" class="loading-state">
          <el-skeleton :rows="4" animated />
        </div>

        <div v-else-if="error" class="error-state">
          <el-result
            icon="error"
            title="链接无效或已过期"
            :sub-title="error"
          >
            <template #extra>
              <el-button type="primary" @click="goRegister">重新注册</el-button>
            </template>
          </el-result>
        </div>

        <div v-else>
          <div class="info-block">
            <el-alert
              type="success"
              :closable="false"
              show-icon
            >
              验证成功！请设置账户信息完成注册。
            </el-alert>
          </div>

          <el-form
            v-if="verificationInfo"
            ref="formRef"
            :model="form"
            :rules="rules"
            label-width="90px"
            class="complete-form"
          >
            <el-form-item label="邮箱">
              <el-input :model-value="verificationInfo.email" disabled />
            </el-form-item>

            <el-form-item label="用户名" prop="username">
              <el-input v-model="form.username" placeholder="请输入用户名" />
            </el-form-item>

            <el-form-item label="密码" prop="password">
              <el-input
                v-model="form.password"
                type="password"
                placeholder="请输入密码"
                show-password
              />
            </el-form-item>

            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="form.confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                show-password
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :loading="submitting" @click="submit">
                完成设置
              </el-button>
              <el-button @click="goHome">返回首页</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { authService } from '@/services'
import { useUserStore } from '@/stores/user'

interface VerificationInfo {
  email: string
  requestedUsername?: string
  expiresAt: string
}

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const submitting = ref(false)
const error = ref<string | null>(null)
const token = ref('')
const verificationInfo = ref<VerificationInfo | null>(null)

const formRef = ref()
const form = reactive({
  username: '',
  password: '',
  confirmPassword: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在3到20个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (_rule: any, value: string, callback: (error?: Error) => void) => {
        if (value !== form.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const fetchVerificationInfo = async (rawToken: string) => {
  try {
    const data = await authService.fetchNonEduVerification(rawToken)
    verificationInfo.value = data
    form.username = data.requestedUsername || ''
  } catch (err: any) {
    error.value = err?.response?.data?.error || '验证码已失效，请重新申请'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const tokenParam = (route.query.token as string) || ''
  if (!tokenParam) {
    error.value = '链接缺少验证信息，请重新申请'
    loading.value = false
    return
  }
  token.value = tokenParam
  fetchVerificationInfo(tokenParam)
})

const submit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch {
    return
  }

  submitting.value = true
  try {
    const response = await authService.completeNonEduRegistration({
      token: token.value,
      username: form.username.trim(),
      password: form.password
    })

    userStore.token = response.accessToken
    userStore.user = response.user
    localStorage.setItem('token', response.accessToken)
    if (response.refreshToken) {
      localStorage.setItem('refreshToken', response.refreshToken)
    }
    localStorage.setItem('user', JSON.stringify(response.user))

    ElMessage.success('账号设置成功，欢迎加入校园社区平台！')
    router.push('/')
  } catch (err: any) {
    const message = err?.response?.data?.error || err?.message || '账号设置失败，请重试'
    ElMessage.error(message)
  } finally {
    submitting.value = false
  }
}

const goRegister = () => {
  router.push('/register')
}

const goHome = () => {
  router.push('/')
}
</script>

<style scoped>
.non-edu-complete {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.complete-container {
  width: 520px;
  max-width: 100%;
}

.complete-card {
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.card-header {
  text-align: center;
}

.card-header h2 {
  margin: 0;
  color: #303133;
}

.card-header p {
  margin: 6px 0 0;
  color: #909399;
  font-size: 13px;
}

.loading-state,
.error-state {
  padding: 20px 0;
}

.info-block {
  margin-bottom: 20px;
}

.complete-form {
  margin-top: 10px;
}
</style>
