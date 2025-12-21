<template>
  <a-card title="九巴到站時間" class="kmb-card">
    <div class="flex flex-col gap-4">
      <!-- Route Search View -->
      <div v-if="!selectedRoute">
        <a-input-search
          v-model:value="searchTerm"
          placeholder="搜尋路線 (例: 273, 960)"
          enter-button
          size="large"
          class="mb-4"
          @search="onSearch"
        />

        <div v-if="loading" class="skeleton-wrapper">
          <a-skeleton active :paragraph="{ rows: 4 }" />
        </div>
        <div v-if="error" class="text-center text-red-500 mt-4 p-4 bg-red-50 rounded">{{ error }}</div>

        <a-list
          v-if="displayedRoutes.length > 0 && !loading && !error"
          :data-source="displayedRoutes"
          class="route-list"
        >
          <template #renderItem="{ item }">
            <a-list-item @click="selectRoute(item)" class="route-list-item">
              <a-list-item-meta>
                <template #title>
                  <div class="font-bold text-lg text-blue-600">{{ item.route }}</div>
                </template>
                <template #description>
                  <span class="font-medium">{{ item.orig_tc }}</span>
                  <span class="mx-2 text-gray-400">&rarr;</span>
                  <span class="font-medium">{{ item.dest_tc }}</span>
                </template>
              </a-list-item-meta>
            </a-list-item>
          </template>
        </a-list>

        <div v-if="searchTerm && displayedRoutes.length === 0 && !loading && !error" class="text-center text-gray-500 mt-4 p-4 bg-gray-50 rounded">
          <frown-outlined class="mr-2" /> 找不到路線
        </div>
      </div>

      <!-- Stops and ETA View -->
      <div v-if="selectedRoute">
        <div class="flex justify-between items-center mb-4 pb-4 border-b">
          <a-button @click="reset" type="primary" shape="round">
            <arrow-left-outlined /> 返回
          </a-button>
          <h3 class="text-2xl font-bold text-blue-700">{{ selectedRoute.route }}</h3>
        </div>

        <div v-if="loadingStops" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="skeleton-wrapper"><a-skeleton active :paragraph="{ rows: 6 }" /></div>
          <div v-if="!isCircularRoute" class="skeleton-wrapper"><a-skeleton active :paragraph="{ rows: 6 }" /></div>
        </div>
        <div v-if="stopsError" class="text-center text-red-500 mt-4 p-4 bg-red-50 rounded">{{ stopsError }}</div>

        <div class="flex flex-col gap-6" v-if="!loadingStops && !stopsError">
          <!-- Direction Toggle and Stop List -->
          <div class="space-y-4">
            <a-radio-group v-model:value="activeDirection" button-style="solid" size="large" class="w-full direction-toggle">
              <a-radio-button
                value="outbound"
                class="w-1/2 text-center"
              >
                往 {{ selectedRoute.dest_tc }}
              </a-radio-button>
              <a-radio-button
                v-if="!isCircularRoute"
                value="inbound"
                class="w-1/2 text-center"
              >
                往 {{ selectedRoute.orig_tc }}
              </a-radio-button>
            </a-radio-group>

            <a-list
              :data-source="activeDirection === 'outbound' ? outboundStops : inboundStops"
              class="stop-list"
              bordered
            >
              <template #renderItem="{ item }">
                <a-list-item 
                  @click="selectStop(item, activeDirection)"
                  :class="{ 'selected-stop': isStopSelected(item) }"
                  class="stop-list-item"
                >
                  <span class="stop-seq">{{ item.seq }}</span>
                  <span class="stop-name">{{ item.name_tc }}</span>
                </a-list-item>
              </template>
            </a-list>
          </div>

          <!-- ETA Display -->
          <div>
            <div v-if="multiSelectedStops.length > 0" class="p-4 border rounded-lg shadow-sm bg-white">
              <div class="flex justify-between items-center mb-3">
                <h4 class="font-bold text-lg text-gray-800">到站時間</h4>
                <div class="flex items-center gap-2">
                  <div v-if="lastUpdated" class="text-xs text-gray-400">
                    最後更新: {{ lastUpdated }}
                  </div>
                  <a-button @click="() => fetchEta(multiSelectedStops.value)" type="text" title="Refresh">
                    <template #icon>
                      <loading-outlined v-if="loadingEta" :style="{ color: '#1677ff', fontSize: '18px' }" />
                      <reload-outlined v-else :style="{ color: '#1677ff', fontSize: '18px' }" />
                    </template>
                  </a-button>
                </div>
              </div>
              <p class="font-semibold text-md mb-3 pb-3 border-b">
                <span v-for="(stop, index) in multiSelectedStops" :key="stop.stop">
                  {{ stop.name_tc }}<span v-if="index < multiSelectedStops.length - 1">, </span>
                </span>
              </p>

              <!-- Skeleton for initial load only -->
              <div v-if="loadingEta && etaResult.length === 0" class="skeleton-wrapper">
                <a-skeleton active :paragraph="{ rows: 4 }" />
              </div>
              
              <div v-if="etaError" class="text-center text-red-500 p-2 bg-red-50 rounded">{{ etaError }}</div>

              <!-- ETA results (kept on screen during background refresh) -->
              <div v-if="etaResult.length > 0">
                <div v-for="(eta, index) in etaResult" :key="eta.eta_seq + '-' + index" class="eta-item">
                  <div class="flex items-center gap-4">
                    <car-outlined class="eta-bus-icon" />
                    <div class="flex-grow">
                      <div class="eta-time">預計 {{ getEtaInMinutes(eta.eta).time }}</div>
                      <div v-if="eta.rmk_tc" class="eta-remark">{{ eta.rmk_tc }}</div>
                    </div>
                  </div>
                  <div class="eta-minutes">
                    <div v-if="getEtaInMinutes(eta.eta).minutes > 0">
                      {{ getEtaInMinutes(eta.eta).minutes }}
                      <span class="text-lg">分鐘</span>
                    </div>
                    <div v-else class="flashing-text">即將到達</div>
                  </div>
                </div>
              </div>

              <!-- "No ETA" message -->
              <div v-else-if="!loadingEta && !etaError" class="text-center text-gray-500 p-4">
                <info-circle-outlined class="mr-2" /> 暫無到站時間
              </div>
            </div>
            <div v-else class="text-center text-gray-400 p-4 border rounded-lg bg-gray-50 border-dashed">
              請選擇一個車站
            </div>
          </div>
        </div>
      </div>
    </div>
  </a-card>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted, watch } from 'vue';
