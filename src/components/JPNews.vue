<template>
  <div>
    <a-card title="日本ニュース" class="mb-6 profile-card">
      <template #extra>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <a-select
              v-if="isTranslateEnabled"
              v-model:value="translationApi"
              size="small"
              style="width: 100px"
              class="translation-api-select"
            >
              <a-select-option value="google">Google</a-select-option>
              <a-select-option value="deepl">DeepL</a-select-option>
              <a-select-option value="gemini">Gemini</a-select-option>
            </a-select>
            <a-button v-if="isTranslateEnabled && translationApi === 'gemini'" type="text" @click="openApiKeyModal" class="!p-0 text-white"><SettingOutlined /></a-button>
            <a-button v-if="isTranslateEnabled && translationApi === 'deepl'" type="text" @click="openDeeplApiKeyModal" class="!p-0 text-white"><SettingOutlined /></a-button>
            <span class="text-white">{{ isMobile ? '中文' : '繁體中文' }}</span>
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
                                    {{ (isTranslateEnabled && item.translations && item.translations[translationApi]) ? item.translations[translationApi].title : item.title }}
                                  </div>
                                  <a-spin
                                    v-if="isTranslateEnabled && isTranslating && (!item.translations || !item.translations[translationApi])"
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
                <div class="news-content">
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
      :bodyStyle="modalBodyStyle"
      :closable="false"
    >
      <template #title>
        <div style="display: flex; align-items: center; width: 100%;">
          <span class="hidden sm:inline">ニュース詳細</span>
          <div class="custom-modal-controls ml-auto">
            <div class="flex items-center gap-2">
              <a-select
                v-if="isModalTranslateEnabled"
                v-model:value="translationApi"
                size="small"
                style="width: 100px;"
              >
                <a-select-option value="google">Google</a-select-option>
                <a-select-option value="deepl">DeepL</a-select-option>
                <a-select-option value="gemini">Gemini</a-select-option>
              </a-select>
              <a-button v-if="isModalTranslateEnabled && translationApi === 'gemini'" type="text" @click="openApiKeyModal"><SettingOutlined /></a-button>
              <a-button v-if="isModalTranslateEnabled && translationApi === 'deepl'" type="text" @click="openDeeplApiKeyModal"><SettingOutlined /></a-button>
              <span class="text-sm text-gray-500">{{ isMobile ? '中文' : '繁體中文' }}</span>
              <a-switch v-model:checked="isModalTranslateEnabled" :loading="isModalTranslating" />
            </div>
            <a-button v-if="!isMobile" type="text" @click="toggleFullScreen">
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
        <a-spin :spinning="isModalContentLoading" tip="記事を読み込み中...">
          <img :src="getHighResImage(selectedNews)" alt="thumbnail" class="w-full max-w-full h-auto object-cover rounded-lg mb-4" />
          <a-spin :spinning="isModalTranslating">
            <h2 class="text-2xl font-semibold mb-2">{{ (isModalTranslateEnabled && selectedNews.translations && selectedNews.translations[translationApi]) ? selectedNews.translations[translationApi].title : selectedNews.title }}</h2>
            <div v-html="(isModalTranslateEnabled && selectedNews.translations && selectedNews.translations[translationApi]) ? selectedNews.translations[translationApi].content : selectedNews.newsContent" class="text-gray-600 mb-4 news-modal-content"></div>
          </a-spin>
        </a-spin>
        <a :href="selectedNews.link" target="_blank" rel="noopener noreferrer">原文を読む</a>
      </div>
    </a-modal>

    <a-modal
        v-model:open="isApiKeyModalVisible"
        title="Google Gemini API Key & Model"
        @ok="saveApiKey"
        :z-index="1050"
      >
        <p>
          Please enter up to 5 Google Gemini API keys.
          If one key fails (e.g., quota exceeded), the next will be used automatically. Keys are stored in your browser's local storage.
        </p>
        <div v-for="(key, index) in geminiApiKeys" :key="index" style="margin-bottom: 10px;">
          <a-input v-model:value="geminiApiKeys[index]" :placeholder="'API Key ' + (index + 1) + (index === 0 ? ' (Primary)' : '')" />
        </div>
        <a-button @click="fetchModels" :loading="isLoadingModels" style="margin-top: 10px;">Fetch Available Models</a-button>
        <p v-if="availableModels.length > 0" style="margin-top: 10px;">Select a model:</p>
        <a-select
          v-if="availableModels.length > 0"
          v-model:value="selectedModel"
          style="width: 100%"
        >
          <a-select-option v-for="model in availableModels" :key="model.name" :value="model.name">{{ model.displayName }}</a-select-option>
        </a-select>
        <template #footer>
            <a-button key="back" @click="isApiKeyModalVisible = false">Cancel</a-button>
            <a-button key="submit" type="primary" :loading="loading" @click="saveApiKey">Save</a-button>
        </template>
        <div style="margin-top: 15px; color: #ff4d4f;">
            <strong>Warning:</strong> Storing API keys in your browser's local storage is not secure. Please use an API key with restricted access for this client-side application.
        </div>
      </a-modal>

    <a-modal
        v-model:open="isDeeplApiKeyModalVisible"
        title="DeepL API Key"
        @ok="saveDeeplApiKey"
        :z-index="1050"
      >
        <p>
          Please enter your DeepL API key. The key is stored in your browser's local storage.
        </p>
        <a-input v-model:value="deeplApiKey" placeholder="DeepL API Key" />
        <template #footer>
            <a-button key="back" @click="isDeeplApiKeyModalVisible = false">Cancel</a-button>
            <a-button key="submit" type="primary" :loading="loading" @click="saveDeeplApiKey">Save</a-button>
        </template>
        <div style="margin-top: 15px; color: #ff4d4f;">
            <strong>Warning:</strong> Storing API keys in your browser's local storage is not secure. Please use an API key with restricted access for this client-side application.
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
import { ref, onMounted, onBeforeUnmount, watch, computed, nextTick } from "vue"
import { ReloadOutlined, FullscreenOutlined, FullscreenExitOutlined, CloseOutlined, SettingOutlined } from "@ant-design/icons-vue"
import axios from "axios"
import * as cheerio from "cheerio";

