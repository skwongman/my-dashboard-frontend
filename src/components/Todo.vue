<template>
  <a-card class="todo-calendar">
    <a-spin :spinning="loadingTodos">
      <div class="calendar-header">
        <a-space>
          <a-button @click="prevMonth" shape="circle" type="text">
            <template #icon><left-outlined /></template>
          </a-button>
          <a-typography-title :level="3" class="month-title">
            {{ monthYear }}
          </a-typography-title>
          <a-button @click="nextMonth" shape="circle" type="text">
            <template #icon><right-outlined /></template>
          </a-button>
        </a-space>
      </div>

      <div class="calendar-grid">
        <div class="calendar-weekdays">
          <div v-for="day in weekDays" :key="day" class="weekday-header">
            {{ day }}
          </div>
        </div>
        <div class="calendar-days">
          <div 
            v-for="(day, index) in flatCalendar" 
            :key="index"
            class="calendar-day"
            :class="{
              'empty-day': !day.date,
              'selected-day': editingDate === day.fullDate,
              'today': isToday(day.fullDate),
              'holiday-day': isHoliday(day.fullDate),
              'drag-over': dragOverDate === day.fullDate
            }"
            @click="day.date && showInlineInput(day.fullDate, $event)"
            @dragover.prevent="onDragOver(day.fullDate)"
            @dragleave="onDragLeave(day.fullDate)"
            @drop="onDrop(day.fullDate)"
          >
            <div v-if="day.date" class="day-content">
              <div class="date-header" style="display: flex; align-items: center; justify-content: flex-end; gap: 4px;">
                <span
                  class="date-number"
                  :class="{ 'sunday-date': isSunday(day.fullDate) }"
                  style="display: flex; align-items: center;"
                >
                  <span style="margin-right: 3px;">{{ day.date }}</span>
                  <span class="day-abbr" v-if="day.date">{{ `(${getDayAbbr(day.fullDate)})` }}</span>
                </span>
                <span v-if="isHoliday(day.fullDate)" style="display: flex; align-items: center;">
                  <heart-filled style="color:#ff4d4f; margin-left:4px;" />
                </span>
              </div>
              <div v-if="isHoliday(day.fullDate)" class="holiday">
                <a-tag color="red" style="font-weight:bold;">
                  {{ getHoliday(day.fullDate) }}
                </a-tag>
              </div>
              <a-list
                size="small"
                :data-source="todosByDate(day.fullDate)"
                class="todo-list"
                bordered
                :split="false"
                v-if="todosByDate(day.fullDate).length"
                style="background:transparent;"
              >
                <template #renderItem="{ item: todo }">
                  <a-list-item
                    class="todo-list-item fancy-todo-item"
                    :class="{
                      'repeat-daily': todo.repeated && todo.daily_repeat,
                      'repeat-weekly': todo.repeated && todo.weekly_repeat,
                      'repeat-monthly': todo.repeated && todo.monthly_repeat,
                      'repeat-yearly': todo.repeated && todo.yearly_repeat
                    }"
                    @mouseenter="todo.hover = true"
                    @mouseleave="todo.hover = false"
                    draggable="true"
                    @dragstart="onDragStart(todo, day.fullDate)"
                  >
                    <div class="todo-left">
                      <a-checkbox 
                        :checked="todo.completed"
                        @change="e => toggleTodo(todo, e.target.checked)" 
                        @click.stop
                      />
                      <!-- <a-avatar
                        size="small"
                        style="background-color: #e6f7ff; color: #1890ff; margin-right: 8px;"
                      >
                        <template v-if="todo.completed">
                          <check-circle-filled style="color:#52c41a;" />
                        </template>
                        <template v-else>
                          <calendar-outlined />
                        </template>
                      </a-avatar> -->
                      <template v-if="editingTodoId !== todo.id">
                        <span 
                          :class="['todo-title-ellipsis', { 'completed-todo': todo.completed }]"
                          @click.stop="handleTodoClick(todo)"
                          @dblclick.stop="handleTodoClick(todo)"
                          style="cursor:pointer"
                        >
                          {{ todo.title }}
                          <!-- <span v-if="todo.repeated" style="margin-left: 6px;">
                            <a-tag color="blue" size="small" style="font-size:11px;">
                              <template v-if="todo.daily_repeat">Daily</template>
                              <template v-else-if="todo.weekly_repeat">Weekly</template>
                              <template v-else-if="todo.monthly_repeat">Monthly</template>
                              <template v-else-if="todo.yearly_repeat">Yearly</template>
                              <template v-else>Repeat</template>
                            </a-tag>
                          </span> -->
                        </span>
                      </template>
                      <template v-else>
                        <a-input
                          v-model:value="editingTodoValue"
                          size="small"
                          @keydown.enter="saveEditTodo(todo)"
                          @keydown.esc="hideEditInputIfNoChange(todo)"
                          @blur="saveEditTodo(todo)"
                          :ref="setEditInputRef(todo.id)"
                          @click.stop
                        />
                      </template>
                    </div>
                    <div class="todo-actions">
                      <a-tooltip title="Delete">
                        <a-popconfirm
                          title="Are you sure to delete this todo?"
                          @confirm="() => { deleteTodo(todo); popconfirmOpenId = null; }"
                          @cancel="() => { popconfirmOpenId = null; }"
                          ok-text="Delete"
                          cancel-text="Cancel"
                          placement="topRight"
                          :open="popconfirmOpenId === todo.id"
                          @openChange="(visible) => { popconfirmOpenId = visible ? todo.id : null; }"
                        >
                          <a-button
                            v-show="todo.hover"
                            type="text"
                            danger
                            size="small"
                            shape="circle"
                            @click.stop="popconfirmOpenId = todo.id"
                            class="delete-btn"
                          >
                            <template #icon><delete-outlined /></template>
                          </a-button>
                        </a-popconfirm>
                      </a-tooltip>
                    </div>
                  </a-list-item>
                </template>
              </a-list>
              <!-- Inline input for adding todo, only show if editingDate matches -->
              <div v-if="editingDate === day.fullDate" class="add-todo-input">
                <a-input
                  v-model:value="inlineTodoInputs[day.fullDate]"
                  placeholder="Add todo"
                  size="small"
                  @keydown.enter="addInlineTodo(day.fullDate)"
                  @keydown.esc="hideInlineInputIfBlank(day.fullDate)"
                  @blur="addInlineTodo(day.fullDate)"
                  @click.stop
                  allow-clear
                  ref="inlineInputRef"
                  :key="editingDate"
                  autofocus
                >
                  <template #prefix>
                    <plus-circle-outlined style="color:#1890ff;" />
                  </template>
                </a-input>
              </div>
            </div>
          </div>
        </div>
      </div>
    </a-spin>
    <!-- Modal for editing todo -->
    <a-modal
      v-model:open="modalVisible"
      title="Edit Todo"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
      :confirm-loading="modalLoading"
      ok-text="Save"
      cancel-text="Cancel"
      destroy-on-close
    >
      <a-form layout="vertical">
        <a-form-item label="Title">
          <a-input
            v-model:value="modalEditTitle"
            placeholder="Edit todo title"
            autofocus
          />
        </a-form-item>
        <a-form-item label="Time">
          <a-time-picker
            v-model:value="modalEditTime"
            format="h:mma"
            :minute-step="5"
            use12-hours
            style="width: 100%;"
          />
        </a-form-item>
        <a-form-item label="Repeat">
          <a-switch v-model:checked="modalEditRepeated" />
        </a-form-item>
        <a-form-item label="Repeat Level" v-if="modalEditRepeated">
          <a-radio-group v-model:value="modalEditRepeatLevel">
            <a-radio value="daily">Daily</a-radio>
            <a-radio value="weekly">Weekly</a-radio>
            <a-radio value="monthly">Monthly</a-radio>
            <a-radio value="yearly">Yearly</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </a-card>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch, onBeforeUnmount } from 'vue';
