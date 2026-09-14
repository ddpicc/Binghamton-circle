<template>
  <div class="register">
    <div class="register-container">
      <el-card class="register-card">
        <template #header>
          <div class="register-header">
            <h2>邮箱注册</h2>
            <p>首次必须通过校园邮箱验证码创建账号</p>
          </div>
        </template>

        <el-steps :active="activeStep" finish-status="success" align-center>
          <el-step title="邮箱验证" />
          <el-step title="完成注册" />
        </el-steps>

        <div v-if="activeStep === 0" class="step-content">
          <el-form :model="emailForm" :rules="emailRules" ref="emailFormRef" label-width="90px">
            <el-form-item label="学校邮箱" prop="email">
              <el-input
                v-model="emailForm.email"
                placeholder="请输入邮箱前缀"
              >
                <template #append>
                  <span>@binghamton.edu</span>
                </template>
              </el-input>
              <div class="email-hint">
                <small>完整邮箱地址：{{ fullEmail }}</small>
              </div>
              <div class="non-edu-apply">
                <span>没有学校邮箱？</span>
                <el-button link type="primary" @click="openNonEduDialog">联系管理员申请</el-button>
              </div>
              <div v-if="nonEduRequestInfo" class="non-edu-status">
                <el-alert type="info" :closable="false" show-icon>
                  <template #title>
                    已提交申请：{{ nonEduRequestInfo.personalEmail }}（{{ getNonEduStatusText(nonEduRequestInfo.status) }}）
                  </template>
                  <p class="non-edu-status__text">{{ nonEduStatusMessage }}</p>
                </el-alert>
              </div>
            </el-form-item>

            <el-form-item label="验证码" prop="code">
              <div class="code-row">
                <el-input v-model="emailForm.code" placeholder="请输入6位验证码" />
                <el-button @click="sendCode" :disabled="codeDisabled" :loading="codeLoading">
                  {{ codeText }}
                </el-button>
              </div>
            </el-form-item>

            <el-form-item>
              <div class="step-actions">
                <el-button @click="goToLogin">返回登录</el-button>
                <el-button type="primary" @click="verifyAndLogin" :loading="loading">
                  验证并创建账号
                </el-button>
              </div>
            </el-form-item>
          </el-form>
        </div>

        <div v-if="activeStep === 1" class="step-content">
          <div class="success-content">
            <el-icon size="64" color="#67c23a"><CircleCheckFilled /></el-icon>
            <h3>账号创建成功</h3>
            <p>已完成邮箱验证并登录，建议马上设置登录密码。</p>
            <div class="success-actions">
              <el-button type="primary" @click="goToHome">进入首页</el-button>
              <el-button @click="goToProfile">去个人中心设置密码</el-button>
            </div>
          </div>
        </div>
      </el-card>

      <el-dialog
        v-model="showNonEduDialog"
        title="联系管理员申请"
        width="480px"
        :close-on-click-modal="false"
      >
        <el-form :model="nonEduForm" :rules="nonEduRules" ref="nonEduFormRef" label-width="90px">
          <el-form-item label="常用邮箱" prop="email">
            <el-input v-model="nonEduForm.email" placeholder="请输入常用邮箱" />
          </el-form-item>
          <el-form-item label="申请理由" prop="reason">
            <el-input
              v-model="nonEduForm.reason"
              type="textarea"
              :rows="3"
              placeholder="请说明无法使用学校邮箱的原因（可选）"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="showNonEduDialog = false">取 消</el-button>
            <el-button type="primary" :loading="nonEduSubmitting" @click="submitNonEduRequest">
              提交申请
            </el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { CircleCheckFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { authService } from '@/services'

interface NonEduRequestInfo {
  personalEmail: string
  status: string
}

const NON_EDU_STATUS_TEXT: Record<string, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
  verified: '已完成'
}

const router = useRouter()
const userStore = useUserStore()

const activeStep = ref(0)
const emailFormRef = ref()
const nonEduFormRef = ref()
const showNonEduDialog = ref(false)
const nonEduSubmitting = ref(false)
const nonEduRequestInfo = ref<NonEduRequestInfo | null>(null)

const emailForm = reactive({
  email: '',
  code: ''
})

const nonEduForm = reactive({
  email: '',
  reason: ''
})

const loading = ref(false)
const codeLoading = ref(false)
const codeDisabled = ref(false)
const codeText = ref('发送验证码')
const countdown = ref(0)

const fullEmail = computed(() => (emailForm.email ? `${emailForm.email}@binghamton.edu` : ''))

