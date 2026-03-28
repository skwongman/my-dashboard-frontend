<template>
  <div class="transport-container">
    <a-card class="profile-card" :bordered="false" :title="`港鐵${lineData[currentLine].name_zh}抵站時間`">
      <template #extra>
        <div class="card-extra-content">
          <span v-if="lastUpdated" class="last-updated-time">
            最後更新時間：{{ lastUpdated }}
          </span>
          <a-button type="text" :loading="loading" @click="fetchData" title="刷新">
            <ReloadOutlined />
          </a-button>
        </div>
      </template>

      <a-button type="primary" @click="toggleLine" block class="line-toggle-btn">
        {{ `切換至${lineData[currentLine === 'EAL' ? 'SIL' : 'EAL'].name_zh}` }}
      </a-button>

      <a-select
        v-model:value="selectedStation"
        placeholder="選擇車站"
        style="width: 100%; margin-bottom: 24px"
        :options="stationOptions"
        @change="fetchData"
      ></a-select>

      <a-row :gutter="[16, 16]">
        <!-- Left Column -->
        <a-col :xs="24" :lg="12">
          <div class="direction-header">
            <component :is="leftColumn.icon" />
            <span>{{ leftColumn.label }}</span>
          </div>
          <div v-if="loading && !leftColumn.arrivals.length" class="loading-placeholder">
            <a-spin />
          </div>
          <div v-else-if="leftColumn.arrivals.length">
            <a-card
              v-for="(train, index) in leftColumn.arrivals"
              :key="`left-${index}`"
              class="arrival-card"
            >
              <div class="arrival-info">
                <div class="info-item">
                  <span class="label">目的地</span>
                  <span class="value dest">
                    <TrainIcon class="train-icon" /> {{ train.destName }}
                  </span>
                </div>
                <div class="info-item text-center">
                  <span class="label">月台</span>
                  <span class="value">{{ train.plat }}</span>
                </div>
                <div class="info-item text-right">
                  <span class="label">預計到站</span>
                  <span
                    class="value time"
                    :class="{ 'arriving-soon': train.ttnt <= 0 }"
                  >
                    <template v-if="train.ttnt <= 0">即將到達</template>
                    <template v-else>{{ train.ttnt }} 分鐘</template>
                  </span>
                </div>
              </div>
            </a-card>
          </div>
          <div v-else class="no-data">
            <span>暫無服務</span>
          </div>
        </a-col>

        <!-- Right Column -->
        <a-col :xs="24" :lg="12">
          <div class="direction-header">
            <component :is="rightColumn.icon" />
            <span>{{ rightColumn.label }}</span>
          </div>
          <div v-if="loading && !rightColumn.arrivals.length" class="loading-placeholder">
            <a-spin />
          </div>
          <div v-else-if="rightColumn.arrivals.length">
            <a-card
              v-for="(train, index) in rightColumn.arrivals"
              :key="`right-${index}`"
              class="arrival-card"
            >
              <div class="arrival-info">
                <div class="info-item">
                  <span class="label">目的地</span>
                  <span class="value dest">
                    <TrainIcon class="train-icon" /> {{ train.destName }}
                  </span>
                </div>
                <div class="info-item text-center">
                  <span class="label">月台</span>
                  <span class="value">{{ train.plat }}</span>
                </div>
                <div class="info-item text-right">
                  <span class="label">預計到站</span>
                  <span
                    class="value time"
                    :class="{ 'arriving-soon': train.ttnt <= 0 }"
                  >
                    <template v-if="train.ttnt <= 0">即將到達</template>
                    <template v-else>{{ train.ttnt }} 分鐘</template>
                  </span>
                </div>
              </div>
            </a-card>
          </div>
           <div v-else class="no-data">
            <span>暫無服務</span>
          </div>
        </a-col>
      </a-row>
    </a-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, h, computed } from "vue";