import {
  LeftOutlined,
  RightOutlined,
  DeleteOutlined,
  CalendarOutlined,
  GiftOutlined,
  PlusCircleOutlined,
  CheckCircleFilled,
  FireOutlined,
  FlagOutlined,
  StarFilled,
  SmileOutlined,
  CrownOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  HeartFilled
} from '@ant-design/icons-vue';
import { 
  Card as ACard, 
  Button as AButton, 
  Space as ASpace, 
  Typography as ATypography,
  Input as AInput,
  Checkbox as ACheckbox,
  Tag as ATag,
  message,
  Spin as ASpin,
  List as AList,
  ListItem as AListItem,
  Badge as ABadge,
  Popconfirm as APopconfirm,
  Avatar as AAvatar,
  Tooltip as ATooltip,
  Modal as AModal,
  TimePicker as ATimePicker,
  Form as AForm,
  FormItem as AFormItem,
  Switch as ASwitch,
  Radio as ARadio,
  RadioGroup as ARadioGroup
} from 'ant-design-vue';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
dayjs.extend(utc)
dayjs.extend(timezone)

const HK_HOLIDAYS = ref([]);
const today = new Date();
const todos = ref([]);
const loadingTodos = ref(true);
const currentMonth = ref(today.getMonth());
const currentYear = ref(today.getFullYear());
const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const editingTodoId = ref(null);
const editingTodoValue = ref('');
const editInputRefs = ref({});
const popconfirmOpenId = ref(null);
const token = localStorage.getItem('token')

