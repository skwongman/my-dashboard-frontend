<template>
  <div class="diary-page">
    <a-page-header title="Diary" class="diary-header" />
    <div class="diary-actions">
      <a-button type="primary" @click="showCreateModal" class="diary-new-btn">
        <template #icon>
          <span class="material-symbols-outlined">add_circle</span>
        </template>
        New Diary
      </a-button>
    </div>
    <div class="diary-list">
      <transition-group name="fade" tag="div" class="diary-cards">
        <div
          v-for="diary in diaries"
          :key="diary.id"
          class="diary-card"
        >
          <div class="diary-card-header">
            <div>
              <span class="diary-title">{{ diary.post_title }}</span>
              <span
                class="diary-status"
                :class="{
                  publish: diary.post_status === 'publish',
                  draft: diary.post_status === 'draft'
                }"
              >
                {{ diary.post_status }}
              </span>
            </div>
            <span class="diary-date">
              <span class="material-symbols-outlined">calendar_month</span>
              {{ formatDate(diary.post_date) }}
            </span>
          </div>
          <div class="diary-card-content">
            {{ diary.post_content.length > 120
              ? diary.post_content.slice(0, 120) + '...'
              : diary.post_content
            }}
          </div>
          <div class="diary-card-actions">
            <a-button size="small" @click="viewDiary(diary)">
              <span class="material-symbols-outlined">visibility</span>
              View
            </a-button>
            <a-button size="small" @click="editDiary(diary)">
              <span class="material-symbols-outlined">edit</span>
              Edit
            </a-button>
            <a-popconfirm
              title="Are you sure to delete this diary?"
              @confirm="deleteDiary(diary.id)"
            >
              <a-button size="small" danger>
                <span class="material-symbols-outlined">delete</span>
                Delete
              </a-button>
            </a-popconfirm>
          </div>
        </div>
      </transition-group>
      <div v-if="!diaries.length" class="diary-empty">
        <img src="https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/notebook.svg" alt="No Diaries" />
        <p>No diary entries yet. Click "New Diary" to create your first entry!</p>
      </div>
    </div>
    <div class="diary-pagination">
      <a-pagination
        :current="currentPage"
        :total="totalPages"
        :page-size="1"
        @change="fetchDiaries"
        show-less-items
      />
    </div>

    <!-- View/Edit/Create Modal -->
    <a-modal
      v-model:open="modalVisible"
      :title="modalTitle"
      @ok="handleModalOk"
      :confirm-loading="modalLoading"
      @cancel="resetModal"
      destroy-on-close
      :width="500"
      class="diary-modal"
    >
      <a-form
        v-if="modalMode !== 'view'"
        :model="modalForm"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
        ref="modalFormRef"
      >
        <a-form-item label="Title" name="post_title" :rules="[{ required: true, message: 'Title required' }]">
          <a-input v-model:value="modalForm.post_title" />
        </a-form-item>
        <a-form-item label="Content" name="post_content" :rules="[{ required: true, message: 'Content required' }]">
          <a-textarea v-model:value="modalForm.post_content" rows="4" />
        </a-form-item>
        <a-form-item label="Status" name="post_status">
          <a-select v-model:value="modalForm.post_status">
            <a-select-option value="publish">Publish</a-select-option>
            <a-select-option value="draft">Draft</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
      <div v-else class="diary-modal-view">
        <h2>{{ modalForm.post_title }}</h2>
        <div class="diary-modal-meta">
          <span>
            <span class="material-symbols-outlined">calendar_month</span>
            {{ formatDate(modalForm.post_date) }}
          </span>
          <span
            class="diary-status"
            :class="{
              publish: modalForm.post_status === 'publish',
              draft: modalForm.post_status === 'draft'
            }"
          >
            {{ modalForm.post_status }}
          </span>
        </div>
        <div class="diary-modal-content">
          {{ modalForm.post_content }}
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import axios from 'axios'

const diaries = ref([])
const currentPage = ref(1)
const totalItems = ref(0)
const pageSize = 10
const totalPages = ref(1)
const token = localStorage.getItem('token')

const API_URL = import.meta.env.DEV
  ? import.meta.env.VITE_API_URL_LOCAL
  : import.meta.env.VITE_API_URL_LIVE

// Modal state
const modalVisible = ref(false)
const modalMode = ref('view') // 'view' | 'edit' | 'create'
const modalTitle = ref('')
const modalLoading = ref(false)
const modalForm = reactive({
  id: null,
  post_title: '',
  post_content: '',
  post_status: 'publish',
  post_date: ''
})
const modalFormRef = ref(null)

function resetModal() {
  modalVisible.value = false
  modalMode.value = 'view'
  modalTitle.value = ''
  modalLoading.value = false
  Object.assign(modalForm, {
    id: null,
    post_title: '',
    post_content: '',
    post_status: 'publish',
    post_date: ''
  })
}

