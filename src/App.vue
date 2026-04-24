<template>
  <router-view />
  <!-- Initial loading overlay to hide browser loading bar -->
  <div v-if="isLoading" class="app-loading-overlay">
    <div class="loading-content">
      <a-spin size="large" />
    </div>
  </div>
  <a-button
    v-if="showPwaInstallButton"
    type="primary"
    shape="circle"
    size="large"
    class="pwa-install-btn"
    @click="installPwa"
  >
    <template #icon><DownloadOutlined /></template>
  </a-button>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { DownloadOutlined } from '@ant-design/icons-vue';

const showPwaInstallButton = ref(false);
const isLoading = ref(true);
let deferredPrompt = null;

// Hide browser loading bar during initial load
window.addEventListener('load', () => {
  // Delay slightly to ensure everything is ready
  setTimeout(() => {
    isLoading.value = false;
  }, 500);
});

function handlePwaInstallAvailable(event) {
  deferredPrompt = event.detail;
  showPwaInstallButton.value = true;
}

function handlePwaInstalled() {
  showPwaInstallButton.value = false;
  deferredPrompt = null;
}

async function installPwa() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') {
    showPwaInstallButton.value = false;
  }
  deferredPrompt = null;
}

onMounted(() => {
  window.addEventListener('pwa-install-available', handlePwaInstallAvailable);
  window.addEventListener('pwa-installed', handlePwaInstalled);
  
  // Check if already installed
  if (window.matchMedia('display-mode: standalone').matches) {
    showPwaInstallButton.value = false;
  }
});

onUnmounted(() => {
  window.removeEventListener('pwa-install-available', handlePwaInstallAvailable);
  window.removeEventListener('pwa-installed', handlePwaInstalled);
});
</script>

<style>
.app-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #001529;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  color: #ffffff;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

.pwa-install-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

@media (min-width: 768px) {
  .pwa-install-btn {
    display: none;
  }
}
</style>