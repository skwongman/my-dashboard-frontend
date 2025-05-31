<template>
  <a-layout style="min-height: 100vh">
    <!-- Sidebar -->
    <a-layout-sider
      v-model:collapsed="collapsed"
      :trigger="null"
      collapsible
      theme="dark"
    >
      <div class="logo">
        <h2 class="text-white text-start py-4">My App</h2>
      </div>
      <a-menu theme="dark" mode="inline" :selected-keys="[currentMenu]">
        <a-menu-item key="dashboard" @click="currentMenu = 'dashboard'; collapsed = true">
        <dashboard-outlined />
        <span>Dashboard</span>
      </a-menu-item>
      <a-menu-item key="weather" @click="currentMenu = 'weather'; collapsed = true">
        <cloud-outlined />
        <span>Weather</span>
      </a-menu-item>
      <a-menu-item key="hknews" @click="currentMenu = 'hknews'; collapsed = true">
        <read-outlined />
        <span>HK News</span>
      </a-menu-item>
      <a-menu-item key="jpnews" @click="currentMenu = 'jpnews'; collapsed = true">
        <notification-outlined />
        <span>JP News</span>
      </a-menu-item>
      </a-menu>
    </a-layout-sider>

    <!-- Overlay for mobile sidebar -->
    <div
      v-if="!collapsed"
      class="mobile-sider-overlay"
      @click="collapsed = true"
    ></div>

    <a-layout>
      <!-- Header -->
      <a-layout-header class="bg-white shadow-sm">
        <div class="header-content text-white">
          <menu-unfold-outlined
            v-if="collapsed"
            class="trigger"
            @click="collapsed = !collapsed"
          />
          <menu-fold-outlined
            v-else
            class="trigger"
            @click="collapsed = !collapsed"
          />
          <div class="flex items-center space-x-4 ml-auto">
            <a-avatar :src="user.avatar" size="large" />
            <span class="font-semibold text-white">{{ user.username }}</span>
            <a-button type="primary" danger @click="logout">Logout</a-button>
          </div>
        </div>
      </a-layout-header>

      <!-- Content -->
      <a-layout-content class="p-6 bg-gray-100">
        <template v-if="currentMenu === 'dashboard'">
          <!-- Welcome Card -->
          <a-card class="mb-6">
            <div class="flex items-center space-x-4">
              <div>
                <h2 class="text-2xl font-semibold">
                  Welcome back, {{ user.username }}!
                </h2>
              </div>
            </div>
          </a-card>

          <!-- Enhanced User Profile Card -->
          <a-card title="User Profile" class="profile-card">
            <div class="flex flex-col md:flex-row gap-6">
              <!-- Profile Picture Section -->
              <div class="flex flex-col items-center">
                <a-avatar
                  :src="user.avatar"
                  size="large"
                  class="mb-4 border-4 border-blue-500 shadow-lg"
                />
                <a-upload
                  :before-upload="beforeUpload"
                  accept="image/*"
                  :show-upload-list="false"
                  @change="handleAvatarChange"
                >
                  <a-button type="primary" shape="round">
                    <upload-outlined /> Change Avatar
                  </a-button>
                </a-upload>
              </div>

              <!-- Profile Details Section -->
              <div class="flex-1">
                <a-tabs default-active-key="view">
                  <!-- View Mode -->
                  <a-tab-pane key="view" tab="View Profile">
                    <a-descriptions
                      bordered
                      layout="vertical"
                      class="bg-gray-50 p-4 rounded-lg"
                    >
                      <a-descriptions-item label="Username">
                        <span class="font-semibold text-blue-600">{{
                          user.username
                        }}</span>
                      </a-descriptions-item>
                      <a-descriptions-item label="Email">
                        <span class="font-semibold text-blue-600">{{
                          user.email
                        }}</span>
                      </a-descriptions-item>
                      <a-descriptions-item label="Joined">
                        <span class="font-semibold text-blue-600">{{
                          user.joinedDate
                        }}</span>
                      </a-descriptions-item>
                    </a-descriptions>
                  </a-tab-pane>

                  <!-- Edit Mode -->
                  <a-tab-pane key="edit" tab="Edit Profile">
                    <a-form
                      :model="form"
                      layout="vertical"
                      @finish="saveProfile"
                    >
                      <a-form-item label="Username" name="username">
                        <a-input
                          v-model:value="form.username"
                          placeholder="Enter username"
                        />
                      </a-form-item>
                      <a-form-item label="Password" name="password">
                        <a-input-password
                          v-model:value="form.password"
                          placeholder="Enter new password"
                        />
                      </a-form-item>
                      <a-form-item>
                        <a-button
                          type="primary"
                          html-type="submit"
                          shape="round"
                          >Save Changes</a-button
                        >
                      </a-form-item>
                    </a-form>
                  </a-tab-pane>
                </a-tabs>
              </div>
            </div>
          </a-card>
        </template>
        <Weather v-else-if="currentMenu === 'weather'" />
        <JPNews v-else-if="currentMenu === 'jpnews'" />
        <HKNews v-else-if="currentMenu === 'hknews'" />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { ref, computed, reactive, watch, onMounted, onUnmounted } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "../stores/auth"
import { message } from "ant-design-vue"
import {
  DashboardOutlined,
  UserOutlined,
  SettingOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  MessageOutlined,
  TeamOutlined,
  UploadOutlined,
  CloudOutlined,
  ReadOutlined,
  NotificationOutlined,
} from "@ant-design/icons-vue"
import Weather from "../components/Weather.vue"
import JPNews from "../components/JPNews.vue"
import HKNews from "../components/HKNews.vue"

