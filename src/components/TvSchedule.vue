<template>
    <div class="p-4 bg-gray-50 rounded-lg">
        <!-- Measurement container -->
        <div style="position: absolute; left: -9999px; visibility: hidden;">
            <div
                v-for="(program, index) in programsToMeasure"
                :key="'measure-' + program.id"
                :ref="el => { if (el) cardRefs[index] = el }"
                :style="{ width: cardWidth + 'px' }"
            >
                <ProgramCard :program="program" @ready="onCardReady" />
            </div>
        </div>

        <!-- Header: Title, Filters, Reload Button -->
        <div class="flex flex-col sm:flex-row justify-between items-center mb-4 pb-4 border-b border-gray-200">
            <h1 class="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">TV Schedule</h1>
            <div class="flex flex-wrap justify-center gap-4 items-center">
                 <div class="flex items-center gap-2 text-sm text-gray-600" v-if="viewMode === 'list'">
                    <span title="カード幅">Size</span>
                    <a-slider v-model:value="cardWidth" :min="300" :max="600" :step="10" style="width: 120px" />
                </div>
                <!-- Filter Buttons -->
                <div class="flex flex-wrap justify-center gap-2">
                    <button
                        v-for="btn in filterButtons"
                        :key="btn.value"
                        @click="filter = btn.value"
                        :class="['px-3 py-1.5 text-xs font-bold rounded-md transition-all text-white', filter !== btn.value ? 'bg-gray-500 hover:bg-gray-600' : '']"
                        :style="{ backgroundColor: filter === btn.value ? btn.color : '' }">
                        {{ btn.label }}
                    </button>
                </div>
                 <a-button @click="viewMode = viewMode === 'list' ? 'timeline' : 'list'">
                    <template #icon>
                        <TableOutlined v-if="viewMode === 'list'" />
                        <CalendarOutlined v-else />
                    </template>
                </a-button>
                <!-- Reload Button -->
                <a-button :loading="loading" @click="fetchData">
                    <template #icon><ReloadOutlined /></template>
                </a-button>
            </div>
        </div>
  
        <!-- Loading Spinner -->
        <div v-if="loading" class="flex justify-center items-center py-32">
            <a-spin size="large" tip="番組表を読み込んでいます..." />
        </div>
  
        <!-- Error Alert -->
        <div v-if="error && !loading && !programsToMeasure.length" class="text-center py-20">
            <a-alert message="エラーが発生しました" :description="error" type="error" show-icon>
                <template #action>
                    <a-button type="primary" @click="fetchData"><ReloadOutlined /> 再読み込み</a-button>
                </template>
            </a-alert>
        </div>
  
        <!-- Content Area -->
        <div v-if="!loading && !error">
            <div v-if="filteredPrograms.length === 0 && !programsToMeasure.length" class="text-center py-32 text-slate-500">
                <p>現在表示できる番組情報がありません。</p>
            </div>
            
            <!-- List View -->
            <div v-if="viewMode === 'list'" class="space-y-12">
                <section v-for="(day, dateKey) in groupedPrograms" :key="dateKey">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="flex flex-col items-center bg-gray-200 rounded-lg px-3 py-1 border border-gray-300 min-w-[3.5rem]">
                            <span class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{{ getMonth(day.programs[0].startAt) }}月</span>
                            <span class="text-xl font-bold text-gray-800 leading-none">{{ getDay(day.programs[0].startAt) }}</span>
                        </div>
                        <h2 class="text-lg md:text-xl font-bold text-gray-700">
                            {{ getWeekday(day.programs[0].startAt) }}曜日
                        </h2>
                        <span class="text-sm text-gray-500 font-mono ml-auto bg-gray-200 px-2 py-1 rounded-full border border-gray-300">
                            {{ day.programs.length }}
                        </span>
                    </div>

                    <div 
                        class="flex overflow-x-auto gap-4 py-4 px-1 items-stretch scrollbar-hide"
                        :class="{ 'select-none': isDragging }"
                        :style="{ cursor: isDown ? 'grabbing' : 'grab', scrollBehavior: isDragging ? 'auto' : 'smooth' }"
                        @mousedown="handleMouseDown"
                        @mouseleave="handleMouseLeave"
                        @mouseup="handleMouseUp"
                        @mousemove="handleMouseMove"
                    >
                        <div v-for="program in day.programs" :key="program.id" class="flex-shrink-0" :style="{ width: cardWidth + 'px', willChange: 'transform' }">
                            <div v-if="!program.visible" v-intersect="() => makeProgramVisible(program)" :style="{ height: day.maxHeight + 'px' }"></div>
                            <ProgramCard
                                v-else
                                :program="program"
                                :is-dragging="isDragging"
                                @card-click="openProgramUrl(program)"
                                :style="{ height: day.maxHeight + 'px' }"
                            />
                        </div>
                    </div>
                </section>
            </div>

            <!-- Timeline Calendar View -->
            <div v-if="viewMode === 'timeline'" class="space-y-12">
                 <section v-for="(day, dateKey) in timelineDays" :key="dateKey">
                    <!-- Date Header -->
                    <div class="flex items-center gap-3 mb-4">
                        <div class="flex flex-col items-center bg-gray-200 rounded-lg px-3 py-1 border border-gray-300 min-w-[3.5rem]">
                            <span class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{{ getMonth(day.programs[0].startAt) }}月</span>
                            <span class="text-xl font-bold text-gray-800 leading-none">{{ getDay(day.programs[0].startAt) }}</span>
                        </div>
                        <h2 class="text-lg md:text-xl font-bold text-gray-700">
                            {{ getWeekday(day.programs[0].startAt) }}曜日
                        </h2>
                        <span class="text-sm text-gray-500 font-mono ml-auto bg-gray-200 px-2 py-1 rounded-full border border-gray-300">
                            {{ day.programs.length }}
                        </span>
                    </div>

                    <!-- Timeline Grid -->
                    <div class="relative overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-sm">
                        <!-- Time Header -->
                        <div class="flex sticky top-0 bg-gray-100 z-10 border-b border-gray-200">
                            <div class="w-32 flex-shrink-0 border-r border-gray-200"></div> <!-- Channel column header -->
                            <div class="flex" :style="{ width: day.timeline.durationHours * PIXELS_PER_HOUR + 'px' }">
                                <div v-for="time in day.timeline.timeSlots" :key="time" class="w-48 text-center border-r border-gray-200 p-2 font-mono text-sm text-gray-600">
                                    {{ formatTime(time) }}
                                </div>
                            </div>
                        </div>

                        <!-- Channel Rows -->
                        <div class="">
                            <div v-for="(channelPrograms, channelName) in day.timeline.channels" :key="channelName" class="flex border-b border-gray-200 last:border-b-0">
                                <!-- Channel Name -->
                                <div class="w-32 flex-shrink-0 p-2 border-r border-gray-200 flex items-center justify-center font-bold text-sm bg-gray-50 text-gray-700">
                                    {{ channelName.replace('系', '').replace('テレビ', '') }}
                                </div>
                                <!-- Programs -->
                                <div class="relative flex-grow h-24 bg-gray-50/50" :style="{ width: day.timeline.durationHours * PIXELS_PER_HOUR + 'px' }">
                                    <div v-for="program in channelPrograms" :key="program.id"
                                        class="absolute top-0 h-full p-2 group"
                                        :style="getProgramStyle(program, day.timeline.timelineStart)"
                                    >
                                        <a-popover trigger="hover" :overlayClassName="'!p-0 !-m-2'" :mouseEnterDelay="0.3">
                                            <template #content>
                                                <div class="bg-white rounded-xl overflow-hidden shadow-2xl border border-gray-200" :style="{ width: cardWidth + 'px' }">
                                                    <ProgramCard
                                                        :program="program"
                                                        :is-dragging="false"
                                                        @card-click="openProgramUrl(program)"
                                                    />
                                                </div>
                                            </template>
                                            <div 
                                                @click="openProgramUrl(program)"
                                                class="h-full w-full rounded-lg overflow-hidden shadow-lg flex flex-col text-white transform transition-transform duration-200 ease-in-out hover:scale-105 hover:z-20 cursor-pointer"
                                                :style="{ backgroundColor: getBroadcasterColor(program) }"
                                                :class="{ 'ring-4 ring-red-500 ring-offset-1 ring-offset-gray-50 z-10': isProgramOnAir(program) }"
                                            >
                                                <div v-if="isProgramOnAir(program)" class="absolute top-1 right-1 px-1.5 py-0.5 text-[9px] rounded-full bg-red-600 text-white font-bold z-10 animate-pulse shadow-md">ON AIR</div>
                                                <div class="p-1.5 flex-grow overflow-hidden relative">
                                                    <h3 class="font-bold text-xs leading-tight line-clamp-2 group-hover:underline">{{ program.seriesTitle }}</h3>
                                                    <p v-if="program.title !== program.seriesTitle && program.title" class="text-[10px] opacity-80 leading-snug line-clamp-2">{{ program.title }}</p>
                                                </div>
                                                <div class="bg-black bg-opacity-25 text-[10px] p-1 text-center font-mono mt-auto">
                                                    {{ formatTime(program.startAt) }} - {{ formatTime(program.endAt) }}
                                                </div>
                                            </div>
                                        </a-popover>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

        </div>

        <!-- Detail Modal -->
        <a-modal 
            v-model:visible="isModalVisible" 
            :title="selectedProgramForModal?.seriesTitle"
            :footer="null" 
            width="800px"
            @cancel="handleModalClose"
        >
            <div v-if="isModalLoading" class="flex justify-center items-center py-16">
                <a-spin size="large" tip="詳細を読み込んでいます..." />
            </div>
            <div v-else-if="selectedProgramDetails">
                <div class="relative w-full min-h-[200px] max-h-[300px] bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                    <div v-if="isModalImageLoading" class="absolute inset-0 flex items-center justify-center z-10">
                        <a-spin />
                    </div>
                    <img 
                        :src="getModalImgSrc(selectedProgramForModal)" 
                        :alt="selectedProgramForModal?.seriesTitle" 
                        @load="isModalImageLoading = false"
                        @error="onModalImgError"
                        :class="['w-full h-auto max-h-[300px] object-cover rounded-lg transition-opacity duration-300', isModalImageLoading ? 'opacity-0' : 'opacity-100']" 
                    />
                </div>
                
                <h2 class="text-2xl font-bold mb-1">{{ selectedProgramForModal?.seriesTitle }}</h2>
                <h3 class="text-lg text-gray-600 mb-4">{{ selectedProgramDetails.title }}</h3>

                <div class="flex flex-wrap gap-2 mb-4">
                    <span v-for="tag in selectedProgramDetails.tags" :key="tag.id" class="px-2 py-1 text-xs rounded border bg-gray-100 text-gray-700">
                        {{ tag.name }}
                    </span>
                </div>

                <p class="text-gray-800 whitespace-pre-wrap mb-6 bg-gray-50 p-4 rounded-md border max-h-[200px] overflow-y-auto">{{ selectedProgramDetails.description }}</p>
                
                <div v-if="isTalentsLoading" class="mt-8">
                    <h4 class="text-base font-bold mb-4 text-gray-800 border-b pb-2">出演者</h4>
                    <div class="flex overflow-x-auto gap-4 py-3 scrollbar-hide">
                        <div v-for="i in 8" :key="i" class="text-center flex-shrink-0 w-24">
                            <div class="w-20 h-20 rounded-full bg-gray-200 animate-pulse mx-auto mb-2 shadow-lg"></div>
                            <div class="h-3 bg-gray-200 rounded animate-pulse w-16 mx-auto"></div>
                        </div>
                    </div>
                </div>
                <div v-else-if="selectedProgramTalents.length > 0" class="mt-8">
                    <h4 class="text-base font-bold mb-4 text-gray-800 border-b pb-2">出演者</h4>
                    <div 
                        class="flex overflow-x-auto gap-4 py-3 scrollbar-hide"
                        :class="{ 'select-none': isTalentDragging }"
                        :style="{ cursor: isTalentDown ? 'grabbing' : 'grab', scrollBehavior: isTalentDragging ? 'auto' : 'smooth' }"
                        @mousedown="handleTalentMouseDown"
                        @mouseleave="handleTalentMouseLeave"
                        @mouseup="handleTalentMouseUp"
                        @mousemove="handleTalentMouseMove"
                    >
                        <div v-for="talent in selectedProgramTalents" :key="talent.content.id" class="text-center flex-shrink-0 w-24">
                            <img 
                                :src="talent.content.existsThumbnail ? `https://image-cdn.tver.jp${talent.content.thumbnailPath}` : 'https://cdn-icons-png.flaticon.com/512/149/149071.png'" 
                                :alt="talent.content.name" 
                                draggable="false"
                                class="w-20 h-20 rounded-full object-cover mx-auto mb-2 shadow-lg border-2 border-gray-100"
                                @error="(e) => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }"
                            />
                            <p class="text-xs text-gray-700 font-medium leading-tight line-clamp-2">{{ talent.content.name }}</p>
                        </div>
                    </div>
                </div>

                <a :href="selectedProgramDetails.share.url" target="_blank" rel="noopener,noreferrer" class="w-full block mt-8">
                  <a-button type="primary" block size="large">
                      TVerで視聴する
                  </a-button>
                </a>
            </div>
             <div v-else class="text-center py-16">
                <a-alert message="詳細の読み込みに失敗しました。" type="error" />
            </div>
        </a-modal>

        <!-- Back to Top Button -->
        <a-button
            v-show="showBackToTop"
            class="back-to-top-btn"
            type="primary"
            shape="circle"
            @click="scrollToTop"
            title="回到頂部"
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
import { ref, onMounted, onBeforeUnmount, computed, reactive, watch, nextTick } from 'vue';
import axios from 'axios';
import { transformRawData, getHKDate, formatTime, getMonth, getDay, getWeekday } from '../utils/tver.js';
import { ReloadOutlined, TableOutlined, CalendarOutlined } from '@ant-design/icons-vue';
import { message, Spin as ASpin, Alert as AAlert, Button as AButton, Slider as ASlider, Popover as APopover, Modal as AModal } from 'ant-design-vue';
import ProgramCard from './ProgramCard.vue';