const API_URL = import.meta.env.DEV
  ? import.meta.env.VITE_API_URL_LOCAL
  : import.meta.env.VITE_API_URL_LIVE

async function fetchHolidays() {
  try {
    const url = `https://date.nager.at/api/v3/PublicHolidays/${currentYear.value}/HK`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch holidays');
    const data = await res.json();
    HK_HOLIDAYS.value = data.map(h => ({
      date: h.date,
      name: h.localName
    }));
  } catch (e) {
    message.error('Failed to fetch HK holidays');
    HK_HOLIDAYS.value = [];
  }
}

watch(currentYear, fetchHolidays, { immediate: true });

const monthYear = computed(() => {
  return new Date(currentYear.value, currentMonth.value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long'
  });
});

const flatCalendar = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value, 1);
  const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0);
  const days = [];
  
  // Add empty days before the first of the month
  const startDayOfWeek = firstDay.getDay();
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push({});
  }
  
  // Add days of the month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateObj = new Date(currentYear.value, currentMonth.value, d);
    days.push({
      date: d,
      fullDate: `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`,
    });
  }
  
  // Add empty days after the last of the month to complete the grid
  const totalCells = Math.ceil(days.length / 7) * 7;
  while (days.length < totalCells) {
    days.push({});
  }
  
  return days;
});

