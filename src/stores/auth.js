import { defineStore } from 'pinia'
import axios from 'axios'
import { message } from 'ant-design-vue'
import router from '../router'

const API_URL = import.meta.env.DEV
  ? import.meta.env.VITE_API_URL_LOCAL
  : import.meta.env.VITE_API_URL_LIVE

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
  }),
  actions: {
    async login(email, password) {
      try {
        const response = await axios.post(`${API_URL}/auth/login`, {
          email,
          password
        })
        
        this.user = {
          id: response.data.id,
          username: response.data.username,
          email: response.data.email,
          joinedDate: response.data.joinedDate,
        }
        this.token = response.data.accessToken
        this.isAuthenticated = true
        
        // Store in localStorage
        localStorage.setItem('token', response.data.accessToken)
        localStorage.setItem('user', JSON.stringify(this.user))
        
        message.success('Login successful')
        return true
      } catch (error) {
        message.error(error.response?.data?.message || 'Login failed')
        return false
      }
    },
    
    async fetchUser() {
      try {
        const response = await axios.get(`${API_URL}/users/me`, {
          headers: {
            'x-access-token': this.token
          }
        })
        
        this.user = {
          id: response.data.id,
          username: response.data.username,
          email: response.data.email
        }
        localStorage.setItem('user', JSON.stringify(this.user))
      } catch (error) {
        this.logout()
      }
    },

    async updatePassword(newPassword) {
      try {
        const response = await axios.put(`${API_URL}/users/password`, {
          password: newPassword
        }, {
          headers: {
            'x-access-token': this.token
          }
        })
        message.success(response.data.message)
        return true
      } catch (error) {
        message.error(error.response?.data?.message || 'Password update failed')
        throw error
      }
    },
    
    logout() {
      this.user = null
      this.token = null
      this.isAuthenticated = false
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    },

    async register(username, email, password) {
      try {
        const response = await axios.post(`${API_URL}/auth/register`, {
          username,
          email,
          password
        })

        this.user = {
          id: response.data.id,
          username: response.data.username,
          email: response.data.email
        }
        this.token = response.data.accessToken
        this.isAuthenticated = true

        // Store in localStorage
        localStorage.setItem('token', response.data.accessToken)
        localStorage.setItem('user', JSON.stringify(this.user))

        message.success('Registration successful')
        return true
      } catch (error) {
        message.error(error.response?.data?.message || 'Registration failed')
        return false
      }
    },

    updateUser(updates) {
      this.user = { ...this.user, ...updates };
      localStorage.setItem('user', JSON.stringify(this.user));
    },
  }
})