const programs = ref([]);
const programsToMeasure = ref([]);
const cardRefs = ref([]);
let readyCounter = 0;

const loading = ref(true);
const error = ref(null);
const filter = ref('ALL');
const viewMode = ref('list');

// --- Modal State ---
const isModalVisible = ref(false);
const isModalLoading = ref(false);
const isModalImageLoading = ref(false);
const selectedProgramDetails = ref(null);
const selectedProgramForModal = ref(null);
const selectedProgramTalents = ref([]);
const isTalentsLoading = ref(false);
const showBackToTop = ref(false);

// --- List View Specific ---
const cardWidth = ref(300);
const dragDistance = ref(0);

// --- Timeline View Specific ---
const PIXELS_PER_HOUR = 192; // Corresponds to w-48 tailwind class (12rem)
const PIXELS_PER_MS = PIXELS_PER_HOUR / (60 * 60 * 1000);

const getChannelCode = (program) => {
    if (!program || !program.broadcasterName) return null;
    if (program.broadcasterName.includes('フジ')) return 'cx';
    if (program.broadcasterName.includes('日テレ')) return 'ntv';
    if (program.broadcasterName.includes('TBS')) return 'tbs';
    if (program.broadcasterName.includes('テレビ東京')) return 'tx';
    if (program.broadcasterName.includes('テレビ朝日')) return 'ex';
    return null;
}

