<template>
  <div class="weight-container">
    <!-- Header Section -->
    <div class="header-section">
      <h2 class="section-title">Weight Tracker</h2>
      <p class="section-subtitle">Monitor your weight progress over time</p>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card current-weight">
        <div class="stat-label">{{ STAT_LABELS.CURRENT_WEIGHT }}</div>
        <div class="stat-value">{{ currentWeight }} kg</div>
      </div>
      <div class="stat-card weight-change">
        <div class="stat-label">{{ STAT_LABELS.WEIGHT_CHANGE_30_DAYS }}</div>
        <div :class="['stat-value', weightChange >= 0 ? 'positive' : 'negative']">
          {{ weightChange >= 0 ? '+' : '' }}{{ weightChange.toFixed(1) }} kg
        </div>
      </div>
    </div>

    <!-- Chart Section -->
    <div class="chart-section">
      <a-card
        :title="'Weight Trend'"
        class="weight-card"
        :body-style="{ padding: '24px' }"
        :head-style="{
          padding: '16px 24px',
          borderBottom: '1px solid #e5e7eb'
        }"
      >
        <template #extra>
          <div class="button-group">
            <a-space size="small">
              <a-button @click="showManageWeightsModal" class="secondary-btn">
                <template #icon><EditOutlined /></template>
                Manage Entries
              </a-button>
              <a-button type="primary" @click="showAddWeightModal" class="add-btn">
                <template #icon><PlusOutlined /></template>
                Add Weight
              </a-button>
            </a-space>
          </div>
        </template>

        <div v-if="weights.length > 0" class="chart-container">
          <Line :data="chartData" :options="chartOptions" />
        </div>
        <div v-else class="empty-state">
          <InboxOutlined style="font-size: 48px; color: #d9d9d9" />
          <p>No weight entries yet. Add your first entry to start tracking!</p>
        </div>
      </a-card>
    </div>

    <!-- Modals -->
    <!-- Add Weight Modal -->
    <a-modal
      v-model:open="modalVisible"
      title="Add New Weight Entry"
      @ok="addWeight"
      :confirm-loading="loading"
      class="custom-modal"
    >
      <a-form :model="newWeight" layout="vertical" class="weight-form">
        <a-form-item label="Weight (kg)" name="weight" class="form-item">
          <a-input-number
            v-model:value="newWeight.weight"
            :min="0"
            :step="0.1"
            placeholder="Enter your weight"
            style="width: 100%"
            :formatter="value => `${value}`.replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',')"
            :parser="value => value.replace(/\\s?\\₩?\\₩?([,.]?)(\\d*)$/, '')"
          />
        </a-form-item>
        <a-form-item label="Date" name="date" class="form-item">
          <a-date-picker
            v-model:value="newWeight.date"
            style="width: 100%"
            :allowClear="false"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- Manage Weights Modal -->
    <a-modal
      v-model:open="manageModalVisible"
      title="Manage Weight Entries"
      :footer="null"
      width="800px"
      class="manage-modal"
    >
      <a-table
        :columns="columns"
        :data-source="weights"
        :row-key="record => record.id"
        :loading="loading"
        :scroll="{ x: true }"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a-popconfirm
              title="Are you sure to delete this entry?"
              ok-text="Yes"
              cancel-text="No"
              @confirm="deleteWeight(record.id)"
            >
              <a-button type="link" danger size="small">
                Delete
              </a-button>
            </a-popconfirm>
          </template>
          <template v-if="column.key === 'date'">
            <span class="date-cell">
              {{ new Date(record.date).toLocaleDateString('en-GB') }}
            </span>
          </template>
          <template v-if="column.key === 'weight'">
            <span class="weight-cell">{{ record.weight }} kg</span>
          </template>
        </template>
      </a-table>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import { message } from 'ant-design-vue';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
} from 'chart.js';
import dayjs from 'dayjs';
import {
  EditOutlined,
  PlusOutlined,
  InboxOutlined
} from '@ant-design/icons-vue';

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement);

