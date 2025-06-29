<template>
  <div class="asset-dashboard">
    <!-- Header Section -->
    <header class="asset-header">
      <div class="header-left">
        <wallet-outlined class="header-icon" />
        <div>
          <div class="header-title">My Asset Dashboard</div>
          <div class="header-subtitle">Track your income and expenses easily</div>
        </div>
      </div>
      <div class="header-right">
        <a-button
          type="primary"
          shape="round"
          size="large"
          @click="openAddModal"
          style="background: #3a7bd5"
        >
          <template #icon>
            <plus-outlined />
          </template>
          Add Record
        </a-button>
      </div>
    </header>

    <!-- Summary Card -->
    <a-card
      class="asset-summary-card"
      :body-style="{ padding: '24px 32px', background: 'linear-gradient(90deg, #3a7bd5 100%, #00d2ff 100%)' }"
    >
      <div class="summary-content">
        <div>
          <div class="summary-label" style="color: #f0f6ff;">Total Asset Value</div>
          <div
            class="summary-value"
            style="color: #fff; text-shadow: 0 2px 8px rgba(0,0,0,0.12); min-width: 180px; display: flex; align-items: center; gap: 8px;"
          >
            <template v-if="loading">
              <a-skeleton
                :paragraph="false"
                :title="{ width: '160px', style: { height: '38px', borderRadius: '8px', margin: 0 } }"
                active
                style="display: inline-block;"
              />
            </template>
            <template v-else>
              <span v-if="showValues">{{ formatCurrency(search ? filteredAsset : totalAsset) }}</span>
              <span v-else>•••••••••</span>
            </template>
            <span
              @click="toggleShowValues"
              style="cursor: pointer; display: flex; align-items: center; margin-left: 8px; user-select: none; min-width: 28px;"
            >
              <eye-outlined v-if="showValues" style="font-size: 20px; color: #fff; opacity: 0.85;" />
              <eye-invisible-outlined v-else style="font-size: 20px; color: #fff; opacity: 0.85;" />
            </span>
          </div>
        </div>
        <div class="summary-breakdown">
          <div>
            <span class="breakdown-label" style="color: #e0f7fa;">Income</span>
            <span
              class="breakdown-value income"
              style="color: #43e97b; display: inline-flex; align-items: center; min-width: 110px;"
            >
              <template v-if="loading">
                <a-skeleton
                  :paragraph="false"
                  :title="{ width: '100px', style: { height: '28px', borderRadius: '8px', margin: 0 } }"
                  active
                  style="display: inline-block;"
                />
              </template>
              <template v-else>
                <span v-if="showValues">{{ formatCurrency(search ? filteredIncome : totalIncome) }}</span>
                <span v-else>••••••</span>
              </template>
            </span>
          </div>
          <div>
            <span class="breakdown-label" style="color: #ffe0e3;">Expenditure</span>
            <span
              class="breakdown-value expenditure"
              style="color: #ff6a6a; display: inline-flex; align-items: center; min-width: 110px;"
            >
              <template v-if="loading">
                <a-skeleton
                  :paragraph="false"
                  :title="{ width: '100px', style: { height: '28px', borderRadius: '8px', margin: 0 } }"
                  active
                  style="display: inline-block;"
                />
              </template>
              <template v-else>
                <span v-if="showValues">{{ formatCurrency(search ? filteredExpenditure : totalExpenditure) }}</span>
                <span v-else>••••••</span>
              </template>
            </span>
          </div>
        </div>
      </div>
    </a-card>


    <!-- Table Section -->
    <a-card class="asset-table-card" :body-style="{ padding: '0' }">
      <div class="table-header">
        <span class="table-title">Transaction Records</span>
        <a-input-search
          v-model:value="search"
          placeholder="Search description..."
          style="width: 240px"
          allow-clear
        />
      </div>
      <a-table
        :columns="columns"
        :data-source="pagedData"
        :pagination="pagination"
        :loading="loading"
        row-key="id"
        size="middle"
        class="asset-table"
        :scroll="{ x: 800 }"
      >
        <template #bodyCell="{ column, text, record }">
          <template v-if="column.dataIndex === 'date'">
            <span>{{ dayjs(text).format('DD MMMM YYYY') }}</span>
          </template>
          <template v-else-if="column.dataIndex === 'amount'">
            <span v-if="showValues" :class="text > 0 ? 'amount-income' : 'amount-expenditure'">
              {{ formatCurrency(text) }}
            </span>
            <span v-else :class="text > 0 ? 'amount-income' : 'amount-expenditure'">•••••••••</span>
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-button
              type="text"
              size="small"
              @click="openEditModal(record)"
              style="color: #1677ff"
              title="Edit"
            >
              <template #icon>
                <edit-outlined />
              </template>
            </a-button>
            <a-popconfirm title="Delete this record?" @confirm="() => handleDelete(record.id)">
              <a-button
                type="text"
                size="small"
                style="color: #ff4d4f"
                title="Delete"
              >
                <template #icon>
                  <delete-outlined />
                </template>
              </a-button>
            </a-popconfirm>
          </template>
          <template v-else>
            {{ text }}
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- Modal for Add/Edit -->
    <a-modal
      v-model:open="showModal"
      :title="isEdit ? 'Edit Record' : 'Add Record'"
      @ok="handleOk"
      @cancel="showModal = false"
      :ok-button-props="{ type: 'primary', shape: 'round' }"
      :cancel-button-props="{ shape: 'round' }"
    >
      <a-form layout="vertical" class="asset-form">
        <a-form-item label="Date">
          <a-date-picker v-model:value="form.date" style="width: 100%" format="YYYY-MM-DD" />
        </a-form-item>
        <a-form-item label="Description">
          <a-input v-model:value="form.description" />
        </a-form-item>
        <a-form-item label="Type">
          <a-select v-model:value="form.type">
            <a-select-option value="Income">Income</a-select-option>
            <a-select-option value="Expenditure">Expenditure</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="Amount">
          <a-input-number v-model:value="form.amount" style="width: 100%" :formatter="value => value && value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { WalletOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons-vue'
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

