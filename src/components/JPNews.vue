<template>
  <div>
    <a-card title="日本ニュース" class="mb-6 profile-card">
      <template #extra>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <span class="text-white">繁體中文</span>
            <a-switch v-model:checked="isTranslateEnabled" />
          </div>
          <a-button
            type="text"
            :loading="loading"
            @click="refreshNews"
            title="再読み込み"
            class="!p-0 text-white"
          >
            <ReloadOutlined />
          </a-button>
        </div>
      </template>
      <div ref="scrollContainer" class="news-scroll-container">
        <div
          class="flex flex-col md:flex-row items-center justify-between gap-6 mb-6 p-6 bg-white rounded-xl shadow border border-gray-100"
        >
          <div class="flex items-center gap-5">
            <span class="text-4xl">📰</span>
            <div>
              <div class="text-xl font-semibold mb-1">最新の日本ニュース</div>
              <div class="text-gray-500 text-sm">
                信頼できるソースからの最新ニュースをチェックしましょう
              </div>
            </div>
          </div>
          <div class="flex flex-col items-end">
            <span class="text-xs text-gray-400">最終更新:</span>
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
            <div v-for="(item, idx) in news" :key="item.id" class="news-item" @click="openNewsModal(item)">
              <img
                :src="getValidImage(item, idx)"
                alt="thumbnail"
                class="news-thumb"
              />
                              <div class="news-content">
                                <div style="position: relative;">
                                  <div class="news-headline">
                                    {{ isTranslateEnabled ? item.translatedTitle || item.title : item.title }}
                                  </div>
                                  <a-spin
                                    v-if="isTranslateEnabled && isTranslating && !item.translatedTitle"
                                    size="small"
                                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255, 255, 255, 0.7); display: flex; align-items: center; justify-content: center;"
                                  />
                                </div>
                                <div class="news-date">{{ item.pubDate }}</div>
                              </div>            </div>
            </div>
            <div
              v-if="loading && news.length > 0"
              class="news-skeletons"
              style="margin-top: 24px;"
              >
              <div v-for="n in 12" :key="'loading-' + n" class="news-item skeleton">
                <div class="news-thumb skeleton-thumb"></div>
                <div classs="news-content">
                <div class="news-headline skeleton-line"></div>
                <div class="news-date skeleton-line short"></div>
                </div>
              </div>
            </div>
          <div v-if="loading && news.length > 0" class="news-loading">さらに読み込み中...</div>
          <div v-if="noMore && !loading" class="news-loading">すべて読み込みました</div>
          <div v-if="!loading && news.length === 0 && !error" class="news-loading">
            ニュースがありません
          </div>
        </div>
      </div>
    </a-card>

    <a-modal
      v-if="isModalVisible"
      v-model:open="isModalVisible"
      :key="selectedNews ? selectedNews.link : ''"
      :wrapClassName="isFullScreen ? 'fullscreen-modal' : ''"
      :footer="null"
      :width="isFullScreen ? '100vw' : 800"
      centered
      :bodyStyle="{ 'max-height': '80vh', 'overflow-y': 'auto' }"
      :closable="false"
    >
      <template #title>
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <span>ニュース詳細</span>
          <div class="custom-modal-controls">
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-500">繁體中文</span>
              <a-switch v-model:checked="isModalTranslateEnabled" :loading="isModalTranslating" />
            </div>
            <a-button type="text" @click="toggleFullScreen">
              <template #icon>
                <component :is="isFullScreen ? FullscreenExitOutlined : FullscreenOutlined" />
              </template>
            </a-button>
            <a-button type="text" @click="isModalVisible = false">
              <template #icon>
                <CloseOutlined />
              </template>
            </a-button>
          </div>
        </div>
      </template>
      <div v-if="selectedNews">
        <img :src="getHighResImage(selectedNews)" alt="thumbnail" class="w-full h-auto object-cover rounded-lg mb-4" />
        <a-spin :spinning="isModalTranslating">
          <h2 class="text-2xl font-semibold mb-2">{{ isModalTranslateEnabled ? selectedNews.translatedTitle || selectedNews.title : selectedNews.title }}</h2>
          <div v-html="isModalTranslateEnabled ? selectedNews.translatedContent || selectedNews.newsContent : selectedNews.newsContent" class="text-gray-600 mb-4 news-modal-content"></div>
        </a-spin>
        <a :href="selectedNews.link" target="_blank" rel="noopener noreferrer">原文を読む</a>
      </div>
    </a-modal>

    <a-button
      v-show="showBackToTop"
      class="back-to-top-btn"
      type="primary"
      shape="circle"
      @click="scrollToTop"
      title="トップに戻る"
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
import { ref, onMounted, onBeforeUnmount, watch } from "vue"
import { ReloadOutlined, FullscreenOutlined, FullscreenExitOutlined, CloseOutlined } from "@ant-design/icons-vue"
import axios from "axios"

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
const isFullScreen = ref(false);
const translate = ref('');
const isTranslateEnabled = ref(false);
const isTranslating = ref(false);
const isModalTranslateEnabled = ref(false);
const isModalTranslating = ref(false);