const fetchProgramTalents = async (programId) => {
    try {
        const memberSid = import.meta.env.VITE_TVER_MEMBER_SID;
        const url = `https://member-api.tver.jp/service/api/v1/callLiveEpisodeTalent/${programId}?member_sid=${memberSid}&require_data=mylist`;
        const headers = { 'x-tver-platform-type': 'web' };
        const response = await axios.get(url, { headers });
        if (response.data.result && response.data.result.contents) {
            selectedProgramTalents.value = response.data.result.contents.filter(c => c.type === 'talent');
        } else {
            selectedProgramTalents.value = [];
        }
    } catch (err) {
        console.error("Failed to fetch program talents:", err);
        selectedProgramTalents.value = []; // Fail silently
    }
};

const fetchProgramDetails = async (programId) => {
    try {
        const response = await axios.get(`https://statics.tver.jp/content/live/${programId}.json?v=2`);
        selectedProgramDetails.value = response.data;
    } catch (err) {
        console.error("Failed to fetch program details:", err);
        message.error("番組詳細の取得に失敗しました。");
        selectedProgramDetails.value = null;
    }
};

const handleModalClose = () => {
    isModalVisible.value = false;
    selectedProgramDetails.value = null;
    selectedProgramForModal.value = null;
    selectedProgramTalents.value = [];
    isModalImageLoading.value = false;
    isTalentsLoading.value = false;
};

