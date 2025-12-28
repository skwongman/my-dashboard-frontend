<template>
  <div>
    <a-card title="香港新聞" class="mb-6 profile-card">
      <template #extra>
        <a-button
          type="text"
          :loading="loading"
          @click="refreshNews"
          title="重新整理"
          class="!p-0 text-white"
        >
          <ReloadOutlined />
        </a-button>
      </template>
      <div ref="scrollContainer" class="news-scroll-container">
        <div
          class="flex flex-col md:flex-row items-center justify-between gap-6 mb-6 p-6 bg-white rounded-xl shadow border border-gray-100"
        >
          <div class="flex items-center gap-5">
            <span class="text-4xl">📰</span>
            <div>
              <div class="text-xl font-semibold mb-1">最新香港新聞</div>
              <div class="text-gray-500 text-sm">
                查看來自可信來源的最新香港新聞
              </div>
            </div>
          </div>
          <div class="flex flex-col items-end">
            <span class="text-xs text-gray-400">最後更新：</span>
            <span class="font-medium text-gray-600 text-sm">
              <template v-if="loading && news.length === 0">
                <span class="inline-block align-middle" style="width: 100px; height: 18px; background: #e0e0e0; border-radius: 4px; animation: skeleton-loading 1.2s infinite linear alternate;"></span>
              </template>
              <template v-else>
                {{ updateTime }}
              </template>
            </span>
          </div>
        </div>
        <!-- Skeleton loading effect -->
        <div v-if="news.length === 0 && loading" class="news-skeletons">
          <div v-for="n in 12" :key="n" class="news-item skeleton">
            <div class="news-thumb skeleton-thumb"></div>
            <div class="news-content">
              <div class="news-headline skeleton-line"></div>
              <div class="news-date skeleton-line short"></div>
            </div>
          </div>
        </div>
        <div v-else>
          <div v-if="error" class="news-loading text-red-500">{{ error }}</div>
          <div class="news-grid">
            <div v-for="(item, idx) in news" :key="item.link + idx" class="news-item" @click="openNewsModal(item)">
              <img
                :src="getValidImage(item, idx)"
                alt="thumbnail"
                class="news-thumb"
              />
              <div class="news-content">
                <div class="news-headline">{{ item.title }}</div>
                <div class="news-date">{{ item.pubDate }}</div>
              </div>
            </div>
            </div>
            <div
              v-if="loading && news.length > 0"
              class="news-skeletons"
              style="margin-top: 24px;"
              >
              <div v-for="n in 12" :key="'loading-' + n" class="news-item skeleton">
                <div class="news-thumb skeleton-thumb"></div>
                <div class="news-content">
                <div class="news-headline skeleton-line"></div>
                <div class="news-date skeleton-line short"></div>
                </div>
              </div>
            </div>
          <div v-if="loading && news.length > 0" class="news-loading">進一步載入中...</div>
          <div v-if="noMore && !loading" class="news-loading">已載入全部新聞</div>
          <div v-if="!loading && news.length === 0 && !error" class="news-loading">
            沒有新聞
          </div>
        </div>
      </div>
    </a-card>

    <a-modal
      v-if="isModalVisible"
      v-model:open="isModalVisible"
      :key="selectedNews ? selectedNews.link : ''"
      title="新聞詳情"
      @ok="isModalVisible = false"
      :width="1600"
      centered
      :bodyStyle="{ 'max-height': '80vh', 'overflow-y': 'auto' }"
    >
      <div v-if="selectedNews">
        <img :src="getValidImage(selectedNews, 0)" alt="thumbnail" class="w-full h-auto object-cover rounded-lg mb-4" />
        <h2 class="text-2xl font-semibold mb-2">{{ selectedNews.title }}</h2>
        <div v-html="selectedNews.newsContent" class="text-gray-600 mb-4 news-modal-content"></div>
        <a :href="selectedNews.link" target="_blank" rel="noopener noreferrer">閱讀原文</a>
      </div>
    </a-modal>

    <a-button
      v-show="showBackToTop"
      class="back-to-top-btn"
      type="primary"
      shape="circle"
      @click="scrollToTop"
      title="回到頂部"
    >
      <template #icon>
        <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
          <path d="M12 19V5M12 5L6 11M12 5l6 6" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </template>
    </a-button>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue"
import { ReloadOutlined } from "@ant-design/icons-vue"

const news = ref([])
const loading = ref(false)
const updateTime = ref("")
const error = ref("")
const scrollContainer = ref(null)
const page = ref(0)
const noMore = ref(false)
const showBackToTop = ref(false)
const isModalVisible = ref(false);
const selectedNews = ref(null);

const openNewsModal = (newsItem) => {
  selectedNews.value = newsItem;
  isModalVisible.value = true;
};

// 一組有效的隨機圖片（固定圖片來源，確保可用）
const randomImages = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80"
]

function extractImageAndSummary(description) {
  // Yahoo News RSS: <img ...> summary text
  const imgMatch = description.match(/<img[^>]+src="([^"]+)"/)
  const image = imgMatch ? imgMatch[1] : ""
  // Remove img tag and get summary
  const summary = description.replace(/<img[^>]*>/, "").replace(/<\/?[^>]+(>|$)/g, "").trim()
  return { image, summary }
}

// 確保圖片有效，否則用隨機圖片
function getValidImage(item, idx) {
  if (item.image && item.image.startsWith("http")) {
    return item.image
  }
  return randomImages[idx % randomImages.length]
}

