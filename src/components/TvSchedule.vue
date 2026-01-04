<template>
    <div class="p-4 bg-gray-50 rounded-lg">
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
        <div v-if="error && !loading" class="text-center py-20">
            <a-alert message="エラーが発生しました" :description="error" type="error" show-icon>
                <template #action>
                    <a-button type="primary" @click="fetchData"><ReloadOutlined /> 再読み込み</a-button>
                </template>
            </a-alert>
        </div>
  
        <!-- Content Area -->
        <div v-if="!loading && !error">
            <div v-if="filteredPrograms.length === 0" class="text-center py-32 text-slate-500">
                <p>現在表示できる番組情報がありません。</p>
            </div>
            
            <!-- List View -->
            <div v-if="viewMode === 'list'" class="space-y-12">
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
                            <div
                                class="group flex flex-col h-full bg-white border rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-md hover:shadow-lg cursor-pointer"
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
                        </div>
                    </div>
                </section>
            </div>

            <!-- Timeline Calendar View -->
            <div v-if="viewMode === 'timeline'" class="space-y-12">
                <section v-for="(timeline, dateKey) in timelineDays" :key="dateKey">
                    <!-- Date Header -->
                    <div class="flex items-center gap-3 mb-4">
                        <div class="flex flex-col items-center bg-gray-200 rounded-lg px-3 py-1 border border-gray-300 min-w-[3.5rem]">
                            <span class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{{ getMonth(timeline.dayPrograms[0].startAt) }}月</span>
                            <span class="text-xl font-bold text-gray-800 leading-none">{{ getDay(timeline.dayPrograms[0].startAt) }}</span>
                        </div>
                        <h2 class="text-lg md:text-xl font-bold text-gray-700">
                            {{ getWeekday(timeline.dayPrograms[0].startAt) }}曜日
                        </h2>
                        <span class="text-sm text-gray-500 font-mono ml-auto bg-gray-200 px-2 py-1 rounded-full border border-gray-300">
                            {{ timeline.dayPrograms.length }}
                        </span>
                    </div>

                    <!-- Timeline Grid -->
                    <div class="relative overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-sm">
                        <!-- Time Header -->
                        <div class="flex sticky top-0 bg-gray-100 z-10 border-b border-gray-200">
                            <div class="w-32 flex-shrink-0 border-r border-gray-200"></div> <!-- Channel column header -->
                            <div class="flex" :style="{ width: timeline.durationHours * PIXELS_PER_HOUR + 'px' }">
                                <div v-for="time in timeline.timeSlots" :key="time" class="w-48 text-center border-r border-gray-200 p-2 font-mono text-sm text-gray-600">
                                    {{ formatTime(time) }}
                                </div>
                            </div>
                        </div>

                        <!-- Channel Rows -->
                        <div class="">
                            <div v-for="(programs, channelName) in timeline.channels" :key="channelName" class="flex border-b border-gray-200 last:border-b-0">
                                <!-- Channel Name -->
                                <div class="w-32 flex-shrink-0 p-2 border-r border-gray-200 flex items-center justify-center font-bold text-sm bg-gray-50 text-gray-700">
                                    {{ channelName.replace('系', '').replace('テレビ', '') }}
                                </div>
                                <!-- Programs -->
                                <div class="relative flex-grow h-24 bg-gray-50/50" :style="{ width: timeline.durationHours * PIXELS_PER_HOUR + 'px' }">
                                    <div v-for="program in programs" :key="program.id"
                                        class="absolute top-0 h-full p-2 group"
                                        :style="getProgramStyle(program, timeline.timelineStart)"
                                    >
                                        <a-popover trigger="hover" :overlayClassName="'!p-0 !-m-2'" :mouseEnterDelay="0.3">
                                            <template #content>
                                                <div class="bg-white rounded-xl overflow-hidden shadow-2xl border border-gray-200" :style="{ width: cardWidth + 'px' }">
                                                    <div class="relative h-[90px] w-full bg-gray-200 overflow-hidden">
                                                        <img :src="getImgSrc(program)" @error="handleImgError(program)" class="w-full h-full object-cover" />
                                                        <div v-if="isProgramOnAir(program)" class="absolute top-1.5 left-1.5 flex items-center gap-1.5 px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded shadow-md animate-pulse">
                                                            <span class="w-1.5 h-1.5 bg-white rounded-full"></span>
                                                            ON AIR
                                                        </div>
                                                    </div>
                                                    <div class="p-2 flex flex-col relative">
                                                        <div class="flex items-center justify-between mb-1.5">
                                                            <div class="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-bold text-white shadow-sm" :style="{ backgroundColor: getBroadcasterColor(program) }">
                                                                <DesktopOutlined />
                                                                {{ program.broadcasterName.replace('系', '').replace('テレビ', '') }}
                                                            </div>
                                                            <span class="text-xs px-1.5 py-0.5 rounded border" :class="getTagColor(program.genreTag)">
                                                                {{ program.genreTag }}
                                                            </span>
                                                        </div>
                                                        <div class="flex items-baseline gap-1 mb-1 text-gray-800">
                                                            <span class="text-lg font-bold font-mono tracking-tight">{{ formatTime(program.startAt) }}</span>
                                                            <span class="text-sm text-gray-500 font-mono">~ {{ formatTime(program.endAt) }}</span>
                                                        </div>
                                                        <h3 class="text-base font-semibold text-gray-900 mb-1.5 leading-snug line-clamp-2">
                                                            {{ program.seriesTitle }}
                                                        </h3>
                                                        <p v-if="program.title !== program.seriesTitle && program.title.trim() !== ''" class="text-sm text-gray-500 mb-2 line-clamp-3 leading-relaxed">
                                                            {{ program.title }}
                                                        </p>
                                                        <div class="mt-auto pt-1.5 border-t border-gray-200/50 flex justify-between items-center text-sm text-gray-400">
                                                            <div class="flex items-center gap-1"><ClockCircleOutlined /> {{ getDurationMin(program) }} min</div>
                                                            <div class="flex gap-2 opacity-60">
                                                                <MobileOutlined v-if="program.platforms.includes('ios')" title="Mobile" />
                                                                <MonitorOutlined v-if="program.platforms.includes('web')" title="Web" />
                                                            </div>
                                                        </div>
                                                    </div>
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
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, reactive, watch } from 'vue';
import axios from 'axios';
import { transformRawData, getHKDate, formatTime, getMonth, getDay, getWeekday } from '../utils/tver.js';
import { ReloadOutlined, PlayCircleOutlined, ClockCircleOutlined, DesktopOutlined, MobileOutlined, MonitorOutlined, TableOutlined, CalendarOutlined } from '@ant-design/icons-vue';
import { message, Spin as ASpin, Alert as AAlert, Button as AButton, Slider as ASlider, Popover as APopover, Modal as AModal } from 'ant-design-vue';