const news = ref([])
const loading = ref(false)
const updateTime = ref("")
const error = ref("")
const PAGE_SIZE = 12;
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
const translationApi = ref('google'); // 'google' or 'deepl' or 'gemini'
const isApiKeyModalVisible = ref(false);
const geminiApiKeys = ref(['', '', '', '', '']);
const currentApiKeyIndex = ref(0);
const availableModels = ref([]);
const selectedModel = ref('');
const isLoadingModels = ref(false);
const isDeeplApiKeyModalVisible = ref(false);
const deeplApiKey = ref('');
const isModalContentLoading = ref(false);
const userToken = ref(null);

const isMobile = ref(window.innerWidth <= 600);

const handleResize = () => {
  isMobile.value = window.innerWidth <= 600;
};

const modalBodyStyle = computed(() => ({
  'max-height': isMobile.value ? '60vh' : '80vh',
  'overflow-y': 'auto',
}));

const openDeeplApiKeyModal = () => {
  const savedKey = localStorage.getItem('deeplApiKey');
  if (savedKey) {
    deeplApiKey.value = savedKey;
  }
  isDeeplApiKeyModalVisible.value = true;
};

const saveDeeplApiKey = () => {
  localStorage.setItem('deeplApiKey', deeplApiKey.value);
  isDeeplApiKeyModalVisible.value = false;
};