import { message } from "ant-design-vue";
import {
  ReloadOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons-vue";

// Custom Train Icon Component
const TrainIcon = () => h('span', { class: 'anticon' }, '🚆');

const loading = ref(true);
const currentLine = ref('EAL');
const selectedStation = ref("FAN"); // Default to Fanling
const upArrivals = ref([]);
const downArrivals = ref([]);
const lastUpdated = ref(null);
let intervalId = null;

const lineData = {
  EAL: {
    name_zh: '東鐵線',
    stations: [
      { code: 'ADM', name: 'Admiralty', name_zh: '金鐘' },
      { code: 'EXC', name: 'Exhibition Centre', name_zh: '會展' },
      { code: 'HUH', name: 'Hung Hom', name_zh: '紅磡' },
      { code: 'MKK', name: 'Mong Kok East', name_zh: '旺角東' },
      { code: 'KOT', name: 'Kowloon Tong', name_zh: '九龍塘' },
      { code: 'TAW', name: 'Tai Wai', name_zh: '大圍' },
      { code: 'SHT', name: 'Sha Tin', name_zh: '沙田' },
      { code: 'FOT', name: 'Fo Tan', name_zh: '火炭' },
      { code: 'RAC', name: 'Racecourse', name_zh: '馬場' },
      { code: 'UNI', name: 'University', name_zh: '大學' },
      { code: 'TAP', name: 'Tai Po Market', name_zh: '大埔墟' },
      { code: 'TWO', name: 'Tai Wo', name_zh: '太和' },
      { code: 'FAN', name: 'Fanling', name_zh: '粉嶺' },
      { code: 'SHS', name: 'Sheung Shui', name_zh: '上水' },
      { code: 'LOW', name: 'Lo Wu', name_zh: '羅湖' },
      { code: 'LMC', name: 'Lok Ma Chau', name_zh: '落馬洲' },
    ],
    up_label: '往羅湖 / 落馬洲方向',
    down_label: '往金鐘方向'
  },
  SIL: {
    name_zh: '南港島線',
    stations: [
      { code: 'ADM', name: 'Admiralty', name_zh: '金鐘' },
      { code: 'OCP', name: 'Ocean Park', name_zh: '海洋公園' },
      { code: 'WCH', name: 'Wong Chuk Hang', name_zh: '黃竹坑' },
      { code: 'LET', name: 'Lei Tung', name_zh: '利東' },
      { code: 'SOH', name: 'South Horizons', name_zh: '海怡半島' },
    ],
    up_label: '往海怡半島方向',
    down_label: '往金鐘方向'
  }
};

const stationOptions = computed(() => {
    const stations = lineData[currentLine.value].stations;
    if (currentLine.value === 'EAL') {
        const mainLineStations = stations.filter(s => s.code !== 'LOW' && s.code !== 'LMC');
        const reversedMainline = [...mainLineStations].reverse();
        return reversedMainline.map(s => ({ value: s.code, label: s.name_zh }));
    }
    return stations.map(s => ({ value: s.code, label: s.name_zh }));
});

const leftColumn = computed(() => {
    if (currentLine.value === 'SIL') {
        return {
            label: lineData.SIL.up_label,
            arrivals: upArrivals.value,
            icon: ArrowDownOutlined
        };
    }
    return {
        label: lineData.EAL.down_label,
        arrivals: downArrivals.value,
        icon: ArrowDownOutlined
    };
});

const rightColumn = computed(() => {
    if (currentLine.value === 'SIL') {
        return {
            label: lineData.SIL.down_label,
            arrivals: downArrivals.value,
            icon: ArrowUpOutlined
        };
    }
    return {
        label: lineData.EAL.up_label,
        arrivals: upArrivals.value,
        icon: ArrowUpOutlined
    };
});

const getStationNameZh = (code) => {
    const allStations = [...lineData.EAL.stations, ...lineData.SIL.stations];
    const station = allStations.find(s => s.code === code);
    return station ? station.name_zh : code;
}

const toggleLine = () => {
    currentLine.value = currentLine.value === 'EAL' ? 'SIL' : 'EAL';
    if (currentLine.value === 'EAL') {
        selectedStation.value = 'FAN'; 
    } else {
        selectedStation.value = lineData.SIL.stations[0].code;
    }
    upArrivals.value = [];
    downArrivals.value = [];
    fetchData();
}

const formatTime = (date) => {
    return date.toLocaleTimeString('zh-HK', {
        hour12: true,
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit'
    });
}

const fetchData = async () => {
  if (!selectedStation.value) return;
  
  if (upArrivals.value.length === 0 && downArrivals.value.length === 0) {
      loading.value = true;
  }

  try {
    const response = await fetch(`https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=${currentLine.value}&sta=${selectedStation.value}`);
    if (!response.ok) throw new Error("Network error");
    const data = await response.json();

    lastUpdated.value = formatTime(new Date());

    if (data.status === 0 || !data.data) {
        upArrivals.value = [];
        downArrivals.value = [];
        return;
    }

    const arrivals = data.data[`${currentLine.value}-${selectedStation.value}`];
    
    downArrivals.value = (arrivals?.DOWN || []).map(train => ({...train, destName: getStationNameZh(train.dest)}));
    upArrivals.value = (arrivals?.UP || []).map(train => ({...train, destName: getStationNameZh(train.dest)}));

  } catch (error) {
    message.error("無法獲取港鐵數據。");
    upArrivals.value = [];
    downArrivals.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchData();
  intervalId = setInterval(fetchData, 5000);
});

onUnmounted(() => {
    if (intervalId) {
        clearInterval(intervalId);
    }
});
</script>

<style scoped>
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

.card-extra-content {
    display: flex;
    align-items: center;
    gap: 16px;
    color: white;
}
.last-updated-time {
    font-size: 0.9rem;
}
:deep(.card-extra-content .ant-btn) {
    color: white !important;
}

.line-toggle-btn {
    margin-bottom: 16px;
    background-color: #fadb14;
    border-color: #fadb14;
    color: #000000;
}

.line-toggle-btn:hover,
.line-toggle-btn:focus {
    background-color: #fadb14;
    border-color: #fadb14;
    color: #000000;
    opacity: 0.9;
}

.direction-header {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background-color: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 6px;
  color: #0050b3;
}

.arrival-card {
  border: 1px solid #e8e8e8;
  margin-bottom: 12px;
  border-radius: 6px;
}

:deep(.arrival-card .ant-card-body) {
  padding: 12px;
}

.arrival-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-item:nth-child(1) { /* Destination */
  flex: 1 1 50%;
  text-align: left;
}
.info-item:nth-child(2) { /* Platform */
  flex: 0 0 25%;
  text-align: center;
}
.info-item:nth-child(3) { /* Arrival Time */
  flex: 0 0 25%;
  text-align: right;
}

.info-item .label {
  font-size: 0.8rem;
  color: #888;
  margin-bottom: 4px;
}

.info-item .value {
  font-size: 1.1rem;
  font-weight: bold;
}
.info-item .value.dest {
  display: flex;
  align-items: center;
  gap: 8px;
}
.train-icon {
    font-size: 1.2rem;
}
.info-item .value.time {
  color: #1890ff;
}

.arriving-soon {
  color: #ffc53d !important;
  animation: flash 1.5s infinite;
}

@keyframes flash {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.text-center {
  text-align: center;
}
.text-right {
  text-align: right;
}
.loading-placeholder, .no-data {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100px;
    color: #888;
    background-color: #fafafa;
    border-radius: 6px;
}
</style>