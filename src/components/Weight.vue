<template>
  <div>
    <a-card title="Weight Trend" class="weight-card">
      <template #extra>
        <a-space>
          <a-button @click="showManageWeightsModal">Manage Entries</a-button>
          <a-button type="primary" @click="showAddWeightModal">Add Weight</a-button>
        </a-space>
      </template>
      <div style="height: 400px">
        <Line :data="chartData" :options="chartOptions" />
      </div>
    </a-card>

    <!-- Add Weight Modal -->
    <a-modal
      v-model:open="modalVisible"
      title="Add New Weight Entry"
      @ok="addWeight"
      :confirm-loading="loading"
    >
      <a-form :model="newWeight" layout="vertical" class="mt-4">
        <a-form-item label="Weight (kg)" name="weight">
          <a-input-number v-model:value="newWeight.weight" :min="0" :step="0.1" style="width: 100%" />
        </a-form-item>
        <a-form-item label="Date" name="date">
          <a-date-picker v-model:value="newWeight.date" style="width: 100%" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- Manage Weights Modal (for deleting) -->
    <a-modal
      v-model:open="manageModalVisible"
      title="Manage Weight Entries"
      :footer="null"
      width="800px"
    >
      <a-table :columns="columns" :data-source="weights" :row-key="record => record.id" :loading="loading" :scroll="{ x: true }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a-popconfirm title="Are you sure to delete this entry?" @confirm="deleteWeight(record.id)">
              <a-button type="primary" danger size="small">Delete</a-button>
            </a-popconfirm>
          </template>
          <template v-if="column.key === 'date'">
            {{ new Date(record.date).toLocaleDateString('en-GB') }}
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
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement } from 'chart.js';
import dayjs from 'dayjs';

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement);

const authStore = useAuthStore();
const API_URL = import.meta.env.DEV ? import.meta.env.VITE_API_URL_LOCAL : import.meta.env.VITE_API_URL_LIVE;

const weights = ref([]);
const loading = ref(false);
const modalVisible = ref(false); // For adding weight
const manageModalVisible = ref(false); // For managing (deleting) weights
const isMobile = ref(false); // New state for mobile detection

const newWeight = reactive({
  weight: null,
  date: dayjs(),
});

const columns = [
  { title: 'Date', dataIndex: 'date', key: 'date' },
  { title: 'Weight (kg)', dataIndex: 'weight', key: 'weight' },
  { title: 'Action', key: 'action' },
];

const handleResize = () => {
  isMobile.value = window.innerWidth < 768; // Adjust breakpoint as needed
};

const showAddWeightModal = () => {
  // Reset form when opening modal
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
    modalVisible.value = false; // Close modal on success
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
  handleResize(); // Set initial state
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

const chartData = computed(() => ({
  labels: weights.value.map(w =>
    isMobile.value ? dayjs(w.date).format('DD/MM/YY') : new Date(w.date).toLocaleDateString('en-GB')
  ),
  datasets: [
    {
      label: 'Weight (kg)',
      backgroundColor: '#1890ff',
      borderColor: '#1890ff',
      data: weights.value.map(w => w.weight),
      fill: false,
      tension: 0.1,
    },
  ],
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
};
</script>

<style scoped>
.weight-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}
</style>