// Currency formatter
function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

const loading = ref(true);

const showModal = ref(false);
const isEdit = ref(false);
const form = ref({
  id: null,
  date: '',
  description: '',
  type: 'Income',
  amount: null,
});

function resetForm() {
  form.value = {
    id: null,
    date: '',
    description: '',
    type: 'Income',
    amount: null,
  };
}

// --- API helpers ---
const API_URL = import.meta.env.DEV
  ? import.meta.env.VITE_API_URL_LOCAL
  : import.meta.env.VITE_API_URL_LIVE

function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.token || ''}`,
  };
}

// --- Pagination state ---
const data = ref([]);
const currentPage = ref(1);
const pageSize = 5;
const totalItems = ref(0);
const totalPages = ref(1);

const totalIncome = ref(0);
const totalExpenditure = ref(0);
const totalAsset = ref(0);

// --- Search ---
const search = ref('');

const showValues = ref(
  localStorage.getItem('asset_show_values') !== 'false'
);

// --- Data fetching with API pagination ---
async function fetchAssets(page = 1) {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page,
    });
    const res = await fetch(`${API_URL}/asset?${params.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch assets');
    const result = await res.json();
    data.value = result.assets.sort((a, b) => b.date.localeCompare(a.date));
    currentPage.value = result.currentPage;
    totalItems.value = result.totalItems;
    totalPages.value = result.totalPages;

    // Set totals from backend
    totalIncome.value = result.totalIncome || 0;
    totalExpenditure.value = result.totalExpenditure || 0;
    totalAsset.value = result.totalAsset || 0;
  } catch (e) {
    message.error('Failed to load assets');
  } finally {
    setTimeout(() => {
      loading.value = false;
    }, 500);
  }
}

onMounted(() => {
  fetchAssets(1);
  window.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown);
});

// --- Filtered data (for search, only filters current page if API does not support search) ---
const filteredData = computed(() => {
  if (!search.value) return data.value;
  return data.value.filter(item =>
    item.description?.toLowerCase().includes(search.value.toLowerCase())
  );
});

// --- Table columns ---
const columns = [
  { title: 'Date', dataIndex: 'date', key: 'date', width: 120 },
  { title: 'Description', dataIndex: 'description', key: 'description', ellipsis: true },
  { title: 'Type', dataIndex: 'type', key: 'type', width: 120 },
  { title: 'Amount', dataIndex: 'amount', key: 'amount', align: 'right', width: 140 },
  { title: 'Actions', key: 'actions', align: 'center', width: 120 },
];

// --- Table pagination config ---
const pagination = computed(() => {
  if (search.value) {
    // When searching, paginate filteredData on frontend
    return {
      current: currentPage.value,
      total: filteredData.value.length,
      pageSize,
      showTotal: undefined, // Remove total text
      showSizeChanger: false,
      onChange: (page) => {
        currentPage.value = page;
      },
    };
  }
  // Default: backend pagination
  return {
    current: currentPage.value,
    total: totalItems.value,
    pageSize,
    showTotal: undefined, // Remove total text
    showSizeChanger: false,
    onChange: (page) => {
      currentPage.value = page;
      fetchAssets(page);
    },
  };
});

// --- Table data for current page ---
const pagedData = computed(() => {
  if (search.value) {
    // Paginate filteredData on frontend
    const start = (currentPage.value - 1) * pageSize;
    return filteredData.value.slice(start, start + pageSize);
  }
  // Default: backend paginated data
  return data.value;
});