async function fetchDiaries(page = 1) {
  try {
    currentPage.value = page
    const res = await axios.get(`${API_URL}/diary?page=${page}`, {
      headers: {
      Authorization: `Bearer ${token}`
      }
    })
    diaries.value = res.data.diaries.map(diary => ({
      ...diary,
      id: diary.id || diary.ID
    }))
    totalItems.value = res.data.totalItems
    totalPages.value = res.data.totalPages // <-- Add this line
  } catch (err) {
    message.error('Failed to fetch diaries')
  }
}

function showCreateModal() {
  resetModal()
  modalMode.value = 'create'
  modalTitle.value = 'Create Diary'
  modalVisible.value = true
}

function viewDiary(record) {
  Object.assign(modalForm, {
    ...record,
    id: record.id || record.ID
  })
  modalMode.value = 'view'
  modalTitle.value = 'View Diary'
  modalVisible.value = true
}

function editDiary(record) {
  Object.assign(modalForm, {
    ...record,
    id: record.id || record.ID
  })
  modalMode.value = 'edit'
  modalTitle.value = 'Edit Diary'
  modalVisible.value = true
}

async function handleModalOk() {
  if (modalMode.value === 'view') {
    modalVisible.value = false
    return
  }
  modalLoading.value = true
  try {
    if (modalMode.value === 'create') {
      await axios.post(`${API_URL}/diary`, {
        post_title: modalForm.post_title,
        post_content: modalForm.post_content,
        post_status: modalForm.post_status,
        post_author: 1, // Replace with actual user if needed
        post_date: new Date().toISOString(),
        post_date_gmt: new Date().toISOString(),
        post_modified: new Date().toISOString(),
        post_modified_gmt: new Date().toISOString()
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      message.success('Diary created')
    } else if (modalMode.value === 'edit') {
      await axios.put(`${API_URL}/diary/${modalForm.id}`, {
        post_title: modalForm.post_title,
        post_content: modalForm.post_content,
        post_status: modalForm.post_status,
        post_modified: new Date().toISOString(),
        post_modified_gmt: new Date().toISOString()
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      message.success('Diary updated')
    }
    modalVisible.value = false
    fetchDiaries(currentPage.value)
  } catch (err) {
    message.error('Operation failed')
  } finally {
    modalLoading.value = false
  }
}

async function deleteDiary(id) {
  try {
    await axios.delete(`${API_URL}/diary/${id}`, {
      headers: {
      Authorization: `Bearer ${token}`
      }
    })
    message.success('Diary deleted')
    fetchDiaries(currentPage.value)
  } catch (err) {
    message.error('Delete failed')
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

onMounted(() => {
  fetchDiaries()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700&family=Roboto:wght@400;500&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined');

.diary-page {
  font-family: 'Montserrat', 'Roboto', Arial, sans-serif;
  background: linear-gradient(120deg, #f8fafc 0%, #e0e7ff 100%);
  min-height: 100vh;
  padding: 0 32px 40px 32px;
  box-sizing: border-box;
}

.diary-header {
  background: transparent;
  margin-bottom: 12px;
}

.diary-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 24px;
}

.diary-new-btn {
  background: #d1fae5;
  color: #059669;
  font-weight: 600;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.97rem;
  border: none;
  border-radius: 8px;
  box-shadow: 0 1px 4px 0 rgba(80,112,255,0.06);
  padding: 0 18px;
  height: 36px;
  line-height: 36px;
  transition: background 0.18s, color 0.18s;
}
.diary-new-btn:hover,
.diary-new-btn:focus {
  background: #059669;
  color: #fff;
}

.diary-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.diary-cards {
  display: grid;
  grid-template-columns: repeat(4, minmax(340px, 1fr));
  gap: 40px;
  width: 100%;
  max-width: 1800px;
  margin: 0 auto;
  justify-content: center;
  align-items: stretch;
  min-height: 60vh;
  box-sizing: border-box;
}

.diary-card {
  background: #fff;
  border-radius: 22px;
  box-shadow: 0 6px 32px 0 rgba(80, 112, 255, 0.10), 0 2px 8px 0 rgba(80, 112, 255, 0.06);
  padding: 36px 28px 28px 28px;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.2s, transform 0.2s;
  position: relative;
  min-height: 320px;
  height: 100%;
  box-sizing: border-box;
}

.diary-card:hover {
  box-shadow: 0 12px 40px 0 rgba(80, 112, 255, 0.18), 0 4px 16px 0 rgba(80, 112, 255, 0.10);
  transform: translateY(-6px) scale(1.025);
}

.diary-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 14px;
}

.diary-title {
  font-size: 1.13rem;
  font-weight: 700;
  color: #2d3a4b;
  margin-right: 12px;
}

.diary-status {
  font-size: 0.88rem;
  font-weight: 600;
  padding: 3px 12px;
  border-radius: 14px;
  text-transform: capitalize;
  margin-left: 4px;
  background: #e0e7ff;
  color: #4f46e5;
  vertical-align: middle;
}
.diary-status.publish {
  background: #d1fae5;
  color: #059669;
}
.diary-status.draft {
  background: #fef3c7;
  color: #b45309;
}

.diary-date {
  font-size: 0.97rem;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 4px;
}

.diary-card-content {
  color: #374151;
  font-size: 1rem;
  margin-bottom: 18px;
  margin-top: 8px;
  min-height: 64px;
  flex: 1 1 auto;
  white-space: pre-line;
  word-break: break-word;
}

.diary-card-actions {
  display: flex;
  gap: 12px;
  margin-top: auto;
}

/* View button: follow "publish" (public) style, no border */
.diary-card-actions .ant-btn:not(.ant-btn-dangerous):first-child {
  background: #d1fae5;
  color: #059669;
  font-weight: 600;
  border: none;
  font-size: 0.97rem;
}
.diary-card-actions .ant-btn:not(.ant-btn-dangerous):first-child:hover {
  background: #059669;
  color: #fff;
}

/* Edit button: follow "draft" (private) style, no border */
.diary-card-actions .ant-btn:not(.ant-btn-dangerous):nth-child(2) {
  background: #fef3c7;
  color: #b45309;
  font-weight: 600;
  border: none;
  font-size: 0.97rem;
}
.diary-card-actions .ant-btn:not(.ant-btn-dangerous):nth-child(2):hover {
  background: #b45309;
  color: #fff;
}

/* Delete button: red, but softer for consistency, no border */
.diary-card-actions .ant-btn-dangerous {
  background: #fee2e2;
  color: #dc2626;
  font-weight: 600;
  border: none;
  font-size: 0.97rem;
}
.diary-card-actions .ant-btn-dangerous:hover {
  background: #dc2626;
  color: #fff;
}

.diary-card-actions .ant-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  border-radius: 8px;
  transition: background 0.18s, color 0.18s, box-shadow 0.18s;
  box-shadow: 0 1px 4px 0 rgba(80,112,255,0.06);
  padding: 0 14px;
  height: 34px;
  line-height: 34px;
}

.diary-empty {
  text-align: center;
  margin-top: 60px;
  color: #64748b;
}
.diary-empty img {
  width: 80px;
  margin-bottom: 16px;
  opacity: 0.7;
}

.diary-pagination {
  margin-top: 36px;
  display: flex;
  justify-content: center;
}

.fade-enter-active, .fade-leave-active {
  transition: all 0.4s cubic-bezier(.25,.8,.25,1);
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.98);
}

.diary-modal .ant-modal-content {
  border-radius: 22px;
  padding: 36px 20px 20px 20px;
}

.diary-modal-view h2 {
  font-size: 1.18rem;
  font-weight: 700;
  margin-bottom: 12px;
  color: #2d3a4b;
}
.diary-modal-meta {
  display: flex;
  gap: 18px;
  align-items: center;
  margin-bottom: 16px;
  color: #64748b;
}
.diary-modal-content {
  font-size: 1.02rem;
  color: #374151;
  white-space: pre-line;
  word-break: break-word;
  margin-top: 8px;
}

.material-symbols-outlined {
  font-family: 'Material Symbols Outlined';
  font-weight: normal;
  font-style: normal;
  font-size: 1.1em;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  direction: ltr;
  -webkit-font-feature-settings: 'liga';
  -webkit-font-smoothing: antialiased;
  vertical-align: middle;
}

/* Large tablet: 3 cards per row */
@media (max-width: 1600px) {
  .diary-cards {
    grid-template-columns: repeat(3, minmax(340px, 1fr));
    max-width: 1300px;
    gap: 32px;
  }
}

/* Tablet: 2 cards per row */
@media (max-width: 1100px) {
  .diary-page {
    padding-left: 12px;
    padding-right: 12px;
  }
  .diary-cards {
    grid-template-columns: repeat(2, minmax(320px, 1fr));
    gap: 24px;
    max-width: 900px;
  }
  .diary-modal .ant-modal-content {
    padding: 24px 10px 24px 10px;
  }
}

/* Mobile: 1 card per row */
@media (max-width: 700px) {
  .diary-page {
    padding-left: 2px;
    padding-right: 2px;
  }
  .diary-header {
    padding: 0 4px;
  }
  .diary-cards {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 0 0;
    max-width: 100%;
  }
  .diary-card {
    padding: 16px 16px 12px 16px;
    min-height: 90px;
  }
  .diary-title {
    font-size: 1rem;
  }
  .diary-status {
    font-size: 0.8rem;
    padding: 2px 8px;
  }
  .diary-date {
    font-size: 0.9rem;
  }
  .diary-card-content {
    font-size: 0.92rem;
    margin-bottom: 12px;
    margin-top: 6px;
    min-height: 40px;
  }
  .diary-card-actions .ant-btn,
  .diary-new-btn {
    font-size: 0.92rem;
    padding: 0 10px;
    height: 30px;
    line-height: 30px;
  }
  .diary-modal .ant-modal-content {
    padding: 10px 2px 10px 2px;
  }
}
</style>