const openApiKeyModal = () => {
  // When opening the modal, if we have saved keys, populate the fields.
  const savedKeys = localStorage.getItem('geminiApiKeys');
  if (savedKeys) {
    try {
      const parsedKeys = JSON.parse(savedKeys);
      if (Array.isArray(parsedKeys)) {
        for (let i = 0; i < 5; i++) {
          geminiApiKeys.value[i] = parsedKeys[i] || '';
        }
      }
    } catch(e) {
      console.error("Failed to parse Gemini API keys from localStorage", e);
    }
  }
  isApiKeyModalVisible.value = true;
};

const saveApiKey = () => {
  localStorage.setItem('geminiApiKeys', JSON.stringify(geminiApiKeys.value));
  if (selectedModel.value) {
    localStorage.setItem('geminiModel', selectedModel.value);
  }
  isApiKeyModalVisible.value = false;
  // Reset to start with the first valid key next time.
  const firstValidIndex = geminiApiKeys.value.findIndex(k => k && k.trim() !== '');
  currentApiKeyIndex.value = firstValidIndex > -1 ? firstValidIndex : 0;
  localStorage.setItem('geminiCurrentApiKeyIndex', currentApiKeyIndex.value.toString());
};

const fetchModels = async () => {
  const keys = geminiApiKeys.value.filter(k => k && k.trim());
  if (keys.length === 0) {
    alert('Please enter at least one API key first.');
    return;
  }

  isLoadingModels.value = true;
  availableModels.value = []; // Clear previous models
  let success = false;
  
  // Try keys in order
  for (const key of keys) {
    try {
      const res = await axios.get(`https://generativelanguage.googleapis.com/v1/models?key=${key}`);
      const fetchedModels = res.data.models.filter(model =>
        model.supportedGenerationMethods.includes('generateContent')
      );
      
      if (fetchedModels.length > 0) {
        availableModels.value = fetchedModels;
        // Found a working key. Set it as the current one for future translations.
        const keyIndex = geminiApiKeys.value.indexOf(key);
        currentApiKeyIndex.value = keyIndex;
        localStorage.setItem('geminiCurrentApiKeyIndex', keyIndex.toString());
        
        success = true;
        break; // Exit loop on first success
      }
    } catch (error) {
      console.error(`Error fetching models with key ending in ...${key.slice(-4)}:`, error.response?.data?.error || error.message);
    }
  }

  if (!success) {
    alert('Failed to fetch models with any of the provided API keys. Please check your API keys and network connection.');
  }
  isLoadingModels.value = false;
};

const geminiTranslate = async (text, targetLang) => {
    if (!text || text.trim() === '') return '';

    const keys = geminiApiKeys.value;
    const validKeys = keys.filter(k => k && k.trim() !== '');

    if (validKeys.length === 0) {
      console.error('Gemini API key is missing.');
      openApiKeyModal();
      return text;
    }
    if (!selectedModel.value) {
        console.error('Gemini model is not selected.');
        openApiKeyModal();
        return text;
    }

    const orderedKeysToTry = [];
    const startingIndex = currentApiKeyIndex.value;
    for (let i = startingIndex; i < keys.length; i++) {
        if (keys[i] && keys[i].trim() !== '') orderedKeysToTry.push(keys[i]);
    }
    for (let i = 0; i < startingIndex; i++) {
        if (keys[i] && keys[i].trim() !== '') orderedKeysToTry.push(keys[i]);
    }

    if (orderedKeysToTry.length === 0) {
        openApiKeyModal();
        return text;
    }

    for (const apiKey of orderedKeysToTry) {
        try {
            const prompt = `Translate the following Japanese text to Traditional Chinese. Do not provide any explanation or other text, just the translation. The text to translate is: "${text}"`;
            const modelName = selectedModel.value;
            const res = await axios.post(`https://generativelanguage.googleapis.com/v1/${modelName}:generateContent?key=${apiKey}`, {
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.2, maxOutputTokens: 8192 }
            });

            if (!res.data.candidates || res.data.candidates.length === 0) {
              console.error('Gemini translation returned no candidates.');
              continue; // Try next key
            }

            // Correctly join all parts of the response.
            const translation = res.data.candidates[0].content.parts.map(p => p.text).join('');
            
            const successfulKeyIndex = keys.indexOf(apiKey);
            if (successfulKeyIndex !== currentApiKeyIndex.value) {
                currentApiKeyIndex.value = successfulKeyIndex;
                localStorage.setItem('geminiCurrentApiKeyIndex', successfulKeyIndex.toString());
            }
            return translation;
        } catch (error) {
            console.error(`Gemini translation with key ending in ...${apiKey.slice(-4)} failed. Trying next one.`, error.response?.data?.error || error.message);
        }
    }

    console.error('All Gemini API keys failed.');
    return text;
};