async function fetchTodos() {
  loadingTodos.value = true;
  try {
    const res = await fetch(`${API_URL}/todo/`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    todos.value = await res.json();
  } catch (e) {
    message.error('Failed to fetch todos');
  } finally {
    loadingTodos.value = false;
  }
}

function todosByDate(date) {
  if (!date) return [];
  return todos.value
    .filter(todo => todo.date === date)
    .sort((a, b) => {
      // If both have time, compare time
      if (a.time && b.time) {
        return a.time.localeCompare(b.time);
      }
      // If only one has time, that one comes after
      if (a.time && !b.time) return 1;
      if (!a.time && b.time) return -1;
      // If neither has time, sort by id as fallback
      return a.id - b.id;
    });
}

function isHoliday(date) {
  return HK_HOLIDAYS.value.some(h => h.date === date);
}

function getHoliday(date) {
  const h = HK_HOLIDAYS.value.find(h => h.date === date);
  return h ? h.name : '';
}

function isToday(date) {
  // 'Asia/Hong_Kong' ensures correct date in HK time
  const hkToday = dayjs().tz('Asia/Hong_Kong').format('YYYY-MM-DD');
  return date === hkToday;
}

// Inline add todo logic
const inlineTodoInputs = ref({});
const editingDate = ref(null);
const inlineInputRef = ref(null);

function showInlineInput(date, event) {
  if (editingDate.value === date) return;
  editingDate.value = date;
  nextTick(() => {
    let inputRef = inlineInputRef.value;
    if (Array.isArray(inputRef)) inputRef = inputRef[0];
    if (inputRef && inputRef.input) {
      inputRef.input.focus();
      inputRef.input.select && inputRef.input.select();
    } else if (inputRef && inputRef.focus) {
      inputRef.focus();
      inputRef.select && inputRef.select();
    } else if (inputRef && inputRef.$el) {
      const el = inputRef.$el.querySelector('input');
      if (el) {
        el.focus();
        el.select && el.select();
      }
    }
  });
  if (event) event.stopPropagation();
}

async function addInlineTodo(date) {
  const value = inlineTodoInputs.value[date];
  if (!value || !value.trim()) {
    inlineTodoInputs.value[date] = '';
    editingDate.value = null;
    return;
  }
  try {
    const res = await fetch(`${API_URL}/todo/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: value,
        completed: false,
        date: date,
        repeated: false,
        daily_repeat: false,
        weekly_repeat: false,
        monthly_repeat: false,
        yearly_repeat: false
      }),
    });
    if (!res.ok) throw new Error('Failed to add todo');
    const todo = await res.json();
    todos.value.push(todo);
    inlineTodoInputs.value[date] = '';
    editingDate.value = null;
    message.success('Todo added successfully');
  } catch (e) {
    message.error('Failed to add todo');
    editingDate.value = null;
  }
}

async function toggleTodo(todo, checked) {
  const wasCompleted = todo.completed;
  todo.completed = checked; // update local state for UI

  try {
    await fetch(`${API_URL}/todo/${todo.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ completed: checked }),
    });
    message.success('Todo updated');

    // If just marked as completed and is repeated, create next occurrence
    if (!wasCompleted && checked && todo.repeated) {
      let nextDate = dayjs(todo.date);
      const originalDay = nextDate.date();

      if (todo.daily_repeat) {
        nextDate = nextDate.add(1, 'day');
      } else if (todo.weekly_repeat) {
        nextDate = nextDate.add(1, 'week');
      } else if (todo.monthly_repeat) {
        nextDate = nextDate.add(1, 'month');
        const daysInMonth = nextDate.daysInMonth();
        nextDate = nextDate.set('date', Math.min(originalDay, daysInMonth));
      } else if (todo.yearly_repeat) {
        nextDate = nextDate.add(1, 'year');
        const daysInMonth = nextDate.daysInMonth();
        nextDate = nextDate.set('date', Math.min(originalDay, daysInMonth));
      } else return;

      const newTodo = {
        title: todo.title,
        completed: false,
        date: nextDate.format('YYYY-MM-DD'),
        time: todo.time,
        repeated: todo.repeated,
        daily_repeat: todo.daily_repeat,
        weekly_repeat: todo.weekly_repeat,
        monthly_repeat: todo.monthly_repeat,
        yearly_repeat: todo.yearly_repeat
      };

      const res = await fetch(`${API_URL}/todo/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newTodo),
      });
      if (res.ok) {
        const created = await res.json();
        todos.value.push(created);
        // message.success('Next repeated todo created');
      }
    }

    // If just unchecked and is repeated, delete the next repeated occurrence
    if (wasCompleted && !checked && todo.repeated) {
      // Find the next repeated todo (same title, time, repeat flags, date > current, not completed)
      const nextTodo = todos.value.find(t =>
        t.id !== todo.id &&
        t.title === todo.title &&
        t.time === todo.time &&
        t.repeated === todo.repeated &&
        t.daily_repeat === todo.daily_repeat &&
        t.weekly_repeat === todo.weekly_repeat &&
        t.monthly_repeat === todo.monthly_repeat &&
        t.yearly_repeat === todo.yearly_repeat &&
        dayjs(t.date).isAfter(todo.date) &&
        !t.completed
      );
      if (nextTodo) {
        await fetch(`${API_URL}/todo/${nextTodo.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        todos.value = todos.value.filter(t => t.id !== nextTodo.id);
        // message.success('Next repeated todo deleted');
      }
    }
  } catch (e) {
    message.error('Failed to update todo');
    todo.completed = !checked; // revert local state if failed
  }
}