const isProgramOnAir = (program) => { const now = new Date(); return now >= program.startAt && now <= program.endAt; };

const openProgramUrl = (program) => {
    if (viewMode.value === 'list' && dragDistance.value > 10) {
        return;
    }

    if (isProgramOnAir(program)) {
        const code = getChannelCode(program);
        if (code) {
            window.open(`https://tver.jp/live/${code}`, '_blank', 'noopener,noreferrer');
        }
    } else {
        if (program.id) {
            selectedProgramForModal.value = program;
            selectedProgramDetails.value = null;
            selectedProgramTalents.value = [];
            isModalLoading.value = true;
            isModalImageLoading.value = true;
            isTalentsLoading.value = true;
            isModalVisible.value = true;
            
            const fetchAllModalData = async () => {
                const detailsPromise = fetchProgramDetails(program.id);
                const talentsPromise = fetchProgramTalents(program.id);

                detailsPromise.finally(() => {
                    isModalLoading.value = false;
                });
                
                talentsPromise.finally(() => {
                    isTalentsLoading.value = false;
                });
                
                await Promise.all([detailsPromise, talentsPromise]);
            };
            fetchAllModalData();
        }
    }
};

const filterButtons = [
    { label: 'ALL', value: 'ALL', color: '#4f46e5' },
    { label: 'フジ', value: 'CX', color: '#06b6d4' },
    { label: '日テレ', value: 'NTV', color: '#f59e0b' },
    { label: 'TBS', value: 'TBS', color: '#2563eb' },
    { label: '東京', value: 'TX', color: '#10b981' },
    { label: '朝日', value: 'EX', color: '#f43f5e' },
];

