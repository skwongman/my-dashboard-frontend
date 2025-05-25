<template>
  <a-card title="香港新聞" class="mb-6 profile-card">
    <template #extra>
      <a-button
        type="text"
        :loading="loading"
        @click="refreshNews"
        title="再讀取"
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
            <div class="text-xl font-semibold mb-1">最新的香港新聞</div>
            <div class="text-gray-500 text-sm">
              檢查來自可靠來源的最新新聞
            </div>
          </div>
        </div>
        <div class="flex flex-col items-end">
          <span class="text-xs text-gray-400">最終更新:</span>
          <span class="font-medium text-gray-600 text-sm">{{
            updateTime
          }}</span>
        </div>
      </div>
      <div v-if="news.length === 0 && loading" class="news-loading">
        讀取中...
      </div>
      <div v-else>
        <div class="news-grid">
          <div v-for="item in news" :key="item.id" class="news-item">
            <a
              :href="item.link"
              target="_blank"
              rel="noopener"
              class="news-link"
            >
              <img :src="item.thumbUrl" alt="thumbnail" class="news-thumb" />
              <div class="news-content">
                <div class="news-headline">{{ item.title }}</div>
                <div class="news-date">{{ item.createdDatetime }}</div>
              </div>
            </a>
          </div>
        </div>
        <div v-if="loading && news.length > 0" class="news-loading">
          進一步讀取中...
        </div>
        <div v-if="noMore" class="news-loading">所有新聞已讀取完畢</div>
      </div>
    </div>
  </a-card>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue"
import { ReloadOutlined } from "@ant-design/icons-vue"

const news = ref([])
const loading = ref(false)
const updateTime = ref("")
const page = ref(0)
const noMore = ref(false)
const scrollContainer = ref(null)

const fetchNews = async (reset = false) => {
  if (loading.value || noMore.value) return
  loading.value = true
  try {
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=香港&language=zh&apiKey=YOUR_API_KEY&page=${page.value}`
    )
    const data = await res.json()
    if (reset) {
      news.value = data.articles
    } else {
      news.value = [...news.value, ...data.articles]
    }
    if (!data.articles || data.articles.length === 0) {
      noMore.value = true
    }
    const now = new Date()
    updateTime.value = `${now.getFullYear()}/${
      now.getMonth() + 1
    }/${now.getDate()} ${now.getHours()}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`
  } catch (e) {
    if (reset) news.value = []
    noMore.value = true
    updateTime.value = ""
  } finally {
    loading.value = false
  }
}

const refreshNews = () => {
  page.value = 0
  noMore.value = false
  fetchNews(true)
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = 0
  }
}

const handleScroll = () => {
  const el = scrollContainer.value
  if (!el || loading.value || noMore.value) return
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
    page.value += 1
    fetchNews()
  }
}

onMounted(() => {
  fetchNews(true)
  if (scrollContainer.value) {
    scrollContainer.value.addEventListener("scroll", handleScroll)
  }
})

onBeforeUnmount(() => {
  if (scrollContainer.value) {
    scrollContainer.value.removeEventListener("scroll", handleScroll)
  }
})
</script>

<style scoped>
.news-scroll-container {
  max-height: 700px;
  overflow-y: auto;
  padding-right: 18px;
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
}

.news-date {
  font-size: 0.92rem;
  color: #888;
  letter-spacing: 0.02em;
  margin-top: auto;
}
</style>