async function deleteTodo(todo) {
  try {
    await fetch(`${API_URL}/todo/${todo.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    todos.value = todos.value.filter(t => t.id !== todo.id);
    message.success('Todo deleted');
  } catch (e) {
    message.error('Failed to delete todo');
  }
}

// --- Popconfirm Enter Key Support ---
function handlePopconfirmKeydown(e) {
  if (popconfirmOpenId.value && e.key === 'Enter') {
    const todo = todos.value.find(t => t.id === popconfirmOpenId.value);
    if (todo) {
      deleteTodo(todo);
      popconfirmOpenId.value = null;
    }
  }
}

onMounted(() => {
  fetchTodos();
  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('keydown', handlePopconfirmKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('keydown', handlePopconfirmKeydown);
});

function setEditInputRef(id) {
  return (el) => {
    if (el) editInputRefs.value[id] = el;
  };
}

const clickTimer = ref(null);
function handleTodoClick(todo) {
  if (clickTimer.value) {
    clearTimeout(clickTimer.value);
    clickTimer.value = null;
    openModalEdit(todo);
  } else {
    clickTimer.value = setTimeout(() => {
      startEditTodo(todo);
      clickTimer.value = null;
    }, 250);
  }
}

function startEditTodo(todo) {
  editingTodoId.value = todo.id;
  editingTodoValue.value = todo.title;
  nextTick(() => {
    const inputRef = editInputRefs.value[todo.id];
    if (inputRef && inputRef.focus) {
      inputRef.focus();
      inputRef.select && inputRef.select();
    }
  });
}

async function saveEditTodo(todo) {
  const newValue = editingTodoValue.value.trim();
  if (!newValue || newValue === todo.title) {
    editingTodoId.value = null;
    return;
  }
  try {
    const res = await fetch(`${API_URL}/todo/${todo.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ title: newValue }),
    });
    if (!res.ok) throw new Error('Failed to update todo');
    const updated = await res.json();
    // Update all fields from backend response
    Object.assign(todo, updated);
    message.success('Todo updated');
  } catch (e) {
    message.error('Failed to update todo');
  }
  editingTodoId.value = null;
}

function hideInlineInputIfBlank(date) {
  if (!inlineTodoInputs.value[date] || !inlineTodoInputs.value[date].trim()) {
    editingDate.value = null;
  }
}

function hideEditInputIfNoChange(todo) {
  if (!editingTodoValue.value.trim() || editingTodoValue.value === todo.title) {
    editingTodoId.value = null;
  }
}

function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
}

function handleKeydown(e) {
  // Ignore if input or textarea is focused
  const tag = document.activeElement.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea') return;

  // Support ArrowLeft/ArrowRight and < , > .
  if (e.key === 'ArrowLeft' || e.key === ',' || (e.shiftKey && e.key === '<')) {
    prevMonth();
  } else if (e.key === 'ArrowRight' || e.key === '.' || (e.shiftKey && e.key === '>')) {
    nextMonth();
  }
}

function isSunday(fullDate) {
  if (!fullDate) return false;
  const d = new Date(fullDate);
  return d.getDay() === 0;
}

// --- Drag and Drop logic ---
const draggingTodo = ref(null);
const dragOverDate = ref(null);

function onDragStart(todo, fromDate) {
  draggingTodo.value = { ...todo, fromDate };
}

function onDragOver(date) {
  if (!date) return;
  dragOverDate.value = date;
}

function onDragLeave(date) {
  if (dragOverDate.value === date) {
    dragOverDate.value = null;
  }
}