const translateText = async (text, targetLang) => {
  if (!text) return '';
  try {
    const res = await axios.get('https://translate.googleapis.com/translate_a/single', {
      params: {
        client: 'gtx',
        sl: 'ja',
        tl: targetLang,
        dt: 't',
        q: text,
      },
    });
    return res.data[0].map(item => item[0]).join('');
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text on error
  }
};

const translateAllNews = async () => {
  if (isTranslateEnabled.value) {
    isTranslating.value = true;
    for (const item of news.value) {
      if (!item.translatedTitle) {
        item.translatedTitle = await translateText(item.title, 'zh-TW');
      }
      if (!item.translatedContent) {
        item.translatedContent = await translateText(item.newsContent, 'zh-TW');
      }
    }
    isTranslating.value = false;
  }
};

watch(isTranslateEnabled, (newValue) => {
  localStorage.setItem('jpNewsTranslateEnabled', newValue);
  if (newValue) {
    translateAllNews();
  }
});

watch(isModalTranslateEnabled, async (newValue) => {
  if (newValue && selectedNews.value) {
    if (!selectedNews.value.translatedTitle || !selectedNews.value.translatedContent) {
      isModalTranslating.value = true;
      try {
        if (!selectedNews.value.translatedTitle) {
          selectedNews.value.translatedTitle = await translateText(selectedNews.value.title, 'zh-TW');
        }
        if (!selectedNews.value.translatedContent) {
          selectedNews.value.translatedContent = await translateText(selectedNews.value.newsContent, 'zh-TW');
        }
      } finally {
        isModalTranslating.value = false;
      }
    }
  }
});

const toggleFullScreen = () => {
  isFullScreen.value = !isFullScreen.value;
};

const openNewsModal = (newsItem) => {
  isFullScreen.value = false;
  selectedNews.value = newsItem;
  isModalTranslateEnabled.value = isTranslateEnabled.value;
  isModalVisible.value = true;
};

// 一組の有効なランダム画像（利用可能性を確保するために固定されたソース）
const randomImages = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80"
]

// 画像が有効であることを確認し、無効な場合はランダムな画像を使用します
function getValidImage(item, idx) {
  if (item.image && item.image.startsWith("http")) {
    return item.image
  }
  return randomImages[idx % randomImages.length]
}

// モーダル用に高解像度の画像を取得します
function getHighResImage(item) {
  if (item.image && item.image.startsWith("http")) {
    // Yahoo Japanの画像の場合、クエリパラメータを削除して高解像度版を取得します。
    if (item.image.includes(".yimg.jp")) {
      return item.image.split('?')[0];
    }
    return item.image;
  }
  // フォールバック画像を提供します
  return randomImages[0];
}

const fetchNews = async (reset = false) => {
  if (loading.value || noMore.value) return
  loading.value = true
  error.value = ""
  try {
    // Delay 1s before fetching
    await new Promise(resolve => setTimeout(resolve, 500))
    const res = await fetch(
      `https://jpnewsapi.tomoweb9.online/api/news/jp?page=${page.value}`
    )
    if (!res.ok) throw new Error("日本のニュースを取得できませんでした")
    const data = await res.json()

    const pageItems = data.data.map(item => ({
      ...item,
      pubDate: item.createdDatetime,
      image: item.thumbUrl,
      newsContent: item.title, // Use title as content as per request
    }));

    if (isTranslateEnabled.value) {
      isTranslating.value = true;
      for (const item of pageItems) {
        item.translatedTitle = await translateText(item.title, 'zh-TW');
        item.translatedContent = await translateText(item.newsContent, 'zh-TW');
      }
      isTranslating.value = false;
    }

    if (reset) {
      news.value = pageItems
    } else {
      news.value = [...news.value, ...pageItems]
    }
    if (!data.data || data.data.length === 0) {
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
    error.value = err.message || "ニュースの取得中にエラーが発生しました"
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
  translate.value = ''
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
  const savedPreference = localStorage.getItem('jpNewsTranslateEnabled');
  if (savedPreference !== null) {
    isTranslateEnabled.value = savedPreference === 'true';
  }

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
  grid-template-columns: repeat(6, 1fr); /* 6 columns per row */
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

/* General improvements for all sizes */
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

:deep(.fullscreen-modal .ant-modal) {
  max-width: 100vw;
  width: 100vw;
  top: 0;
  padding-bottom: 0;
  margin: 0;
}
:deep(.fullscreen-modal .ant-modal-content) {
  height: 100vh;
  border-radius: 0;
  display: flex;
  flex-direction: column;
}
:deep(.fullscreen-modal .ant-modal-body) {
  flex: 1;
  overflow-y: auto;
}

.custom-modal-controls {
  display: flex;
  align-items: center;
  gap: 8px; /* Add some space between buttons */
}

.custom-modal-controls .ant-btn {
  color: rgba(0, 0, 0, 0.45);
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-modal-controls .ant-btn:hover {
  color: rgba(0, 0, 0, 0.75);
  background-color: #f0f0f0;
}
</style>

<style>
.news-modal-content {
  font-size: 1.1rem !important;
  line-height: 1.7 !important;
}
</style>
