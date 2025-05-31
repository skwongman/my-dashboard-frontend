<template>
  <div class="login-container">
    <a-card class="login-card" title="Welcome Back" style="width: 400px">
      <a-form
        :model="formState"
        @finish="onFinish"
        class="login-form"
      >
        <a-form-item
          label="Email"
          name="email"
          :rules="[{ required: true, message: 'Please input your email!' }]"
        >
          <a-input 
            v-model:value="formState.email" 
            placeholder="Enter your email"
            class="input-field"
          />
        </a-form-item>

        <a-form-item
          label="Password"
          name="password"
          :rules="[{ required: true, message: 'Please input your password!' }]"
        >
          <a-input-password 
            v-model:value="formState.password" 
            placeholder="Enter your password"
            class="input-field"
          />
        </a-form-item>

        <a-form-item>
          <a-button 
            type="primary" 
            html-type="submit" 
            :loading="loading"
            class="login-button"
          >
            Login
          </a-button>
        </a-form-item>

        <router-link to="/register" class="register-link">
          Don't have an account? Register
        </router-link>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const formState = ref({
  email: '',
  password: ''
})
const loading = ref(false)
const router = useRouter()
const authStore = useAuthStore()

const onFinish = async () => {
  loading.value = true
  const success = await authStore.login(
    formState.value.email, 
    formState.value.password
  )
  loading.value = false
  
  if (success) {
    router.push('/dashboard')
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f0f2f5; /* Ant Design's default background color */
  padding: 20px;
}

.login-card {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 24px;
  transition: transform 0.3s ease;
}

.login-card:hover {
  transform: translateY(-3px);
}

.login-form {
  margin-top: 16px;
}

:deep(.ant-card-head) {
  border-bottom: none;
}

:deep(.ant-card-head-title) {
  font-size: 24px;
  font-weight: 600;
  color: #1f1f1f; /* Ant Design's text color */
  text-align: center;
  padding-bottom: 8px;
}

:deep(.ant-form-item-label > label) {
  color: #595959; /* Ant Design's label color */
  font-weight: 500;
}

.input-field {
  border-radius: 4px;
  background: #ffffff;
  color: #1f1f1f;
  transition: all 0.3s ease;
}

.input-field:hover {
  border-color: #1677ff; /* Ant Design's primary blue */
}

.input-field:focus {
  border-color: #1677ff;
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.2);
}

:deep(.ant-input),
:deep(.ant-input-password .ant-input) {
  background: transparent !important;
  color: #1f1f1f !important;
  border: 1px solid #d9d9d9 !important; /* Ant Design's border color */
  padding: 1px 5px !important;
}

:deep(.ant-input::placeholder),
:deep(.ant-input-password .ant-input::placeholder) {
  color: #bfbfbf !important; /* Ant Design's placeholder color */
}

:deep(.ant-input-password) {
  background: transparent !important;
  padding: 0 !important;
  border: 1px solid #d9d9d9 !important;
}

.login-button {
  width: 100%;
  height: 40px;
  border-radius: 4px;
  background: #1677ff; /* Ant Design's primary blue */
  color: #ffffff;
  font-weight: 600;
  border: none;
  transition: all 0.3s ease;
}

.login-button:hover {
  background: #40a9ff; /* Ant Design's hover blue */
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.register-link {
  color: #1677ff; /* Ant Design's primary blue */
  text-decoration: none;
  display: block;
  text-align: center;
  margin-top: 16px;
  transition: color 0.3s ease;
}

.register-link:hover {
  color: #40a9ff; /* Ant Design's hover blue */
  text-decoration: underline;
}
</style>