const authStore = useAuthStore()
const router = useRouter()
const collapsed = ref(true)
const currentMenu = ref(localStorage.getItem('currentMenu') || "dashboard")

watch(currentMenu, (val) => {
  localStorage.setItem('currentMenu', val)
})

const user = computed(() => ({
  ...authStore.user,
  avatar:
    authStore.user.avatar ||
    "https://i.pravatar.cc/150?u=" + authStore.user.email,
  joinedDate: authStore.user.joinedDate || new Date().toLocaleDateString(),
  bio: authStore.user.bio || ""
}))

const form = reactive({
  username: user.value.username,
  password: ""
})

watch(
  () => user.value.username,
  (newUsername) => {
    form.username = newUsername
  }
)

const beforeUpload = (file) => {
  const isImage = file.type.startsWith("image/")
  if (!isImage) {
    message.error("You can only upload image files!")
  }
  return isImage
}

const handleAvatarChange = ({ file }) => {
  if (file.status === "done" || file.status === "uploading") {
    const reader = new FileReader()
    reader.onload = (e) => {
      authStore.updateUser({ avatar: e.target.result })
      message.success("Avatar updated successfully")
    }
    reader.readAsDataURL(file.originFileObj)
  }
}

const saveProfile = async () => {
  try {
    // Update username if changed
    if (form.username !== user.value.username) {
      const res = await fetch("https://mydashboardapi.jprogrammer.online/api/users/username", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authStore.token}`
        },
        body: JSON.stringify({ username: form.username })
      })
      if (!res.ok) throw new Error("Failed to update username")
      const data = await res.json()
      authStore.updateUser({ username: data.user.username })
      message.success("Username updated successfully")
    }

    // Update password if provided
    if (form.password) {
      const res = await fetch("https://mydashboardapi.jprogrammer.online/api/users/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authStore.token}`
        },
        body: JSON.stringify({ password: form.password })
      })
      if (!res.ok) throw new Error("Failed to update password")
      message.success("Password updated successfully")
      form.password = ""
    }
  } catch (err) {
    message.error(err.message || "Update failed")
  }
}

const logout = () => {
  authStore.logout()
  message.success("Logged out successfully")
  router.push("/login")
}

// watch(
//   () => currentMenu.value,
//   (val) => {
//     if (val === "jpnews" || val === "hknews") {
//       document.body.style.overflow = "hidden"
//     } else {
//       document.body.style.overflow = ""
//     }
//   },
//   { immediate: true }
// )

onUnmounted(() => {
  document.body.style.overflow = ""
})
</script>

<style>
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
  padding: 0 20px;
}

.trigger {
  font-size: 18px;
  cursor: pointer;
  transition: color 0.3s;
}

.trigger:hover {
  color: #1890ff;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stats-card {
  position: relative;
  overflow: hidden;
  transition: transform 0.3s;
}

.stats-card:hover {
  transform: translateY(-5px);
}

.stat-icon {
  position: absolute;
  right: 20px;
  top: 20px;
  font-size: 40px;
  opacity: 0.1;
}

.profile-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.profile-card .ant-card-head {
  background: #1890ff;
  color: white;
  border-radius: 12px 12px 0 0;
}
</style>

<style scoped>
@import "https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css";
@import "https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css";

@media (max-width: 600px) {
  .ant-layout-sider {
    position: absolute !important;
    z-index: 1000;
    height: 100vh !important;
    left: -100vw;
    transition: left 0.3s;
    width: 220px !important;
    min-width: 0 !important;
    max-width: 80vw !important;
  }
  .ant-layout-sider-collapsed {
    left: -100vw !important;
  }
  .ant-layout-sider:not(.ant-layout-sider-collapsed) {
    left: 0 !important;
  }
  .header-content {
    flex-direction: row !important;
    align-items: center !important;
    height: auto;
    padding: 10px 8px;
    gap: 8px;
    width: 100%;
  }
  .logo {
    padding: 0 8px;
    height: 48px;
  }
  .ant-layout-header {
    padding: 0 4px !important;
    min-height: 56px !important;
    height: auto !important;
  }
  .ant-layout-content {
    padding: 8px !important;
  }
  .profile-card,
  .ant-card {
    margin: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    padding: 0 !important;
  }
  .profile-card .ant-card-head {
    border-radius: 0 !important;
    font-size: 1.1rem;
    padding: 10px 8px !important;
  }
  .flex,
  .flex-col,
  .md\:flex-row {
    flex-direction: column !important;
    gap: 10px !important;
  }
  /* REMOVE the .ant-avatar and .ant-btn rules below! */
  /*
  .ant-avatar {
    width: 60px !important;
    height: 60px !important;
    min-width: 60px !important;
    min-height: 60px !important;
  }
  .ant-btn {
    width: 100%;
    font-size: 1rem;
    height: 40px;
  }
  */
  .ant-tabs-nav {
    flex-wrap: wrap;
    font-size: 1rem;
  }
  .ant-descriptions {
    padding: 0 !important;
  }
  .ant-descriptions-item-label,
  .ant-descriptions-item-content {
    font-size: 1rem !important;
    padding: 4px 0 !important;
  }
  .ant-form-item {
    margin-bottom: 12px !important;
  }
  .ant-upload {
    width: 100%;
  }
  .mobile-sider-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.35);
    z-index: 999;
    transition: opacity 0.2s;
  }
  .header-content .trigger {
    margin-right: 8px;
  }
  .header-content .flex {
    flex-direction: row !important;
    align-items: center !important;
    gap: 8px !important;
    margin-left: auto;
  }
  .header-content .ant-avatar {
    margin-bottom: 0 !important;
  }
  .header-content .ant-btn {
    margin-left: 0 !important;
    width: auto !important; /* Prevent full width for logout */
  }
}
</style>
