<!-- src/views/Register.vue -->
<template>
  <div class="register-container">
    <a-card title="Register" style="width: 400px">
      <a-form
        :model="formState"
        @finish="onFinish"
      >
        <a-form-item
          label="Username"
          name="username"
          :rules="[{ required: true, message: 'Please input your username!' }]"
        >
          <a-input v-model:value="formState.username" />
        </a-form-item>

        <a-form-item
          label="Email"
          name="email"
          :rules="[{ required: true, type: 'email', message: 'Please input a valid email!' }]"
        >
          <a-input v-model:value="formState.email" />
        </a-form-item>

        <a-form-item
          label="Password"
          name="password"
          :rules="[{ required: true, message: 'Please input your password!' }]"
        >
          <a-input-password v-model:value="formState.password" />
        </a-form-item>

        <a-form-item>
          <a-button type="primary" html-type="submit" :loading="loading">Register</a-button>
        </a-form-item>

        <router-link to="/login">Already have an account? Login</router-link>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { message } from 'ant-design-vue'

const formState = ref({
  username: '',
  email: '',
  password: ''
})
const loading = ref(false)
const router = useRouter()
const authStore = useAuthStore()

const onFinish = async () => {
  loading.value = true
  const success = await authStore.register(
    formState.value.username,
    formState.value.email,
    formState.value.password
  )
  loading.value = false
  
  if (success) {
    router.push('/login')
  }
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
</style>