const translateText = async (text, targetLang) => {
  if (!text) return '';

  if (translationApi.value === 'google') {
    try {
      const res = await axios.get('https://translate.googleapis.com/translate_a/single', {
        params: { client: 'gtx', sl: 'ja', tl: targetLang, dt: 't', q: text },
      });
      return res.data[0].map(item => item[0]).join('');
    } catch (error) {
      console.error('Google Translation error:', error);
      return text;
    }
  } else if (translationApi.value === 'gemini') {
    return await geminiTranslate(text, targetLang);
  } else if (translationApi.value === 'mymemory') {
    try {
      const res = await axios.get('https://api.mymemory.translated.net/get', {
        params: { q: text, langpair: `ja|${targetLang}`},
      });
      return res.data.responseData.translatedText;
    } catch (error) {
      console.error('MyMemory Translation error:', error);
      return text;
    }
  }
  return text;
};

const translateAllNews = async () => {
  if (isTranslateEnabled.value) {
    isTranslating.value = true;
    const currentApi = translationApi.value;
    for (const item of news.value) {
      if (!item.translations) {
        item.translations = {};
      }
      if (!item.translations[currentApi]) {
        const title = await translateText(item.title, 'zh-TW');
        const content = await translateText(item.newsContent, 'zh-TW');
        item.translations[currentApi] = { title, content };
      }
    }
    isTranslating.value = false;
  }
};

watch(translationApi, async (newValue) => {
  if (newValue === 'gemini' && geminiApiKeys.value.every(k => !k.trim())) {
    openApiKeyModal();
  }
  if (isTranslateEnabled.value) {
    translateAllNews();
  }
  if (isModalVisible.value && isModalTranslateEnabled.value && selectedNews.value) {
    const currentApi = newValue;
    if (!selectedNews.value.translations[currentApi]) {
        isModalTranslating.value = true;
        try {
            const title = await translateText(selectedNews.value.title, 'zh-TW');
            const content = await translateText(selectedNews.value.newsContent, 'zh-TW');
            selectedNews.value.translations[currentApi] = { title, content };
        } finally {
            isModalTranslating.value = false;
        }
    }
  }
});

watch(isTranslateEnabled, (newValue) => {
  localStorage.setItem('jpNewsTranslateEnabled', newValue);
  if (newValue) {
    translateAllNews();
  }
});

watch(isModalTranslateEnabled, async (newValue) => {
  if (newValue && selectedNews.value) {
    const currentApi = translationApi.value;
    if (!selectedNews.value.translations) {
      selectedNews.value.translations = {};
    }
    if (!selectedNews.value.translations[currentApi]) {
      isModalTranslating.value = true;
      try {
        const title = await translateText(selectedNews.value.title, 'zh-TW');
        const content = await translateText(selectedNews.value.newsContent, 'zh-TW');
        selectedNews.value.translations[currentApi] = { title, content };
      } finally {
        isModalTranslating.value = false;
      }
    }
  }
});

watch(isModalVisible, (newValue) => {
  if (!newValue) {
    // Reset translation API to default when modal is closed
    translationApi.value = 'google';
  }
});