import { FrownOutlined, ArrowLeftOutlined, ReloadOutlined, ClockCircleOutlined, InfoCircleOutlined, CarOutlined, LoadingOutlined } from '@ant-design/icons-vue';

const searchTerm = ref('');
const allRoutes = ref([]);
const allStops = ref(new Map());
const loading = ref(false);
const error = ref('');

const selectedRoute = ref(null);
const loadingStops = ref(false);
const stopsError = ref('');
const outboundStops = ref([]);
const inboundStops = ref([]);

const multiSelectedStops = ref([]);
const activeDirection = ref('outbound');
const loadingEta = ref(false);
const etaError = ref('');
const etaResult = ref([]);
const lastUpdated = ref('');
let etaInterval = null;

const fetchWithRetry = async (url, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (i < retries - 1) {
        console.warn(`Attempt ${i + 1} failed for ${url}. Retrying...`);
        await new Promise(res => setTimeout(res, delay));
      } else {
        console.error(`All ${retries} attempts failed for ${url}.`);
        throw error;
      }
    }
  }
};

const isCircularRoute = computed(() => {
  return selectedRoute.value?.dest_tc.includes('循環');
});

const isStopSelected = (stop) => {
  return multiSelectedStops.value.some(s => s.stop === stop.stop);
};

const fetchInitialData = async () => {
  loading.value = true;
  error.value = '';
  try {
    const [routeRes, stopRes] = await Promise.allSettled([
      fetchWithRetry('https://data.etabus.gov.hk/v1/transport/kmb/route/'),
      fetchWithRetry('https://data.etabus.gov.hk/v1/transport/kmb/stop')
    ]);

    if (routeRes.status === 'rejected') {
      error.value = '無法載入路線資料，請重新整理頁面。';
      console.error("Failed to fetch routes:", routeRes.reason);
      return;
    }
    if (stopRes.status === 'rejected') {
      error.value = '無法載入車站資料，請重新整理頁面。';
      console.error("Failed to fetch stops:", stopRes.reason);
      return;
    }

    if (routeRes.value?.data) {
      allRoutes.value = routeRes.value.data;
    }
    if (stopRes.value?.data) {
      const stopMap = new Map();
      stopRes.value.data.forEach(stop => {
        stopMap.set(stop.stop, stop);
      });
      allStops.value = stopMap;
    }

  } catch (err) {
    error.value = '載入初始資料時發生未知錯誤';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const getEtaInMinutes = (etaString) => {
  if (!etaString) {
    return { minutes: '-', time: '無效時間' };
  }
  const now = new Date();
  const eta = new Date(etaString);
  if (isNaN(eta)) {
    return { minutes: '-', time: '無效時間' };
  }
  const diff = Math.floor((eta - now) / (1000 * 60));
  return {
    minutes: diff >= 0 ? diff : 0,
    time: eta.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  };
};

onMounted(() => {
  fetchInitialData();
});

onUnmounted(() => {
  if (etaInterval) {
    clearInterval(etaInterval);
  }
});

const displayedRoutes = ref([]);
let debounceTimer = null;

watch(searchTerm, (newTerm) => {
  clearTimeout(debounceTimer);
  if (!newTerm) {
    displayedRoutes.value = [];
    return;
  }
  debounceTimer = setTimeout(() => {
    const term = newTerm.toLowerCase();
    if (allRoutes.value.length > 0) {
        displayedRoutes.value = allRoutes.value.filter(route =>
            route.route.toLowerCase().includes(term) ||
            route.orig_tc.includes(term) ||
            route.dest_tc.includes(term)
        );
    }
  }, 300);
});

const onSearch = () => {
  clearTimeout(debounceTimer);
  const term = searchTerm.value.toLowerCase();
    if (allRoutes.value.length > 0) {
        displayedRoutes.value = allRoutes.value.filter(route =>
            route.route.toLowerCase().includes(term) ||
            route.orig_tc.includes(term) ||
            route.dest_tc.includes(term)
        );
    }
};

const selectRoute = async (route) => {
  selectedRoute.value = route;
  loadingStops.value = true;
  stopsError.value = '';
  outboundStops.value = [];
  inboundStops.value = [];
  multiSelectedStops.value = [];
  etaResult.value = [];
  activeDirection.value = 'outbound';

  try {
    const [outboundRes, inboundRes] = await Promise.allSettled([
      fetchWithRetry(`https://data.etabus.gov.hk/v1/transport/kmb/route-stop/${route.route}/outbound/1`),
      fetchWithRetry(`https://data.etabus.gov.hk/v1/transport/kmb/route-stop/${route.route}/inbound/1`)
    ]);

    if (outboundRes.status === 'fulfilled' && outboundRes.value?.data) {
      outboundStops.value = outboundRes.value.data.map(stop => {
        const stopInfo = allStops.value.get(stop.stop);
        return { ...stop, name_tc: stopInfo ? stopInfo.name_tc : '未知站名' };
      });
    }

    if (inboundRes.status === 'fulfilled' && inboundRes.value?.data) {
      inboundStops.value = inboundRes.value.data.map(stop => {
        const stopInfo = allStops.value.get(stop.stop);
        return { ...stop, name_tc: stopInfo ? stopInfo.name_tc : '未知站名' };
      });
    }
  } catch (err) {
    stopsError.value = '無法載入車站資料';
    console.error(err);
  } finally {
    loadingStops.value = false;
  }
};

const selectStop = (stop, direction) => {
  etaResult.value = [];
  lastUpdated.value = '';
  
  const isFirstStopOfCircular = isCircularRoute.value &&
                                stop.stop === outboundStops.value[0]?.stop &&
                                direction === 'outbound';

  let stopsToFetch = [];
  if (isFirstStopOfCircular) {
    const lastStop = outboundStops.value[outboundStops.value.length - 1];
    if (lastStop && stop.stop !== lastStop.stop) {
      stopsToFetch = [stop, lastStop];
    } else {
      stopsToFetch = [stop];
    }
  } else {
    stopsToFetch = [stop];
  }
  
  multiSelectedStops.value = stopsToFetch;
  fetchEta(stopsToFetch);
  if (etaInterval) clearInterval(etaInterval);
  etaInterval = setInterval(() => fetchEta(stopsToFetch), 5000);
};

const fetchEta = async (stops) => {
  if (!stops || stops.length === 0) return;
  loadingEta.value = true;
  etaError.value = '';
  try {
    const requests = stops.map(s => 
      fetchWithRetry(`https://data.etabus.gov.hk/v1/transport/kmb/eta/${s.stop}/${selectedRoute.value.route}/1`)
    );
    const responses = await Promise.all(requests);
    
    let combinedResults = [];
    responses.forEach(res => {
      if (res?.data) {
        const filteredData = res.data.filter(e => e && e.eta);
        const truncatedData = filteredData.slice(0, 3);
        combinedResults = combinedResults.concat(truncatedData);
      }
    });
    
    etaResult.value = combinedResults.sort((a, b) => new Date(a.eta) - new Date(b.eta));
    lastUpdated.value = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch (err) {
    etaError.value = '無法載入到站時間';
    etaResult.value = [];
    console.error("Error fetching ETA after retries:", err);
  } finally {
    loadingEta.value = false;
  }
};

const reset = () => {
  selectedRoute.value = null;
  multiSelectedStops.value = [];
  searchTerm.value = '';
  etaResult.value = [];
  lastUpdated.value = '';
  activeDirection.value = 'outbound';
  if (etaInterval) clearInterval(etaInterval);
};
</script>

<style scoped>
.kmb-card {
  background: #f7fafc;
}
.route-list-item {
  cursor: pointer;
  transition: background-color 0.2s, border-left 0.2s;
  border-left: 4px solid transparent;
}
.route-list-item:hover {
  background-color: #ebf8ff;
  border-left: 4px solid #3182ce;
}
.stop-list {
  max-height: 500px;
  overflow-y: auto;
  border-radius: 8px;
}
.stop-list-item {
  cursor: pointer;
  transition: background-color 0.2s;
  padding: 10px 16px;
  display: flex;
  align-items: center;
}
.stop-list-item:hover {
  background-color: #f0f2f5;
}
.selected-stop {
  background-color: #e6f7ff !important;
  color: #1890ff;
  font-weight: 600;
}
.selected-stop .stop-seq {
  background-color: #1677ff;
  color: white;
}
.stop-seq {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-right: 16px;
  border-radius: 50%;
  background-color: #f0f2f5;
  font-weight: 500;
  flex-shrink: 0;
}
.stop-name {
  flex-grow: 1;
}
.skeleton-wrapper {
  padding: 16px;
  background: #fff;
  border-radius: 8px;
}
.eta-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 8px;
  background-color: #fff;
  transition: box-shadow 0.2s, border-color 0.2s;
}
.eta-item:last-child {
  margin-bottom: 0;
}
.eta-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.09);
  border-color: #d9d9d9;
}
.eta-bus-icon {
  font-size: 24px;
  color: #1677ff;
}
.eta-time {
  font-size: 0.9rem;
  font-weight: 500;
  color: #555;
}
.eta-minutes {
  font-size: 2rem;
  font-weight: 700;
  color: #1677ff;
  text-align: right;
}
.eta-remark {
  font-size: 0.8rem;
  color: #888;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  margin-top: 4px;
  display: inline-block;
}
@keyframes flashing {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
.flashing-text {
  animation: flashing 1.5s infinite;
  color: #faad14;
  font-size: 1.2rem;
  font-weight: bold;
}
.direction-toggle .ant-radio-group {
  display: flex;
}
.direction-toggle .ant-radio-button-wrapper {
  flex-grow: 1;
  text-align: center;
}
</style>