watch(cardWidth, (newValue) => {
    localStorage.setItem('tvScheduleCardWidth', newValue.toString());
});

const fetchData = async () => {
    loading.value = true;
    error.value = null;
    programs.value = [];
    programsToMeasure.value = [];
    cardRefs.value = [];
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
            })
            .map(p => ({ ...p, visible: false, height: 0 }));

        if (filtered.length > 0) {
            programsToMeasure.value = filtered;
        } else {
            programs.value = [];
            loading.value = false;
        }

    } catch (err) {
        console.error(err);
        error.value = err.message || "不明なエラーが発生しました";
        loading.value = false;
    }
};

const onCardReady = () => {
    readyCounter++;
    if (readyCounter >= programsToMeasure.value.length) {
        measureHeights();
    }
};

const measureHeights = async () => {
    await nextTick();
    const newProgramsData = [...programsToMeasure.value];
    let changed = false;
    cardRefs.value.forEach((el, index) => {
        if (el && newProgramsData[index] && !newProgramsData[index].height) {
            newProgramsData[index].height = el.offsetHeight;
            changed = true;
        }
    });
    
    if(changed) {
        programs.value = newProgramsData;
    }

    programsToMeasure.value = [];
    cardRefs.value = [];
    loading.value = false;
};

const makeProgramVisible = (program) => {
    program.visible = true;
};

onMounted(() => {
    const savedWidth = localStorage.getItem('tvScheduleCardWidth');
    if (savedWidth) {
        cardWidth.value = parseInt(savedWidth, 10);
    }
    const savedView = localStorage.getItem('tvScheduleViewMode');
    if (savedView) {
        viewMode.value = savedView;
    }
    fetchData();
    window.addEventListener('scroll', handleScroll);
});

watch(viewMode, (newMode) => {
    localStorage.setItem('tvScheduleViewMode', newMode);
});