const authStore = useAuthStore();
const API_URL = import.meta.env.DEV ? import.meta.env.VITE_API_URL_LOCAL : import.meta.env.VITE_API_URL_LIVE;

const weights = ref([]);
const loading = ref(false);
const modalVisible = ref(false);
const manageModalVisible = ref(false);
const isMobile = ref(false);

const newWeight = reactive({
  weight: null,
  date: dayjs(),
});

const columns = [
  { title: 'Date', dataIndex: 'date', key: 'date', width: 150 },
  { title: 'Weight (kg)', dataIndex: 'weight', key: 'weight', width: 120 },
  { title: 'Action', key: 'action', width: 100 },
];

// Labels for stat cards
const STAT_LABELS = {
  CURRENT_WEIGHT: 'Current Weight',
  WEIGHT_CHANGE_30_DAYS: 'Change (30 days)'
};

// Computed properties for stats
const currentWeight = computed(() => {
  if (weights.value.length === 0) return 0;
  return weights.value[0].weight; // First element since array is sorted newest first
});

const weightChange = computed(() => {
  if (weights.value.length < 2) return 0;
  const recent = weights.value.slice(-30).sort((a, b) => new Date(a.date) - new Date(b.date)); // Last 30 entries sorted by date
  if (recent.length < 2) return 0;
  return recent[recent.length - 1].weight - recent[0].weight;
});

// Handle responsive design
const handleResize = () => {
  isMobile.value = window.innerWidth < 768;
};

const showAddWeightModal = () => {
  newWeight.weight = null;
  newWeight.date = dayjs();
  modalVisible.value = true;
};

const showManageWeightsModal = () => {
  manageModalVisible.value = true;
};

const fetchWeights = async () => {
  loading.value = true;
  try {
    const res = await fetch(`${API_URL}/weight`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    });
    if (!res.ok) throw new Error('Failed to fetch weights');
    weights.value = await res.json();
    // Sort by date descending (newest first)
    weights.value.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (err) {
    message.error(err.message || 'Failed to fetch weights');
  } finally {
    loading.value = false;
  }
};

const addWeight = async () => {
  if (!newWeight.weight || !newWeight.date) {
    message.error('Please enter weight and date');
    return;
  }
  loading.value = true;
  try {
    const res = await fetch(`${API_URL}/weight`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        weight: newWeight.weight,
        date: newWeight.date.format('YYYY-MM-DD'),
      })
    });
    if (!res.ok) throw new Error('Failed to add weight');
    await fetchWeights();
    message.success('Weight added successfully');
    modalVisible.value = false;
  } catch (err) {
    message.error(err.message || 'Failed to add weight');
  } finally {
    loading.value = false;
  }
};

