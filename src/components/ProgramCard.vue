<template>
    <div
        class="group flex flex-col h-full bg-white border rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-md hover:shadow-lg"
        @click="emit('card-click')"
        :class="cardClasses"
    >
        <div class="relative h-[90px] w-full bg-gray-200 overflow-hidden">
            <img
                :src="imgSrc"
                :alt="program.title"
                @load="onImageReady"
                @error="() => { handleImgError(); onImageReady(); }"
                class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                :class="imgClasses"
            />
            <div v-if="isOnAir" class="absolute top-1.5 left-1.5 flex items-center gap-1.5 px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded shadow-md animate-pulse">
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
                    :style="{ backgroundColor: broadcasterColor }"
                >
                    <DesktopOutlined />
                    {{ broadcasterName }}
                </div>
                <span
                    class="text-xs px-1.5 py-0.5 rounded border"
                    :class="tagColorClasses"
                >
                    {{ program.genreTag }}
                </span>
            </div>
            <div class="flex items-baseline gap-1 mb-1 text-gray-800">
                <span class="text-lg font-bold font-mono tracking-tight">{{ formattedStart }}</span>
                <span class="text-sm text-gray-500 font-mono">~ {{ formattedEnd }}</span>
            </div>
            <h3 class="text-base font-semibold text-gray-900 mb-1.5 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                {{ program.seriesTitle }}
            </h3>
            <p v-if="program.title !== program.seriesTitle && program.title.trim() !== ''" class="text-sm text-gray-500 mb-2 line-clamp-2 leading-relaxed">
                {{ program.title }}
            </p>
            <div class="mt-auto pt-1.5 border-t border-gray-200/50 flex justify-between items-center text-sm text-gray-400">
                <div class="flex items-center gap-1">
                    <ClockCircleOutlined /> {{ durationMin }} min
                </div>
                <div class="flex gap-2 opacity-60">
                    <MobileOutlined v-if="program.platforms.includes('ios')" title="Mobile" />
                    <MonitorOutlined v-if="program.platforms.includes('web')" title="Web" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, reactive, onMounted } from 'vue';
import { formatTime } from '../utils/tver.js';
import { PlayCircleOutlined, DesktopOutlined, ClockCircleOutlined, MobileOutlined, MonitorOutlined } from '@ant-design/icons-vue';

const props = defineProps({
    program: {
        type: Object,
        required: true,
    },
    isDragging: {
        type: Boolean,
        default: false,
    }
});

const emit = defineEmits(['card-click', 'ready']);

const onImageReady = () => {
    emit('ready');
};

onMounted(() => {
    if (!props.program.thumbnailUrl) {
        onImageReady();
    }
});

const IMAGE_BASE_URL_FALLBACK = "https://picsum.photos/800/450";
const imageSources = reactive({});

const imgSrc = computed(() => {
    if (!props.program) return IMAGE_BASE_URL_FALLBACK;
    return imageSources[props.program.id] || `https://image-cdn.tver.jp/w=600${props.program.thumbnailUrl}`;
});

const handleImgError = () => {
  if(props.program) {
    imageSources[props.program.id] = IMAGE_BASE_URL_FALLBACK; 
  }
};

const isOnAir = computed(() => {
    const now = new Date();
    return now >= props.program.startAt && now <= props.program.endAt;
});

const cardClasses = computed(() => ({
    'border-blue-500 ring-1 ring-blue-500': isOnAir.value,
    'border-gray-200 hover:border-gray-300': !isOnAir.value
}));

const imgClasses = computed(() => ({
    'opacity-100': isOnAir.value,
    'opacity-95': !isOnAir.value,
    'pointer-events-none': props.isDragging,
}));

const broadcasterColorMap = [
    { key: '日テレ', color: '#f59e0b' },
    { key: 'テレビ朝日', color: '#f43f5e' },
    { key: 'TBS', color: '#2563eb' },
    { key: 'テレビ東京', color: '#10b981' },
    { key: 'フジ', color: '#06b6d4' },
];

const broadcasterColor = computed(() => {
    const name = props.program.broadcasterName;
    const match = broadcasterColorMap.find(item => name.includes(item.key));
    return match ? match.color : '#475569';
});

const broadcasterName = computed(() => {
    return props.program.broadcasterName.replace('系', '').replace('テレビ', '');
});

const tagColorMap = {
  'スペシャル': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'ニュース': 'bg-blue-100 text-blue-800 border-blue-200',
  'バラエティ': 'bg-pink-100 text-pink-800 border-pink-200',
  'ドラマ': 'bg-purple-100 text-purple-800 border-purple-200',
  'スポーツ': 'bg-green-100 text-green-800 border-green-200',
  'アニメ': 'bg-orange-100 text-orange-800 border-orange-200',
};

const tagColorClasses = computed(() => {
    return tagColorMap[props.program.genreTag] || 'bg-gray-100 text-gray-800 border-gray-200';
});

const formattedStart = computed(() => formatTime(props.program.startAt));
const formattedEnd = computed(() => formatTime(props.program.endAt));
const durationMin = computed(() => Math.round((props.program.endAt.getTime() - props.program.startAt.getTime()) / 60000));

</script>

<style scoped>
.line-clamp-2 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
}
</style>
