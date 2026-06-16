<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { TrendingUp, Clock, UserMinus, UtensilsCrossed, Store, RefreshCw } from 'lucide-vue-next';
import { useStatsStore } from '../../stores/stats';
import { useQueueStore } from '../../stores/queue';
import { formatDuration, formatTime } from '../../composables/useTimer';

const statsStore = useStatsStore();
const queueStore = useQueueStore();

let clockTimer: number | null = null;

const currentTimeStr = computed(() => formatTime(statsStore.currentTime));

const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const dateStr = computed(() => {
  const d = statsStore.currentTime;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`;
});

onMounted(() => {
  clockTimer = window.setInterval(() => {
    statsStore.updateTime();
  }, 1000);
});

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer);
});

const statCards = computed(() => [
  {
    label: '今日翻台率',
    value: statsStore.turnoverRate.toFixed(1),
    unit: '轮',
    icon: RefreshCw,
    gradient: 'from-emerald-500 to-teal-500',
    bgGradient: 'from-emerald-50 to-teal-50',
    hint: '总用餐数 / 总桌数',
    subValue: `${statsStore.stats.totalDiningParties}桌次`,
  },
  {
    label: '平均用餐时长',
    value: formatDuration(statsStore.avgDiningDuration),
    unit: '',
    icon: Clock,
    gradient: 'from-blue-500 to-indigo-500',
    bgGradient: 'from-blue-50 to-indigo-50',
    hint: '基于已完餐统计',
    subValue: `${statsStore.stats.completedDiningDurations.length}单样本`,
  },
  {
    label: '等位流失率',
    value: statsStore.queueLossRate.toString(),
    unit: '%',
    icon: UserMinus,
    gradient: 'from-rose-500 to-orange-500',
    bgGradient: 'from-rose-50 to-orange-50',
    hint: '取消+过号 / 总取号',
    subValue: `流失${statsStore.stats.totalQueueLost || queueStore.getQueueStats().lost}人`,
  },
]);
</script>

<template>
  <div class="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
    <div class="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
          <Store class="w-5 h-5" />
        </div>
        <div>
          <div class="text-lg font-bold flex items-center gap-2">
            <UtensilsCrossed class="w-5 h-5 text-orange-400" />
            品味轩·前厅运营中心
          </div>
          <div class="text-sm text-slate-400">{{ dateStr }}</div>
        </div>
      </div>
      <div class="text-right">
        <div class="text-3xl font-bold tabular-nums tracking-wider text-white">
          {{ currentTimeStr }}
        </div>
        <div class="text-xs text-slate-400 mt-0.5">实时运营数据</div>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-4 p-4 bg-gradient-to-b from-slate-50 to-white">
      <div
        v-for="stat in statCards"
        :key="stat.label"
        class="relative rounded-2xl p-4 overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
        :class="`bg-gradient-to-br ${stat.bgGradient}`"
      >
        <div
          class="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500"
          :class="`bg-gradient-to-br ${stat.gradient}`"
        />

        <div class="relative">
          <div class="flex items-start justify-between mb-3">
            <span class="text-sm font-medium text-slate-600">{{ stat.label }}</span>
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
              :class="`bg-gradient-to-br ${stat.gradient}`"
            >
              <component :is="stat.icon" class="w-5 h-5" />
            </div>
          </div>

          <div class="flex items-baseline gap-1 mb-1">
            <span class="text-3xl font-black tabular-nums text-slate-800">
              {{ stat.value }}
            </span>
            <span class="text-lg font-bold text-slate-500">{{ stat.unit }}</span>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-500">{{ stat.hint }}</span>
            <span class="text-xs font-medium text-slate-600 flex items-center gap-1">
              <TrendingUp class="w-3 h-3" />
              {{ stat.subValue }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