const deleteWeight = async (id) => {
  loading.value = true;
  try {
    const res = await fetch(`${API_URL}/weight/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    });
    if (!res.ok) throw new Error('Failed to delete weight');
    await fetchWeights();
    message.success('Weight record deleted');
  } catch (err) {
    message.error(err.message || 'Failed to delete weight');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchWeights();
  window.addEventListener('resize', handleResize);
  handleResize();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

const chartData = computed(() => {
  // Sort weights by date ascending (oldest first) for proper chart progression
  const sortedWeights = [...weights.value].sort((a, b) => new Date(a.date) - new Date(b.date));

  return {
    labels: sortedWeights.map(w =>
      isMobile.value ? dayjs(w.date).format('MM/DD') : new Date(w.date).toLocaleDateString('en-GB')
    ),
    datasets: [
      {
        label: 'Weight (kg)',
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#3b82f6',
        pointRadius: 4,
        pointHoverRadius: 6,
        data: sortedWeights.map(w => w.weight),
        fill: false,
        tension: 0.4,
        borderWidth: 3,
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      cornerRadius: 8,
      padding: 12,
    },
  },
  scales: {
    y: {
      beginAtZero: false,
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
      },
      ticks: {
        callback: function(value) {
          return value + ' kg';
        }
      }
    },
    x: {
      grid: {
        display: false,
      },
      ticks: {
        maxRotation: isMobile.value ? 45 : 0,
      }
    },
  },
  interaction: {
    intersect: false,
    mode: 'index',
  },
};
</script>

<style scoped>
.weight-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Header Section */
.header-section {
  text-align: center;
  margin-bottom: 32px;
}

.section-title {
  font-size: 28px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.section-subtitle {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-left: 4px solid;
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.current-weight {
  border-left-color: #3b82f6;
}

.weight-change {
  border-left-color: #10b981;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
  font-weight: 500;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #111827;
}

.stat-value.positive {
  color: #059669;
}

.stat-value.negative {
  color: #dc2626;
}

/* Chart Section */
.chart-section {
  margin-bottom: 24px;
}

.weight-card {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: none;
}

.chart-container {
  height: 400px;
  position: relative;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #9ca3af;
  font-size: 16px;
}

/* Buttons */
.secondary-btn {
  border-color: #3b82f6;
  color: #3b82f6;
}

.secondary-btn:hover {
  border-color: #2563eb;
  color: #2563eb;
  background: rgba(59, 130, 246, 0.08);
}

.add-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.add-btn:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

/* Button Group */
.button-group {
  display: flex;
  align-items: center;
}

.button-group :deep(.ant-space) {
  gap: 8px !important;
}

/* Form Styles */
.weight-form {
  padding: 8px 0;
}

.form-item {
  margin-bottom: 20px;
}

.form-item :deep(.ant-form-item-label) {
  font-weight: 500;
  color: #374151;
}

.form-item :deep(.ant-input-number),
.form-item :deep(.ant-picker) {
  border-radius: 8px;
  border: 1px solid #d1d5db;
}

.form-item :deep(.ant-input-number:hover),
.form-item :deep(.ant-picker:hover) {
  border-color: #3b82f6;
}

.form-item :deep(.ant-input-number-focused),
.form-item :deep(.ant-picker-focused) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

/* Modal Styles */
.custom-modal :deep(.ant-modal-header) {
  border-bottom: none;
  padding-bottom: 8px;
}

.custom-modal :deep(.ant-modal-title) {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

.manage-modal :deep(.ant-modal-header) {
  border-bottom: none;
  padding-bottom: 8px;
}

.manage-modal :deep(.ant-modal-title) {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

/* Table Styles */
:deep(.ant-table-thead > tr > th) {
  background: #f8fafc;
  border-bottom: 2px solid #e5e7eb;
  font-weight: 600;
  color: #374151;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background: rgba(59, 130, 246, 0.04);
}

.date-cell {
  font-family: 'SF Mono', Monaco, monospace;
  color: #6b7280;
}

.weight-cell {
  font-weight: 500;
  color: #111827;
}

/* Responsive Design */
@media (max-width: 768px) {
  .weight-container {
    padding: 16px;
  }

  .section-title {
    font-size: 24px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .chart-container {
    height: 300px;
  }

  .stat-value {
    font-size: 20px;
  }
}

@media (max-width: 600px) {
  .weight-card :deep(.ant-card-head) {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .weight-card :deep(.ant-card-extra) {
    align-self: stretch;
    width: 100%;
  }
}

@media (max-width: 480px) {
  .weight-container {
    padding: 12px;
  }

  .chart-container {
    height: 250px;
  }

  .section-title {
    font-size: 20px;
  }
}

@media (max-width: 420px) {
  .weight-card :deep(.ant-card-head) {
    gap: 8px;
  }

  .weight-card :deep(.ant-card-extra) {
    flex-direction: column;
    gap: 8px;
  }

  .weight-card :deep(.ant-space) {
    width: 100%;
    justify-content: space-between;
  }

  .weight-card :deep(.ant-btn) {
    flex: 1;
    min-width: 0;
  }
}
</style>