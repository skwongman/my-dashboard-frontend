<template>
    <div class="p-4 bg-gray-50 rounded-lg">
        <div class="flex flex-col sm:flex-row justify-between items-center mb-4 pb-4 border-b border-gray-200">
            <h1 class="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">TV Schedule</h1>
            <div class="flex flex-wrap justify-center gap-4 items-center">
                <div class="flex items-center gap-2 text-sm text-gray-600">
                    <span title="カード幅">Size</span>
                    <a-slider v-model:value="cardWidth" :min="300" :max="600" :step="10" style="width: 120px" />
                </div>
                <div class="flex flex-wrap justify-center gap-2">
                    <button
                        v-for="btn in filterButtons"
                        :key="btn.value"
                        @click="filter = btn.value"
                        :class="[
                            'px-3 py-1.5 text-xs font-bold rounded-md transition-all text-white',
                            filter !== btn.value ? 'bg-gray-500 hover:bg-gray-600' : ''
                        ]"
                        :style="{ backgroundColor: filter === btn.value ? btn.color : '' }"
                    >
                        {{ btn.label }}
                    </button>
                </div>
                <a-button :loading="loading" @click="fetchData">
                    <template #icon><ReloadOutlined /></template>
                </a-button>
            </div>
        </div>
  
      <div v-if="loading" class="flex justify-center items-center py-32">
        <a-spin size="large" tip="番組表を読み込んでいます..." />
      </div>
  
      <div v-if="error && !loading" class="text-center py-20">
        <a-alert
          message="エラーが発生しました"
          :description="error"
          type="error"
          show-icon
        >
          <template #action>
            <a-button type="primary" @click="fetchData">
              <ReloadOutlined /> 再読み込み
            </a-button>
          </template>
        </a-alert>
      </div>
  
      <div v-if="!loading && !error">
        <div v-if="filteredPrograms.length === 0" class="text-center py-32 text-slate-500">
            <p>現在表示できる番組情報がありません。</p>
        </div>

        <div class="space-y-12">
            <section v-for="(dayPrograms, dateKey) in groupedPrograms" :key="dateKey">
                <div class="flex items-center gap-3 mb-4">
                    <div class="flex flex-col items-center bg-gray-200 rounded-lg px-3 py-1 border border-gray-300 min-w-[3.5rem]">
                        <span class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{{ getMonth(dayPrograms[0].startAt) }}月</span>
                        <span class="text-xl font-bold text-gray-800 leading-none">{{ getDay(dayPrograms[0].startAt) }}</span>
                    </div>
                    <h2 class="text-lg md:text-xl font-bold text-gray-700">
                        {{ getWeekday(dayPrograms[0].startAt) }}曜日
                    </h2>
                    <span class="text-sm text-gray-500 font-mono ml-auto bg-gray-200 px-2 py-1 rounded-full border border-gray-300">
                        {{ dayPrograms.length }}
                    </span>
                </div>

                <!-- Horizontal Draggable Slider -->
                <div 
                    class="flex overflow-x-auto gap-4 py-4 px-1 items-stretch scrollbar-hide snap-x snap-mandatory"
                    :class="{ 'select-none': isDragging }"
                    :style="{ cursor: isDown ? 'grabbing' : 'grab', scrollBehavior: isDragging ? 'auto' : 'smooth' }"
                    @mousedown="handleMouseDown"
                    @mouseleave="handleMouseLeave"
                    @mouseup="handleMouseUp"
                    @mousemove="handleMouseMove"
                >
                    <div v-for="program in dayPrograms" :key="program.id" class="flex-shrink-0 snap-start" :style="{ width: cardWidth + 'px' }">
                        <!-- Start of inlined ProgramCard -->
                        <div
                            class="group flex flex-col h-full bg-white border rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-md hover:shadow-lg"
                                                        @click="openProgramUrl(program)"
                            :class="isProgramOnAir(program) ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 hover:border-gray-300'"
                            >
                            <div class="relative h-[90px] w-full bg-gray-200 overflow-hidden">
                                <img
                                :src="getImgSrc(program)"
                                :alt="program.title"
                                @error="handleImgError(program)"
                                class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                :class="[isProgramOnAir(program) ? 'opacity-100' : 'opacity-95', isDragging ? 'pointer-events-none' : '']"
                                />
                                <div v-if="isProgramOnAir(program)" class="absolute top-1.5 left-1.5 flex items-center gap-1.5 px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded shadow-md animate-pulse">
                                    <span class="w-1.5 h-1.5 bg-white rounded-full"></span>
                                    ON AIR
                                </div>
                                <div v-if="program.isDVR" class="absolute bottom-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 bg-gray-900 rounded text-xs font-medium" style="color: #34d399;">
                                    <PlayCircleOutlined /> 見逃し
                                </div>
                            </div>
                            <div :class="['flex-1 p-2 flex flex-col relative', isDragging ? 'pointer-events-none' : '']">
                                <div class="flex items-center justify-between mb-1.5">
                                <div
                                    class="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-bold text-white shadow-sm"
                                    :style="{ backgroundColor: getBroadcasterColor(program) }"
                                >
                                    <DesktopOutlined />
                                    {{ program.broadcasterName.replace('系', '').replace('テレビ', '') }}
                                </div>
                                <span
                                    class="text-xs px-1.5 py-0.5 rounded border"
                                    :class="getTagColor(program.genreTag)"
                                >
                                    {{ program.genreTag }}
                                </span>
                                </div>
                                <div class="flex items-baseline gap-1 mb-1 text-gray-800">
                                <span class="text-lg font-bold font-mono tracking-tight">{{ formatTime(program.startAt) }}</span>
                                <span class="text-sm text-gray-500 font-mono">~ {{ formatTime(program.endAt) }}</span>
                                </div>
                                <h3 class="text-base font-semibold text-gray-900 mb-1.5 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                                {{ program.seriesTitle }}
                                </h3>
                                <p v-if="program.title !== program.seriesTitle && program.title.trim() !== ''" class="text-sm text-gray-500 mb-2 line-clamp-2 leading-relaxed">
                                {{ program.title }}
                                </p>
                                <div class="mt-auto pt-1.5 border-t border-gray-200/50 flex justify-between items-center text-sm text-gray-400">
                                <div class="flex items-center gap-1">
                                    <ClockCircleOutlined /> {{ getDurationMin(program) }} min
                                </div>
                                <div class="flex gap-2 opacity-60">
                                    <MobileOutlined v-if="program.platforms.includes('ios')" title="Mobile" />
                                    <MonitorOutlined v-if="program.platforms.includes('web')" title="Web" />
                                </div>
                                </div>
                            </div>
                        </div>
                        <!-- End of inlined ProgramCard -->
                    </div>
                </div>
            </section>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onBeforeUnmount, computed, reactive, watch } from 'vue';
  import axios from 'axios';
  import { transformRawData, getHKDate, formatDate, formatTime, getMonth, getDay, getWeekday } from '../utils/tver.js';
  import { ReloadOutlined, PlayCircleOutlined, ClockCircleOutlined, DesktopOutlined, MobileOutlined, MonitorOutlined } from '@ant-design/icons-vue';
  import { message, Spin as ASpin, Alert as AAlert, Button as AButton, Slider as ASlider } from 'ant-design-vue';
  
  const programs = ref([]);
  const loading = ref(true);
  const error = ref(null);
  const filter = ref('ALL');
  const cardWidth = ref(300);
  const dragDistance = ref(0);

  const getChannelCode = (program) => {
    if (!program || !program.broadcasterName) return null;
    if (program.broadcasterName.includes('フジ')) return 'cx';
    if (program.broadcasterName.includes('日テレ')) return 'ntv';
    if (program.broadcasterName.includes('TBS')) return 'tbs';
    if (program.broadcasterName.includes('テレビ東京')) return 'tx';
    if (program.broadcasterName.includes('テレビ朝日')) return 'ex';
    return null;
  }

  const openProgramUrl = (program) => {
    if (dragDistance.value > 10) { 
      return; 
    }
    const code = getChannelCode(program);
    if (code) {
      window.open(`https://tver.jp/live/${code}`, '_blank', 'noopener,noreferrer');
    }
  }

  const filterButtons = [
    { label: 'ALL', value: 'ALL', color: '#4f46e5' },
    { label: 'フジ', value: 'CX', color: '#06b6d4' },
    { label: '日テレ', value: 'NTV', color: '#f59e0b' },
    { label: 'TBS', value: 'TBS', color: '#2563eb' },
    { label: '東京', value: 'TX', color: '#dc2626' },
    { label: '朝日', value: 'EX', color: '#f43f5e' },
  ];

  watch(cardWidth, (newValue) => {
    localStorage.setItem('tvScheduleCardWidth', newValue.toString());
  });
  
  const fetchData = async () => {
    loading.value = true;
    error.value = null;
    try {
      const headers = { 'x-tver-platform-type': 'web' };
      const stations = ['ntv', 'ex', 'tbs', 'tx', 'cx'];
      const requests = stations.map(station => axios.get(`https://service-api.tver.jp/api/v1/callLiveTimeline/${station}`, { headers }));
  
      const responses = await Promise.all(requests);
  
      const allPrograms = responses.flatMap((res, index) => {
        const stationName = {
            'ntv': '日テレ系',
            'ex': 'テレビ朝日系',
            'tbs': 'TBS系',
            'tx': 'テレビ東京系',
            'cx': 'フジテレビ系',
        }[stations[index]];
        return res.data.result?.contents ? transformRawData(res.data.result.contents, stationName) : [];
      });
  
      const now = new Date();
      const filtered = allPrograms
        .filter(p => p.endAt.getTime() > now.getTime() && !p.isSuspended)
        .sort((a, b) => {
          const timeDiff = a.startAt.getTime() - b.startAt.getTime();
          if (timeDiff !== 0) return timeDiff;
          const order = ['フジテレビ', '日テレ', 'TBS', 'テレビ東京', 'テレビ朝日'];
          const aIndex = order.findIndex(name => a.broadcasterName.includes(name));
          const bIndex = order.findIndex(name => b.broadcasterName.includes(name));
          return aIndex - bIndex;
        });
  
      programs.value = filtered;
    } catch (err) {
      console.error(err);
      error.value = err.message || "不明なエラーが発生しました";
      message.error('Failed to fetch TV schedule.');
    } finally {
      loading.value = false;
    }
  };
  
  onMounted(() => {
    const savedWidth = localStorage.getItem('tvScheduleCardWidth');
    if (savedWidth) {
        cardWidth.value = parseInt(savedWidth, 10);
    }
    fetchData();
  });

  const filteredPrograms = computed(() => {
    if (filter.value === 'ALL') return programs.value;
    const filterMap = { 'NTV': '日テレ', 'EX': 'テレビ朝日', 'TBS': 'TBS', 'TX': 'テレビ東京', 'CX': 'フジ' };
    return programs.value.filter(p => p.broadcasterName.includes(filterMap[filter.value]));
  });
  
  const groupedPrograms = computed(() => {
    const groups = {};
    filteredPrograms.value.forEach(program => {
      const hk = getHKDate(program.startAt);
      const dateKey = `${hk.getUTCFullYear()}-${hk.getUTCMonth()}-${hk.getUTCDate()}`;
      if (!groups[dateKey]) { groups[dateKey] = []; }
      groups[dateKey].push(program);
    });
    return groups;
  });

  // --- Inlined ProgramCard Logic ---
  const IMAGE_BASE_URL_FALLBACK = "https://picsum.photos/800/450";
  const imageSources = reactive({});
  const getImgSrc = (program) => imageSources[program.id] || `https://image-cdn.tver.jp/w=600${program.thumbnailUrl}`;
  const handleImgError = (program) => { imageSources[program.id] = IMAGE_BASE_URL_FALLBACK; };
  const isProgramOnAir = (program) => { const now = new Date(); return now >= program.startAt && now <= program.endAt; };
  const getDurationMin = (program) => Math.round((program.endAt.getTime() - program.startAt.getTime()) / 60000);
  
  const getTagColor = (tag) => {
    switch (tag) {
      case 'スペシャル': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ニュース': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'バラエティ': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'ドラマ': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'スポーツ': return 'bg-green-100 text-green-800 border-green-200';
      case 'アニメ': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getBroadcasterColor = (program) => {
    if (program.broadcasterName.includes('日テレ')) return '#f59e0b'; // NTV
    if (program.broadcasterName.includes('テレビ朝日')) return '#f43f5e'; // EX
    if (program.broadcasterName.includes('TBS')) return '#2563eb'; // TBS
    if (program.broadcasterName.includes('テレビ東京')) return '#dc2626'; // TX
    if (program.broadcasterName.includes('フジ')) return '#06b6d4'; // CX
    return '#475569';
  };

  // --- Drag-to-scroll Logic ---
  const isDragging = ref(false);
  const isDown = ref(false);
  const startX = ref(0);
  const scrollLeftStart = ref(0);
  const lastPageX = ref(0);
  const velocity = ref(0);
  const animationFrameId = ref(null);
  let activeSlider = null;

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    const slider = e.currentTarget;
    if (!slider) return;
    activeSlider = slider;
    
    isDown.value = true;
    isDragging.value = true;
    
    cancelMomentum();
    
    dragDistance.value = 0;
    startX.value = e.pageX - slider.offsetLeft;
    scrollLeftStart.value = slider.scrollLeft;
    lastPageX.value = e.pageX;
    velocity.value = 0;
  };

  const handleMouseLeave = () => {
    if (isDown.value) stopDragging();
  };

  const handleMouseUp = () => {
    if (isDown.value) stopDragging();
  };

  const stopDragging = () => {
      if (!isDown.value) return;
      isDown.value = false;

      const applyMomentum = () => {
        if (!activeSlider) {
            isDragging.value = false;
            return;
        };
        
        velocity.value *= 0.97; 
        activeSlider.scrollLeft -= velocity.value;

        if (Math.abs(velocity.value) > 0.5) {
          animationFrameId.value = requestAnimationFrame(applyMomentum);
        } else {
          isDragging.value = false;
          cancelMomentum();
        }
      };
      
      cancelMomentum();
      animationFrameId.value = requestAnimationFrame(applyMomentum);
  };

  const handleMouseMove = (e) => {
    if (!isDown.value || !activeSlider) return;
    e.preventDefault();
    
    const x = e.pageX - activeSlider.offsetLeft;
    const walk = (x - startX.value) * 1.0;
    dragDistance.value = Math.abs(x - startX.value);
    activeSlider.scrollLeft = scrollLeftStart.value - walk;

    velocity.value = e.pageX - lastPageX.value;
    lastPageX.value = e.pageX;
  };

  const cancelMomentum = () => {
    if (animationFrameId.value) {
      cancelAnimationFrame(animationFrameId.value);
      animationFrameId.value = null;
    }
  };

  onBeforeUnmount(() => {
    cancelMomentum();
  });

  </script>
  
  <style scoped>
  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  .cursor-grabbing { cursor: grabbing; }
  .backdrop-blur-sm { --tw-backdrop-blur: blur(4px); backdrop-filter: var(--tw-backdrop-filter); }
  .line-clamp-2 { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
  </style>