async function onDrop(targetDate) {
  // Only proceed if targetDate is a valid date string
  if (!targetDate || !draggingTodo.value || draggingTodo.value.date === targetDate) {
    dragOverDate.value = null;
    return;
  }
  try {
    const todo = draggingTodo.value;
    const res = await fetch(`${API_URL}/todo/${todo.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ date: targetDate }),
    });
    if (!res.ok) throw new Error('Failed to move todo');
    // Update local state
    const idx = todos.value.findIndex(t => t.id === todo.id);
    if (idx !== -1) todos.value[idx].date = targetDate;
    message.success('Todo moved');
  } catch (e) {
    message.error('Failed to move todo');
  }
  draggingTodo.value = null;
  dragOverDate.value = null;
}

// --- Modal Edit Logic ---
const modalVisible = ref(false);
const modalEditTodo = ref(null);
const modalLoading = ref(false);

// For modal: split title and use db time
const modalEditTitle = ref('');
const modalEditTime = ref(null);
const modalEditRepeated = ref(false);
const modalEditRepeatLevel = ref('daily');

// Helper: Remove " at ..." from title for editing
function stripAtTime(fullTitle) {
  // Remove " at 9am", " at 9:30pm", etc.
  return fullTitle.replace(/\s*at\s+\d{1,2}(:\d{2})?\s?(am|pm)?$/i, '').trim();
}

// When opening modal, use db time and stripped title, and repeat fields
function openModalEdit(todo) {
  modalEditTodo.value = todo;
  modalEditTitle.value = stripAtTime(todo.title);
  modalEditTime.value = todo.time ? dayjs(todo.time, 'HH:mm:ss') : null;
  modalEditRepeated.value = !!todo.repeated;
  if (todo.daily_repeat) modalEditRepeatLevel.value = 'daily';
  else if (todo.weekly_repeat) modalEditRepeatLevel.value = 'weekly';
  else if (todo.monthly_repeat) modalEditRepeatLevel.value = 'monthly';
  else if (todo.yearly_repeat) modalEditRepeatLevel.value = 'yearly';
  else modalEditRepeatLevel.value = 'daily';
  modalVisible.value = true;
}

// On save, combine title and time, and update both fields in db, plus repeat fields
async function handleModalOk() {
  if (!modalEditTodo.value) return;
  const newTitle = modalEditTitle.value.trim();
  const timeObj = modalEditTime.value;
  let combinedTitle = newTitle;
  let timeStr = '';
  if (timeObj) {
    timeStr = timeObj.format('HH:mm:ss');
    // For display, append " at 9am"/" at 9:30pm"
    combinedTitle += ' at ' + timeObj.format(timeObj.minute() === 0 ? 'ha' : 'h:mma').toLowerCase();
  }
  // Prepare repeat fields
  let repeated = !!modalEditRepeated.value;
  let daily_repeat = false, weekly_repeat = false, monthly_repeat = false, yearly_repeat = false;
  if (repeated) {
    if (modalEditRepeatLevel.value === 'daily') daily_repeat = true;
    else if (modalEditRepeatLevel.value === 'weekly') weekly_repeat = true;
    else if (modalEditRepeatLevel.value === 'monthly') monthly_repeat = true;
    else if (modalEditRepeatLevel.value === 'yearly') yearly_repeat = true;
  }
  // Only update if changed
  const orig = modalEditTodo.value;
  const changed = (
    combinedTitle !== orig.title ||
    timeStr !== (orig.time || '') ||
    repeated !== orig.repeated ||
    daily_repeat !== orig.daily_repeat ||
    weekly_repeat !== orig.weekly_repeat ||
    monthly_repeat !== orig.monthly_repeat ||
    yearly_repeat !== orig.yearly_repeat
  );
  if (!changed) {
    modalVisible.value = false;
    return;
  }
  modalLoading.value = true;
  try {
    const res = await fetch(`${API_URL}/todo/${modalEditTodo.value.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ 
        title: combinedTitle, 
        time: timeStr,
        repeated,
        daily_repeat,
        weekly_repeat,
        monthly_repeat,
        yearly_repeat
      }),
    });
    if (!res.ok) throw new Error('Failed to update todo');
    // Update local state
    orig.title = combinedTitle;
    orig.time = timeStr;
    orig.repeated = repeated;
    orig.daily_repeat = daily_repeat;
    orig.weekly_repeat = weekly_repeat;
    orig.monthly_repeat = monthly_repeat;
    orig.yearly_repeat = yearly_repeat;
    message.success('Todo updated');
    modalVisible.value = false;
  } catch (e) {
    message.error('Failed to update todo');
  } finally {
    modalLoading.value = false;
  }
}

