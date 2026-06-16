import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { DailyStats } from '../types/stats';
import { useTableStore } from './table';
import { useQueueStore } from './queue';

export const useStatsStore = defineStore('stats', () => {
  const stats = ref<DailyStats>({
    date: new Date().toISOString().split('T')[0],
    turnoverRate: 0,
    avgDiningDuration: 0,
    queueLossRate: 0,
    totalQueueTaken: 0,
    totalQueueLost: 0,
    totalDiningParties: 12,
    totalTables: 19,
    completedDiningDurations: [45, 60, 55, 70, 40, 50, 65, 80, 55, 48, 62, 58],
  });

  const tableStore = useTableStore();
  const queueStore = useQueueStore();

  const turnoverRate = computed(() => {
    const total = stats.value.totalDiningParties;
    const tables = tableStore.totalTables || stats.value.totalTables;
    return tables > 0 ? (total / tables) : 0;
  });

  const avgDiningDuration = computed(() => {
    const durations = stats.value.completedDiningDurations;
    if (durations.length === 0) return 0;
    const sum = durations.reduce((a, b) => a + b, 0);
    return Math.round(sum / durations.length);
  });

  const queueLossRate = computed(() => {
    const qStats = queueStore.getQueueStats();
    const taken = qStats.total || stats.value.totalQueueTaken;
    const lost = qStats.lost || stats.value.totalQueueLost;
    if (taken === 0) return 0;
    return Math.round((lost / taken) * 100);
  });

  const addCompletedDining = (duration: number) => {
    stats.value.totalDiningParties++;
    stats.value.completedDiningDurations.push(duration);
  };

  const currentTime = ref(new Date());
  const updateTime = () => {
    currentTime.value = new Date();
  };

  return {
    stats,
    turnoverRate,
    avgDiningDuration,
    queueLossRate,
    currentTime,
    updateTime,
    addCompletedDining,
  };
});