const programs = ref([]);
const loading = ref(true);
const error = ref(null);
const filter = ref('ALL');
const viewMode = ref('list'); // 'list' or 'timeline'

// --- Modal State ---
const isModalVisible = ref(false);
const isModalLoading = ref(false);
const isModalImageLoading = ref(false);
const selectedProgramDetails = ref(null);
const selectedProgramForModal = ref(null);
const selectedProgramTalents = ref([]);
const isTalentsLoading = ref(false);

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
                // Keep original sort for list view
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
    const savedView = localStorage.getItem('tvScheduleViewMode');
    if (savedView) {
        viewMode.value = savedView;
    }
    fetchData();
});

watch(viewMode, (newMode) => {
    localStorage.setItem('tvScheduleViewMode', newMode);
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

// --- Timeline View Computed ---
const timelineDays = computed(() => {
    if (viewMode.value !== 'timeline') return {};
    const dayGroups = groupedPrograms.value;
    const timelines = {};

    for (const dateKey in dayGroups) {
        const dayPrograms = dayGroups[dateKey];
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

        timelines[dateKey] = {
            dayPrograms,
            timelineStart,
            timelineEnd,
            durationHours,
            timeSlots,
            channels: finalChannels,
        };
    }
    return timelines;
});

const getProgramStyle = (program, timelineStart) => {
    const startOffsetMs = program.startAt.getTime() - timelineStart.getTime();
    const durationMs = program.endAt.getTime() - program.startAt.getTime();
    const left = startOffsetMs * PIXELS_PER_MS;
    const width = durationMs * PIXELS_PER_MS;
    return { left: `${left}px`, width: `${width}px` };
};

// --- Shared/List View Logic ---
const IMAGE_BASE_URL_FALLBACK = "https://picsum.photos/800/450";
const imageSources = reactive({});
const getImgSrc = (program) => {
  if (!program) return IMAGE_BASE_URL_FALLBACK;
  return imageSources[program.id] || `https://image-cdn.tver.jp/w=600${program.thumbnailUrl}`;
}
const handleImgError = (program) => { 
  if(program) {
    imageSources[program.id] = IMAGE_BASE_URL_FALLBACK; 
  }
};

const getModalImgSrc = (program) => {
  if (!program || !program.thumbnailUrl) return IMAGE_BASE_URL_FALLBACK;
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
    imageSources[cacheKey] = IMAGE_BASE_URL_FALLBACK;
  }
};
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
    if (program.broadcasterName.includes('日テレ')) return '#f59e0b';
    if (program.broadcasterName.includes('テレビ朝日')) return '#f43f5e';
    if (program.broadcasterName.includes('TBS')) return '#2563eb';
    if (program.broadcasterName.includes('テレビ東京')) return '#dc2626';
    if (program.broadcasterName.includes('フジ')) return '#06b6d4';
    return '#475569';
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
        cancelMomentum();
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
</style>