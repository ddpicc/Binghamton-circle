<template>
  <div class="login">
    <div class="login-container">
      <el-card class="login-card">
        <template #header>
          <div class="login-header">
            <h2>邮箱验证码登录</h2>
            <p>没有账号会自动注册并完成邮箱认证</p>
          </div>
        </template>

        <el-form :model="form" :rules="rules" ref="formRef" label-width="0">
          <el-form-item prop="email">
            <el-input v-model="form.email" placeholder="请输入邮箱（如 abc@binghamton.edu）" />
          </el-form-item>

          <el-form-item prop="code">
            <div class="code-row">
              <el-input v-model="form.code" placeholder="请输入6位验证码" />
              <el-button :loading="sendingCode" :disabled="countdown > 0" @click="handleSendCode">
                {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
              </el-button>
            </div>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleSubmit" :loading="loading" style="width: 100%">
              登录 / 注册
            </el-button>
          </el-form-item>
        </el-form>

        <div class="login-footer">
          <div class="footer-links">
            <el-link @click="$router.push('/')">返回首页</el-link>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { authService } from '@/services/auth'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref()

const form = reactive({
  email: '',
  code: ''
})

const loading = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)
let timer: number | null = null

const rules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码长度必须为6位', trigger: 'blur' }
  ]
}

const handleSendCode = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validateField('email')
    sendingCode.value = true
    await authService.sendEmailVerification(form.email.trim())
    ElMessage.success('验证码已发送')
    countdown.value = 60
    if (timer) window.clearInterval(timer)
    timer = window.setInterval(() => {
      countdown.value -= 1
      if (countdown.value <= 0 && timer) {
        window.clearInterval(timer)
        timer = null
      }
    }, 1000)
  } catch (error: any) {
    ElMessage.error(error || '发送验证码失败')
  } finally {
    sendingCode.value = false
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    loading.value = true
    await userStore.loginWithEmailCode(form.email.trim(), form.code.trim())
    ElMessage.success('登录成功')
    router.push('/')
  } catch (error: any) {
    ElMessage.error(error || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--primary-color) 0%, #667eea 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.login::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  pointer-events: none;
}

.login-container {
  width: 100%;
  max-width: 420px;
  position: relative;
  z-index: 1;
}

.login-card {
  border-radius: var(--border-radius-large);
  box-shadow: var(--shadow-dark);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
}

.login-header {
  text-align: center;
}

.login-header h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 700;
}

.login-header p {
  margin: 8px 0 0;
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.code-row {
  display: flex;
  gap: 12px;
  width: 100%;
}

.code-row .el-input {
  flex: 1;
}

.login-footer {
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.875rem;
  padding-top: 20px;
}

.footer-links {
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .login {
    padding: 16px;
  }
}
</style>