function handleModalCancel() {
  modalVisible.value = false;
}

function getDayAbbr(fullDate) {
  if (!fullDate) return '';
  const d = new Date(fullDate);
  return weekDays[d.getDay()];
}

onMounted(fetchTodos);
</script>

<style scoped>
.todo-calendar {
  max-width: 100%;
  margin: 0 auto;
  background: #f8fafc;
  border-radius: 16px;
  box-shadow: 0 4px 24px 0 rgba(24, 144, 255, 0.08);
  /* padding: 24px; */
}

.calendar-header {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
}

.month-title {
  margin: 0 20px !important;
  text-align: center;
}

.calendar-grid {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-weight: bold;
  margin-bottom: 8px;
}

.weekday-header {
  padding: 8px;
  color: #1890ff;
  font-size: 16px;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.calendar-day {
  min-height: 120px;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  padding: 6px;
  background: #fff;
  transition: box-shadow 0.3s, border 0.3s;
  box-shadow: 0 2px 8px 0 rgba(24, 144, 255, 0.03);
  position: relative;
}

.calendar-day:hover {
  box-shadow: 0 4px 16px 0 rgba(24, 144, 255, 0.08);
  border: 1px solid #91d5ff;
}

.empty-day {
  background-color: #fafafa;
  border: none;
  box-shadow: none;
}

.selected-day {
  background-color: #e6f7ff;
  border: 2px solid #1890ff !important;
}

.today {
  border: 2px solid #52c41a !important;
  background: #f6ffed;
}

.holiday-day {
  border: 2px solid #ff7875 !important;
  background: #fff1f0;
}

.day-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.date-header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 4px;
  font-size: 18px;
}

.date-number {
  font-weight: bold;
  text-align: right;
  font-size: 18px;
}

.holiday {
  margin-bottom: 4px;
  text-align: center;
  width: 100%;
  display: flex;
  justify-content: center;
}

.todo-list {
  background: transparent;
  padding: 0;
  margin: 0;
  flex-grow: 1;
}

.fancy-todo-item {
  border-radius: 8px !important;
  box-shadow: 0 2px 8px 0 rgba(24, 144, 255, 0.06);
  margin-bottom: 6px;
  padding: 6px 10px !important;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: none !important;
  position: relative;
  font-size: 14px;
  font-weight: bold;
  color: #ff4d4f;
}

.fancy-todo-item:hover {
  box-shadow: 0 4px 16px 0 rgba(24, 144, 255, 0.12);
  background: #f0f5ff;
  border: 1px solid #bae7ff;
}

.todo-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Center the icon inside the avatar */
.todo-left .ant-avatar {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 !important;
  line-height: 1 !important;
  font-size: 22px !important; /* Make icon inside avatar bigger */
  width: 32px !important;     /* Slightly larger avatar */
  height: 32px !important;
  min-width: 32px !important;
  min-height: 32px !important;
}

.todo-left .ant-avatar > * {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 22px !important; /* Ensure icon is bigger */
}

.todo-actions {
  display: flex;
  align-items: center;
  height: 100%;
}

/* Center the delete button icon inside its button */
.delete-btn {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  opacity: 0;
  transition: opacity 0.2s;
  padding: 0 !important;
  width: 28px !important;
  height: 28px !important;
  min-width: 28px !important;
  min-height: 28px !important;
}

.fancy-todo-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn .anticon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  width: 100%;
  height: 100%;
}

.completed-todo {
  text-decoration: line-through;
  color: #bfbfbf;
  font-style: italic;
  transition: color 0.2s;
}

.todo-list-item .ant-input {
  font-size: 16px;
  padding: 2px 6px;
  height: 28px;
}

.add-todo-input {
  margin-top: 4px;
}

.sunday-date {
  color: #ff4d4f !important;
}