// Reset to page 1 when search changes
watch(search, () => {
  currentPage.value = 1;
});

// --- Modal handlers ---
function openAddModal() {
  resetForm();
  isEdit.value = false;
  showModal.value = true;
}

function openEditModal(record) {
  form.value = { ...record };
  form.value.date = dayjs(record.date, 'YYYY-MM-DD');
  isEdit.value = true;
  showModal.value = true;
}

// --- CRUD handlers ---
async function handleOk() {
  if (!form.value.date || !form.value.description || !form.value.type || form.value.amount === null) {
    message.error('Please fill all fields');
    return;
  }
  let payload = { ...form.value };
  if (typeof payload.date === 'object' && payload.date.format) {
    // Combine selected date with current HK time (UTC+8) using only dayjs
    const selectedDate = payload.date.format('YYYY-MM-DD');
    // Get current UTC time, then add 8 hours for HK time
    const nowHK = dayjs.utc().add(8, 'hour');
    const timePart = nowHK.format('HH:mm:ss');
    payload.date = `${selectedDate}T${timePart}+08:00`; // <-- add +08:00
  }
  try {
    if (isEdit.value) {
      const res = await fetch(`${API_URL}/asset/${payload.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update');
      message.success('Record updated');
    } else {
      const res = await fetch(`${API_URL}/asset/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to add');
      message.success('Record added');
    }
    showModal.value = false;
    resetForm();
    await fetchAssets(currentPage.value);
  } catch (e) {
    message.error(e.message || 'Operation failed');
  }
}

async function handleDelete(id) {
  try {
    const res = await fetch(`${API_URL}/asset/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete');
    message.success('Record deleted');
    await fetchAssets(currentPage.value);
  } catch (e) {
    message.error(e.message || 'Delete failed');
  }
}

// --- Keyboard navigation for pagination (fix: only trigger if not in input/textarea) ---
function handleKeydown(e) {
  const tag = document.activeElement.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea') return;
  // Support ArrowLeft/ArrowRight and < , > .
  if (e.key === 'ArrowLeft' || e.key === ',' || (e.shiftKey && e.key === '<')) {
    if (currentPage.value > 1) {
      if (search.value) {
        currentPage.value -= 1;
      } else {
        fetchAssets(currentPage.value - 1);
      }
    }
  } else if (e.key === 'ArrowRight' || e.key === '.' || (e.shiftKey && e.key === '>')) {
    if (search.value) {
      const maxPage = Math.ceil(filteredData.value.length / pageSize);
      if (currentPage.value < maxPage) {
        currentPage.value += 1;
      }
    } else {
      // Prevent going past totalPages.value
      if (currentPage.value < totalPages.value) {
        fetchAssets(currentPage.value + 1);
      }
    }
  }
}

// --- Summary values based on filtered data (for search) ---
const filteredIncome = computed(() =>
  filteredData.value
    .filter(item => item.type === 'Income')
    .reduce((sum, item) => sum + Number(item.amount), 0)
);

const filteredExpenditure = computed(() =>
  filteredData.value
    .filter(item => item.type === 'Expenditure')
    .reduce((sum, item) => sum + Number(item.amount), 0)
);

const filteredAsset = computed(() =>
  filteredIncome.value - filteredExpenditure.value
);

function toggleShowValues() {
  showValues.value = !showValues.value;
  localStorage.setItem('asset_show_values', showValues.value);
}

// --- Watch search (if API supports search, fetch from API) ---
watch(search, (val) => {
  currentPage.value = 1;
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
  }, 500); // Adjust delay as needed
});
</script>

<style scoped>
.asset-dashboard {
  /* max-width: auto;  <-- REMOVE THIS LINE */
  max-width: 100%;     /* Match Todo.vue style */
  margin: 0 auto;
  /* padding: 32px 16px 48px 16px; */
  background: #f6f8fa;
  /* min-height: 100vh; <-- REMOVE THIS LINE */
  box-sizing: border-box;
  overflow-x: hidden;
}
.asset-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding: 0 8px;
}
.header-left {
  display: flex;
  align-items: center;
}
.header-icon {
  font-size: 40px;
  color: #1677ff;
  background: #e6f4ff;
  border-radius: 12px;
  padding: 10px;
  margin-right: 18px;
  box-shadow: 0 2px 8px rgba(22,119,255,0.10);
}
.header-title {
  font-size: 22px;
  font-weight: 700;
  color: #222;
  letter-spacing: 0.5px;
}
.header-subtitle {
  font-size: 14px;
  color: #888;
  margin-top: 2px;
}
.header-right {
  display: flex;
  align-items: center;
}
.asset-summary-card {
  border-radius: 16px;
  margin-bottom: 28px;
  box-shadow: 0 4px 24px rgba(22,119,255,0.10);
  border: none;
}
.asset-summary-card,
.asset-summary-card .ant-card-body,
.asset-summary-card .ant-card {
  border-radius: 16px !important;
  overflow: hidden;
}
.summary-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.summary-label {
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  opacity: 0.85;
  letter-spacing: 0.5px;
}
.summary-value {
  color: #fff;
  font-size: 32px;
  font-weight: 700;
  margin-top: 4px;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 8px rgba(0,0,0,0.10);
}
.summary-breakdown {
  display: flex;
  gap: 32px;
}
.breakdown-label {
  color: #e6f4ff;
  font-size: 15px;
  margin-right: 6px;
}
.breakdown-value {
  font-size: 25px;
  font-weight: 600;
  display: flex;
  align-items: center;
  min-height: 28px;
}
:deep(.ant-skeleton .ant-skeleton-title) {
  background: rgba(255,255,255,0.35) !important;
}
:deep(.ant-skeleton .ant-skeleton-title::after) {
  background: linear-gradient(90deg, rgba(255,255,255,0.55) 25%, rgba(255,255,255,0.25) 37%, rgba(255,255,255,0.55) 63%) !important;
}
.breakdown-value.income {
  color: #52c41a;
}
.breakdown-value.expenditure {
  color: #ff4d4f;
}
.asset-table-card {
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(22,119,255,0.06);
  border: none;
  margin-bottom: 32px;
}
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
}
.table-title {
  font-size: 18px;
  font-weight: 600;
  color: #222;
}
.asset-table {
  padding: 0 16px 16px 16px;
}
.amount-income {
  color: #52c41a;
  font-weight: 600;
  vertical-align: middle;
  display: inline-block;
}
.amount-expenditure {
  color: #ff4d4f;
  font-weight: 600;
  vertical-align: middle;
  display: inline-block;
}
.type-income {
  color: #52c41a;
  font-weight: 500;
}
.type-expenditure {
  color: #ff4d4f;
  font-weight: 500;
}
.asset-form .ant-form-item {
  margin-bottom: 18px;
}
.header-right .ant-btn {
  display: flex;
  align-items: center;
  /* gap: 8px; */
}

.header-right .ant-btn .anticon {
  display: flex;
  align-items: center;
  font-size: 18px; /* Optional: match text size */
  line-height: 1;
  /* margin-right: 4px; */
  position: relative;
  top: 0; /* Adjust if needed, e.g. top: 1px; */
}

.asset-table-card .ant-pagination {
  display: flex !important;
  justify-content: center !important;
  margin: 24px 0 16px 0 !important;
}
.asset-table-card :deep(.ant-pagination) {
  display: flex !important;
  justify-content: center !important;
  margin: 24px 0 16px 0 !important;
}

.table-header :deep(.ant-input-search .anticon-search) {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  height: 24px;         /* Match your input height if needed */
  line-height: 1;
  position: relative;
  top: 1px;             /* Fine-tune vertical alignment */
}

.table-header :deep(.ant-input-affix-wrapper .ant-input-clear-icon) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  height: 100%;
  font-size: 13px; /* Optional: adjust size if needed */
  top: 0 !important;
  transform: none !important;
}

@media (max-width: 600px) {
  .asset-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 0 2px;
    width: 100%;
  }
  .header-left {
    flex-direction: row;
    align-items: flex-start;
    width: 100%;
    gap: 10px;
  }
  .header-icon {
    flex-shrink: 0;
  }
  .header-left > div {
    min-width: 0;
    flex: 1 1 0%;
  }
  .header-title,
  .header-subtitle {
    white-space: normal;
    word-break: break-word;
    overflow-wrap: break-word;
    width: 100%;
    display: block;
  }
  .header-title {
    font-size: 17px;
  }
  .header-subtitle {
    font-size: 13px;
  }
  .header-right {
    width: 100%;
    justify-content: flex-start;
  }
  .asset-dashboard {
    padding: 20px 4px 32px 4px;
  }

  /* --- Add these styles below --- */
  .asset-summary-card .summary-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    word-break: break-word;
    flex-wrap: wrap;
  }
  .summary-label {
    font-size: 14px;
  }
  .summary-value {
    font-size: 22px;
    word-break: break-word;
    min-width: 110px !important; /* Reduce from 180px */
    gap: 4px !important;         /* Reduce gap between skeleton and icon */
  }
  .summary-breakdown {
    gap: 18px;
    flex-direction: row;
    flex-wrap: wrap;
  }
  .breakdown-value {
    font-size: 18px;
  }
  .asset-summary-card :deep(.ant-skeleton .ant-skeleton-title) {
    width: 90px !important;
    height: 22px !important;
    border-radius: 6px !important;
  }
  .summary-breakdown :deep(.ant-skeleton .ant-skeleton-title) {
    width: 60px !important;
    height: 16px !important;
    border-radius: 5px !important;
  }
}
</style>