const filteredPrograms = computed(() => {
    const source = programs.value.length ? programs.value : programsToMeasure.value;
    if (filter.value === 'ALL') return source;
    const filterMap = { 'NTV': '日テレ', 'EX': 'テレビ朝日', 'TBS': 'TBS', 'TX': 'テレビ東京', 'CX': 'フジ' };
    return source.filter(p => p.broadcasterName.includes(filterMap[filter.value]));
});

const groupedPrograms = computed(() => {
    const groups = {};
    if (!programs.value.length) return groups;

    filteredPrograms.value.forEach(program => {
        const hk = getHKDate(program.startAt);
        const dateKey = `${hk.getUTCFullYear()}-${hk.getUTCMonth()}-${hk.getUTCDate()}`;
        if (!groups[dateKey]) { 
            groups[dateKey] = { programs: [], maxHeight: 0, timeline: {} };
        }
        groups[dateKey].programs.push(program);
    });

    for (const dateKey in groups) {
        const dayPrograms = groups[dateKey].programs;
        if(dayPrograms.length > 0) {
            const maxH = Math.max(...dayPrograms.map(p => p.height || 0));
            groups[dateKey].maxHeight = maxH > 0 ? maxH : 290; // Fallback height
        }
    }
    return groups;
});

const timelineDays = computed(() => {
    const processedDays = groupedPrograms.value;
    for (const dateKey in processedDays) {
        const day = processedDays[dateKey];
        const dayPrograms = day.programs;
        if (dayPrograms.length === 0) continue;

        let minTime = dayPrograms[0].startAt.getTime();
        let maxTime = dayPrograms[0].endAt.getTime();
        dayPrograms.forEach(p => {
            if (p.startAt.getTime() < minTime) minTime = p.startAt.getTime();
            if (p.endAt.getTime() > maxTime) maxTime = p.endAt.getTime();
        });

        const timelineStart = new Date(minTime);
        timelineStart.setMinutes(0, 0, 0);
        
        const timelineEnd = new Date(maxTime);
        if (timelineEnd.getMinutes() !== 0 || timelineEnd.getSeconds() !== 0 || timelineEnd.getMilliseconds() !== 0) {
            timelineEnd.setHours(timelineEnd.getHours() + 1, 0, 0, 0);
        }

        const durationHours = (timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60);

        const channelOrder = ['フジテレビ系', '日テレ系', 'TBS系', 'テレビ東京系', 'テレビ朝日系'];
        const programsByChannel = channelOrder.reduce((acc, channel) => {
            acc[channel] = [];
            return acc;
        }, {});

        dayPrograms.forEach(p => {
            if (programsByChannel[p.broadcasterName]) {
                programsByChannel[p.broadcasterName].push(p);
            }
        });
        
        const finalChannels = {};
        for (const channelName in programsByChannel) {
            if (programsByChannel[channelName].length > 0) {
                finalChannels[channelName] = programsByChannel[channelName];
            }
        }

        const timeSlots = [];
        for (let i = 0; i < durationHours; i++) {
            const time = new Date(timelineStart.getTime() + i * 60 * 60 * 1000);
            timeSlots.push(time);
        }

        day.timeline = {
            timelineStart,
            durationHours,
            timeSlots,
            channels: finalChannels,
        };
    }
    return processedDays;
});

const getProgramStyle = (program, timelineStart) => {
    const startOffsetMs = program.startAt.getTime() - timelineStart.getTime();
    const durationMs = program.endAt.getTime() - program.startAt.getTime();
    const left = startOffsetMs * PIXELS_PER_MS;
    const width = durationMs * PIXELS_PER_MS;
    return { left: `${left}px`, width: `${width}px` };
};

const imageSources = reactive({});
const getModalImgSrc = (program) => {
  if (!program || !program.thumbnailUrl) return "https://picsum.photos/800/450";
  const cacheKey = program.id + '_modal';
  return imageSources[cacheKey] || `https://image-cdn.tver.jp${program.thumbnailUrl}`;
};

const onModalImgError = () => {
    isModalImageLoading.value = false;
    handleModalImgError(selectedProgramForModal.value);
};