/* .todo-title-ellipsis {
  display: inline-block;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
} */

.fancy-todo-item:not(.repeat-daily):not(.repeat-weekly):not(.repeat-monthly):not(.repeat-yearly) {
  border: 1px solid #13c2c2 !important;      /* Teal border */
  background: #e6fffb !important;            /* Light teal background */
}
.repeat-daily {
  border: 1px solid #52c41a !important;    /* Green for daily */
  background: #f6ffed;
}
.repeat-weekly {
  border: 1px solid #faad14 !important;    /* Orange for monthly */
  background: #fffbe6;
}
.repeat-monthly {
  border: 1px solid #1890ff !important;    /* Blue for weekly */
  background: #e6f7ff;
}
.repeat-yearly {
  border: 1px solid #eb2f96 !important;    /* Pink for yearly */
  background: #fff0f6;
}
.todo-list.ant-list-bordered {
  border: none !important;
  box-shadow: none !important;
}

/* --- Responsive styles --- */
@media (max-width: 900px) and (min-width: 501px) {
  .calendar-days {
    display: grid;
    grid-template-columns: repeat(3, 1fr); /* 3 columns for tablet */
    gap: 16px;
  }
  .calendar-weekdays {
    display: none; /* Hide weekday headers for tablet for clarity */
  }
  .calendar-day {
    min-height: 140px;
    padding: 16px 10px;
    border-radius: 14px;
    font-size: 18px;
  }
  .date-header,
  .date-number {
    font-size: 22px;
  }
  .holiday {
    font-size: 16px;
  }
  .fancy-todo-item {
    padding: 8px 10px !important;
    /* font-size: 17px; */
    margin-bottom: 8px;
    border-radius: 8px !important;
  }
  .add-todo-input {
    margin-top: 8px;
  }
  .todo-list-item .ant-input {
    font-size: 17px;
    height: 34px;
    padding: 4px 8px;
  }
}

@media (max-width: 700px) {
  .calendar-days {
    gap: 2px;
  }
  .calendar-day {
    min-height: 60px;
    padding: 2px;
    border-radius: 6px;
  }
  .date-header,
  .date-number {
    font-size: 13px;
  }
  .fancy-todo-item {
    padding: 2px 4px !important;
    font-size: 12px;
    margin-bottom: 2px;
    border-radius: 4px !important;
  }
  .todo-list-item .ant-input {
    font-size: 12px;
    height: 22px;
    padding: 1px 3px;
  }
}

@media (min-width: 501px) {
  .day-abbr {
    display: none;
  }
}

/* Mobile: stack days vertically, 1 or 2 columns */
@media (max-width: 500px) {
  .todo-calendar {
    padding: 4px;
    border-radius: 6px;
  }
  .calendar-header {
    margin-bottom: 6px;
  }
  .month-title {
    margin: 0 4px !important;
    font-size: 20px !important;
  }
  .calendar-weekdays {
    display: none; /* Hide weekday headers for mobile */
  }
  .calendar-days {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
    overflow-x: visible;
  }
  .empty-day {
    display: none !important;
  }
  .calendar-day {
    min-height: 100px;
    padding: 12px 8px;
    border-radius: 12px;
    font-size: 16px;
  }
  .date-header,
  .date-number {
    font-size: 20px;
  }
  .holiday {
    font-size: 15px;
  }
  .fancy-todo-item {
    padding: 6px 6px !important;
    /* font-size: 16px; */
    margin-bottom: 6px;
    border-radius: 8px !important;
  }
  .add-todo-input {
    margin-top: 6px;
  }
  .todo-list-item .ant-input {
    font-size: 16px;
    height: 32px;
    padding: 4px 8px;
  }
}

/* Extra small: 1 column */
@media (max-width: 350px) {
  .calendar-days {
    grid-template-columns: 1fr;
    gap: 4px;
  }
  .calendar-day {
    min-height: 60px;
    padding: 2px 1px;
    font-size: 11px;
  }
  .date-header,
  .date-number {
    font-size: 12px;
  }
}
</style>