// 取得一頁新聞（每頁20條）
const fetchNews = async (reset = false) => {
  if (loading.value || noMore.value) return
  loading.value = true
  error.value = ""
  try {
    const pageSize = 12
    const pageNo = page.value + 1
    const apiUrl = `https://newsapi1.now.com/pccw-news-api/api/getNewsListv2?category=119&pageNo=${pageNo}&pageSize=${pageSize}`
    // Delay 1s before fetching
    await new Promise(resolve => setTimeout(resolve, 500))
    const res = await fetch(apiUrl)
    if (!res.ok) throw new Error("無法獲取香港新聞")
    const items = await res.json()
    // items is an array
    const pageItems = items.map(item => ({
      title: item.title || "",
      link: `https://news.now.com/home/local/player?newsId=${item.newsId}`,
      pubDate: item.dateDiffString || "",
      image: item.imageUrl || "",
      newsContent: item.newsContent ? item.newsContent.map(c => c.value).join('') : "",
      summary: item.summary
        ? item.summary.replace(/<\/?[^>]+(>|$)/g, "").trim()
        : ""
    }))
    if (reset) {
      news.value = pageItems
    } else {
      news.value = [...news.value, ...pageItems]
    }
    if (items.length < pageSize) {
      noMore.value = true
    }
    const now = new Date()
    updateTime.value = `${now.getFullYear()}/${
      now.getMonth() + 1
    }/${now.getDate()} ${now.getHours()}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`
  } catch (err) {
    error.value = err.message || "獲取新聞時發生錯誤"
    if (reset) news.value = []
    noMore.value = true
    updateTime.value = ""
  } finally {
    loading.value = false
  }
}

const refreshNews = async () => {
  page.value = 0
  noMore.value = false
  error.value = ""
  // Clear news immediately to trigger skeleton
  news.value = []
  updateTime.value = ""
  await fetchNews(true)
  window.scrollTo({ top: 0, behavior: "smooth" })
}

const handleWindowScroll = () => {
  if (loading.value || noMore.value) return
  const scrollY = window.scrollY || window.pageYOffset
  const viewportHeight = window.innerHeight
  const fullHeight = document.documentElement.scrollHeight
  showBackToTop.value = scrollY > 300
  if (scrollY + viewportHeight >= fullHeight - 100) {
    page.value += 1
    fetchNews()
  }
}

onMounted(() => {
  fetchNews(true)
  window.addEventListener("scroll", handleWindowScroll)
})

onBeforeUnmount(() => {
  window.removeEventListener("scroll", handleWindowScroll)
})

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" })
}
</script>

<style scoped>
.news-scroll-container {
  box-sizing: border-box;
}

.news-loading {
  text-align: center;
  color: #888;
  font-size: 1.1rem;
  margin: 32px 0;
}

.news-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 24px;
  width: 100%;
}

@media (max-width: 1400px) {
  .news-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 1100px) {
  .news-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 900px) {
  .news-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .news-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .news-scroll-container {
    padding-right: 0;
    max-height: none;
  }

  .news-item {
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    margin-bottom: 12px;
  }

  .news-thumb {
    height: 180px;
    min-height: 120px;
    max-height: 200px;
  }

  .news-content {
    padding: 10px 12px 10px 12px;
  }

  .news-headline {
    font-size: 1.15rem;
    min-height: 2.2em;
    margin-bottom: 6px;
  }

  .news-date {
    font-size: 1rem;
  }

  .profile-card {
    padding: 0 !important;
  }

  .ant-card-head-title {
    font-size: 1.2rem !important;
  }

  .ant-card {
    font-size: 1rem;
  }
}

.news-item {
  background: #fafbfc;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  transition: box-shadow 0.2s, transform 0.2s;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  cursor: pointer;
}

.news-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px) scale(1.01);
}

.news-link {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: inherit;
  height: 100%;
}

.news-thumb {
  width: 100%;
  height: 300px;
  object-fit: cover;
  background: #f5f5f5;
}

.news-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 14px 16px 12px 16px;
}

.news-headline {
  font-size: 1.05rem;
  font-weight: 500;
  margin-bottom: 8px;
  color: #222;
  line-height: 1.4;
  min-height: 2.8em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.news-date {
  font-size: 0.92rem;
  color: #888;
  letter-spacing: 0.02em;
  margin-top: auto;
}

.news-summary {
  font-size: 0.95rem;
  color: #444;
  margin-top: 8px;
  line-height: 1.5;
  min-height: 2.2em;
  max-height: 4.4em;
  overflow: hidden;
  text-overflow: ellipsis;
}

.back-to-top-btn {
  position: fixed;
  right: 32px;
  bottom: 32px;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  transition: opacity 0.2s;
  opacity: 0.85;
  width: 56px;
  height: 56px;
  font-size: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.back-to-top-btn:hover {
  opacity: 1;
}

.news-skeletons {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 24px;
  width: 100%;
}
@media (max-width: 1400px) {
  .news-skeletons {
    grid-template-columns: repeat(4, 1fr);
  }
}
@media (max-width: 1100px) {
  .news-skeletons {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 900px) {
  .news-skeletons {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 600px) {
  .news-skeletons {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
.skeleton {
  background: #f4f4f4;
  border-radius: 10px;
  overflow: hidden;
  animation: skeleton-loading 1.2s infinite linear alternate;
}
.skeleton-thumb {
  width: 100%;
  height: 300px;
  background: #e0e0e0;
}
.skeleton-line {
  height: 20px;
  background: #e0e0e0;
  margin: 16px 0 8px 0;
  border-radius: 4px;
}
.skeleton-line.short {
  width: 60%;
  height: 16px;
  margin: 0 0 12px 0;
}
@keyframes skeleton-loading {
  0% {
    background-color: #f4f4f4;
  }
  100% {
    background-color: #e0e0e0;
  }
}
</style>

<style>
.news-modal-content * {
  font-size: 1.2rem !important;
  line-height: 1.7 !important;
}
</style>