const toggleFullScreen = () => {
  isFullScreen.value = !isFullScreen.value;
};

const openNewsModal = async (newsItem) => {
  isFullScreen.value = false;
  selectedNews.value = newsItem;
  isModalVisible.value = true;

  // If content is already fetched, do nothing.
  if (newsItem.newsContent) {
    if (!newsItem.translations) {
      newsItem.translations = {};
    }
    isModalTranslateEnabled.value = isTranslateEnabled.value;
    return;
  }

  isModalContentLoading.value = true;
  try {
    const url = new URL(newsItem.link);
    const proxiedUrl = `/yahoo-news${url.pathname}`;
    const { data: articlePageData } = await axios.get(proxiedUrl);
    const $ = cheerio.load(articlePageData);
    
    const articleBody = $('.article_body');
    const coverPhotoUrl = getHighResImage(newsItem).split('?')[0];

    // Find links that contain both an image and a paragraph (likely an image with caption)
    articleBody.find('a').each((i, el) => {
        const link = $(el);
        const image = link.find('img');
        const paragraph = link.find('p');

        if (image.length > 0 && paragraph.length > 0) {
            // This is an image with a caption
            
            // Add a class to the caption paragraph for styling
            paragraph.addClass('image-caption');

            // Check if the image is a duplicate of the cover photo
            let imageUrl = image.attr('src');
            if (imageUrl && imageUrl.split('?')[0] === coverPhotoUrl) {
                // If it's a duplicate, remove the entire container
                link.parent().remove();
            } else {
                // Otherwise, just remove the hyperlink by replacing the link with its contents
                link.replaceWith(link.contents());
            }
        }
    });

    const content = articleBody.html();
    
    const itemInNewsArray = news.value.find(item => item.id === newsItem.id);
    if (itemInNewsArray) {
      itemInNewsArray.newsContent = content || '記事の取得に失敗しました。';
    }
    selectedNews.value.newsContent = content || '記事の取得に失敗しました。';
  } catch (err) {
    console.error(`Error fetching article content from ${newsItem.link}:`, err);
    selectedNews.value.newsContent = '記事の取得に失敗しました。';
  } finally {
    isModalContentLoading.value = false;
  }

  if (!selectedNews.value.translations) {
    selectedNews.value.translations = {};
  }
  isModalTranslateEnabled.value = isTranslateEnabled.value;
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

const getToken = async () => {
    if (userToken.value) {
      return userToken.value;
    }
    const webUrl = '/yahoo-news/categories/entertainment';

    try {
      const { data } = await axios.get(webUrl);
      const $ = cheerio.load(data);
      const token = $('script')
        .filter((i, el) => $(el).html().includes('userToken'))
        .html()
        .split('userToken')
        .pop()
        .slice(2)
        .split(',')[0]
        .replace(/"/g, '');
      userToken.value = token;
      return token;
    } catch (err) {
      console.error('Error fetching the page to get token: ', err);
      throw new Error('トークンの取得に失敗しました');
    }
};

const fetchNews = async (reset = false) => {
  if (loading.value || (noMore.value && !reset)) return;

  loading.value = true;
  if (reset) {
    page.value = 0;
    news.value = [];
    noMore.value = false;
    error.value = '';
    updateTime.value = '';
    userToken.value = null;
  }

  const itemsToLoad = reset ? PAGE_SIZE : PAGE_SIZE;
  const newlyFetchedItems = [];
  let fetchedCount = 0;

  while (fetchedCount < itemsToLoad && !noMore.value) {
    try {
      const token = await getToken();
      if (!token) throw new Error("Token retrieval failed.");

      const start = page.value * itemsToLoad + fetchedCount; // Careful with page logic
      const apiUrl = `/yahoo-news/api/newsFeed/ent?start=${start}&results=${itemsToLoad - fetchedCount}&device=pc`;
      
      const [response] = await Promise.all([
          axios.get(apiUrl, { headers: { 'userToken': token } }),
          new Promise(resolve => setTimeout(resolve, 500))
      ]);
      
      const responseItems = response.data.items.filter((news) => news.id !== null && news.link);

      if (responseItems.length === 0) {
        noMore.value = true;
        break;
      }
      
      const pageItems = responseItems.map(news => ({
        id: news.contentId,
        title: news.title,
        link: news.link,
        image: news.thumbUrl,
        thumbUrl: news.thumbUrl,
        pubDate: news.createTime ? `${news.createTime.date}, ${news.createTime.time}` : null,
        newsContent: '',
      }));

      if (isTranslateEnabled.value) {
        isTranslating.value = true;
        for (const item of pageItems) {
          const title = await translateText(item.title, 'zh-TW');
          const content = await translateText(item.newsContent, 'zh-TW');
          item.translations = { [translationApi.value]: { title, content } };
        }
        isTranslating.value = false;
      }
      
      newlyFetchedItems.push(...pageItems);
      fetchedCount += pageItems.length;

      // This API seems to have pages based on item index, not page number
      // To prevent re-fetching the same items, we don't increment a page number here.
      // The `start` index calculation will handle getting the next batch.
      
    } catch (err) {
      error.value = err.message || "ニュースの取得中にエラーが発生しました";
      noMore.value = true;
      break; 
    }
  }

  if (reset) {
    news.value = newlyFetchedItems;
  } else {
    news.value = [...news.value, ...newlyFetchedItems];
  }
  
  if(newlyFetchedItems.length > 0) {
    const now = new Date();
    updateTime.value = `${now.getFullYear()}/${
      now.getMonth() + 1
    }/${now.getDate()} ${now.getHours()}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  }
  
  page.value += 1; // Increment the logical UI page number
  loading.value = false;
};

const refreshNews = async () => {
  await fetchNews(true);
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const handleWindowScroll = () => {
  if (loading.value || noMore.value) return;
  const scrollY = window.scrollY || window.pageYOffset;
  const viewportHeight = window.innerHeight;
  const fullHeight = document.documentElement.scrollHeight;
  showBackToTop.value = scrollY > 300;
  if (scrollY + viewportHeight >= fullHeight - 100) {
    fetchNews();
  }
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
  const savedPreference = localStorage.getItem('jpNewsTranslateEnabled');
  if (savedPreference !== null) {
    isTranslateEnabled.value = savedPreference === 'true';
  }
  const savedKeys = localStorage.getItem('geminiApiKeys');
  if (savedKeys) {
    try {
      const parsedKeys = JSON.parse(savedKeys);
      if (Array.isArray(parsedKeys)) {
        for (let i = 0; i < 5; i++) {
          geminiApiKeys.value[i] = parsedKeys[i] || '';
        }
      }
    } catch(e) {
      console.error("Failed to parse Gemini API keys from localStorage", e);
    }
  }
  currentApiKeyIndex.value = parseInt(localStorage.getItem('geminiCurrentApiKeyIndex') || '0', 10);
  selectedModel.value = localStorage.getItem('geminiModel') || '';

  fetchNews(true);
  window.addEventListener("scroll", handleWindowScroll);
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", handleWindowScroll)
  window.removeEventListener('resize', handleResize)
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

.translation-api-select :deep(.ant-select-selector) {
  background-color: #1890ff !important;
  color: white !important;
  border-radius: 4px !important;
  border: none !important;
}

.translation-api-select :deep(.ant-select-arrow) {
  color: white !important;
}
</style>

<style>
.news-modal-content {
  font-size: 1.1rem !important;
  line-height: 1.7 !important;
  white-space: pre-wrap;
}
.news-modal-content img {
  display: block;
  margin: 1em auto;
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.news-modal-content .image-caption {
  text-align: center;
  font-size: 0.9em;
  color: #666;
  margin-top: 0.5em;
  margin-bottom: 1.5em;
}
</style>