const nonEduStatusMessage = computed(() => {
  if (!nonEduRequestInfo.value) return ''
  if (nonEduRequestInfo.value.status === 'pending') return '管理员审核中，请留意邮件通知。'
  if (nonEduRequestInfo.value.status === 'approved') return '已发送账号设置邮件，请在 24 小时内完成设置。'
  if (nonEduRequestInfo.value.status === 'verified') return '账号已激活，可直接使用该邮箱登录。'
  if (nonEduRequestInfo.value.status === 'rejected') return '申请被驳回，如需帮助请联系管理员。'
  return ''
})

const emailRules = {
  email: [
    { required: true, message: '请输入邮箱前缀', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9._%+-]+$/, message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码长度为6位', trigger: 'blur' }
  ]
}

const nonEduRules = {
  email: [
    { required: true, message: '请输入常用邮箱', trigger: 'blur' },
    { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '请输入有效的邮箱地址', trigger: ['blur', 'change'] }
  ],
  reason: [
    { max: 300, message: '申请理由不超过300个字符', trigger: 'blur' }
  ]
}

const getNonEduStatusText = (status: string) => NON_EDU_STATUS_TEXT[status] || status

const sendCode = async () => {
  if (!emailFormRef.value) return
  try {
    await emailFormRef.value.validateField(['email'])
    codeLoading.value = true
    await authService.sendEmailVerification(fullEmail.value)
    ElMessage.success('验证码已发送')
    startCountdown()
  } catch (error: any) {
    ElMessage.error(error || '发送验证码失败')
  } finally {
    codeLoading.value = false
  }
}

const startCountdown = () => {
  countdown.value = 60
  codeDisabled.value = true
  const timer = setInterval(() => {
    countdown.value--
    codeText.value = `${countdown.value}s`
    if (countdown.value <= 0) {
      clearInterval(timer)
      codeText.value = '发送验证码'
      codeDisabled.value = false
    }
  }, 1000)
}

const verifyAndLogin = async () => {
  if (!emailFormRef.value) return
  try {
    await emailFormRef.value.validate()
    loading.value = true
    await userStore.loginWithEmailCode(fullEmail.value, emailForm.code)
    ElMessage.success('邮箱验证成功，账号已创建')
    activeStep.value = 1
  } catch (error: any) {
    ElMessage.error(error || '邮箱验证失败')
  } finally {
    loading.value = false
  }
}

const fetchNonEduStatus = async (email: string) => {
  try {
    const data = await authService.getNonEduRequestStatus({ email })
    if (data && data.request) {
      nonEduRequestInfo.value = {
        personalEmail: data.request.personalEmail,
        status: data.status
      }
    }
  } catch (error: any) {
    if (error?.response?.status === 404) {
      nonEduRequestInfo.value = null
    }
  }
}

const openNonEduDialog = () => {
  nonEduForm.email = nonEduRequestInfo.value?.personalEmail || ''
  nonEduForm.reason = ''
  showNonEduDialog.value = true
  nextTick(() => nonEduFormRef.value?.clearValidate())
}

const submitNonEduRequest = async () => {
  if (!nonEduFormRef.value) return
  try {
    await nonEduFormRef.value.validate()
    nonEduSubmitting.value = true
    const payload = {
      username: emailForm.email || 'pending_user',
      email: nonEduForm.email.trim(),
      reason: nonEduForm.reason
    }
    const response = await authService.requestNonEduEmail(payload)
    ElMessage.success(response?.message || '申请已提交，请等待管理员审核')
    showNonEduDialog.value = false
    await fetchNonEduStatus(payload.email)
  } catch (error: any) {
    const errorMessage = error?.response?.data?.error || error?.message || '提交申请失败'
    ElMessage.error(errorMessage)
  } finally {
    nonEduSubmitting.value = false
  }
}

const goToHome = () => router.push('/')
const goToProfile = () => router.push('/profile')
const goToLogin = () => router.push('/login')
</script>

<style scoped>
.register {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.register-container {
  width: 500px;
  max-width: 100%;
}

.register-card {
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.register-header {
  text-align: center;
  margin-bottom: 24px;
}

.register-header h2 {
  margin: 0;
  color: #303133;
  font-size: 28px;
}

.register-header p {
  margin: 8px 0 0;
  color: #909399;
  font-size: 14px;
}

.step-content {
  margin-top: 30px;
}

.email-hint {
  margin-top: 8px;
  color: #909399;
}

.non-edu-apply {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #606266;
}

.non-edu-status {
  margin-top: 12px;
}

.non-edu-status__text {
  margin: 0;
  color: #606266;
  font-size: 13px;
  line-height: 1.6;
}

.code-row {
  display: flex;
  gap: 10px;
  width: 100%;
}

.step-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.success-content {
  text-align: center;
  padding: 40px 0;
}

.success-content h3 {
  margin: 20px 0 10px;
  color: #303133;
  font-size: 24px;
}

.success-content p {
  margin: 0 0 30px;
  color: #909399;
  font-size: 16px;
}

.success-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

@media (max-width: 768px) {
  .step-actions {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .success-actions {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