const handleModalImgError = (program) => {
  if (program) {
    const cacheKey = program.id + '_modal';
    imageSources[cacheKey] = "https://picsum.photos/800/450";
  }
};

const getBroadcasterColor = (program) => {
    if (program.broadcasterName.includes('日テレ')) return '#f59e0b';
    if (program.broadcasterName.includes('テレビ朝日')) return '#f43f5e';
    if (program.broadcasterName.includes('TBS')) return '#2563eb';
    if (program.broadcasterName.includes('テレビ東京')) return '#10b981';
    if (program.broadcasterName.includes('フジ')) return '#06b6d4';
    return '#475569';
};

const handleScroll = () => {
    showBackToTop.value = window.scrollY > 300;
};

const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// --- Drag-to-scroll Logic (For List View) ---
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

const handleMouseLeave = () => { if (isDown.value) stopDragging(); };
const handleMouseUp = () => { if (isDown.value) stopDragging(); };

const stopDragging = () => {
    if (!isDown.value) return;
    isDown.value = false;

    if (Math.abs(velocity.value) > 1) {
        const applyMomentum = () => {
            if (!activeSlider) { isDragging.value = false; return; };
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
    } else {
        isDragging.value = false;
    }
};

const handleMouseMove = (e) => {
    if (!isDown.value || !activeSlider) return;
    e.preventDefault();
    const x = e.pageX - activeSlider.offsetLeft;
    const walk = (x - startX.value);
    dragDistance.value = Math.abs(walk);
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
    cancelTalentMomentum();
    window.removeEventListener('scroll', handleScroll);
});

// --- Drag-to-scroll Logic (For Talents List) ---
const isTalentDragging = ref(false);
const isTalentDown = ref(false);
const talentStartX = ref(0);
const talentScrollLeftStart = ref(0);
const talentLastPageX = ref(0);
const talentVelocity = ref(0);
const talentAnimationFrameId = ref(null);
let activeTalentSlider = null;

const handleTalentMouseDown = (e) => {
    if (e.button !== 0) return;
    const slider = e.currentTarget;
    if (!slider) return;
    activeTalentSlider = slider;
    isTalentDown.value = true;
    isTalentDragging.value = true;
    cancelTalentMomentum();
    talentStartX.value = e.pageX - slider.offsetLeft;
    talentScrollLeftStart.value = slider.scrollLeft;
    talentLastPageX.value = e.pageX;
    talentVelocity.value = 0;
};

const handleTalentMouseLeave = () => { if (isTalentDown.value) stopTalentDragging(); };
const handleTalentMouseUp = () => { if (isTalentDown.value) stopTalentDragging(); };

const stopTalentDragging = () => {
    if (!isTalentDown.value) return;
    isTalentDown.value = false;
    
    if (Math.abs(talentVelocity.value) > 1) {
        const applyMomentum = () => {
            if (!activeTalentSlider) { isTalentDragging.value = false; return; };
            talentVelocity.value *= 0.97; 
            activeTalentSlider.scrollLeft -= talentVelocity.value;
            if (Math.abs(talentVelocity.value) > 0.5) {
                talentAnimationFrameId.value = requestAnimationFrame(applyMomentum);
            } else {
                isTalentDragging.value = false;
                cancelTalentMomentum();
            }
        };
        cancelTalentMomentum();
        talentAnimationFrameId.value = requestAnimationFrame(applyMomentum);
    } else {
        isTalentDragging.value = false;
    }
};

const handleTalentMouseMove = (e) => {
    if (!isTalentDown.value || !activeTalentSlider) return;
    e.preventDefault();
    const x = e.pageX - activeTalentSlider.offsetLeft;
    const walk = (x - talentStartX.value);
    activeTalentSlider.scrollLeft = talentScrollLeftStart.value - walk;
    talentVelocity.value = e.pageX - talentLastPageX.value;
    talentLastPageX.value = e.pageX;
};

const cancelTalentMomentum = () => {
    if (talentAnimationFrameId.value) {
        cancelAnimationFrame(talentAnimationFrameId.value);
        talentAnimationFrameId.value = null;
    }
};
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
.cursor-grabbing { cursor: grabbing; }
.line-clamp-2 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
}
.line-clamp-3 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
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
</style>
