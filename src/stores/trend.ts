import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { HourlySnapshot } from '../types/trend';
import { useQueueStore } from './queue';
import { useTableStore } from './table';
import { useStatsStore } from './stats';

const now = new Date();
const currentHour = now.getHours();

const mockSnapshots: HourlySnapshot[] = [
  { hour: 9, queueCount: 0, turnoverRate: 0, diningCount: 0 },
  { hour: 10, queueCount: 3, turnoverRate: 0.16, diningCount: 3 },
  { hour: 11, queueCount: 8, turnoverRate: 0.42, diningCount: 6 },
  { hour: 12, queueCount: 15, turnoverRate: 0.79, diningCount: 11 },
  { hour: 13, queueCount: 12, turnoverRate: 1.05, diningCount: 9 },
  { hour: 14, queueCount: 5, turnoverRate: 1.21, diningCount: 4 },
  { hour: 15, queueCount: 2, turnoverRate: 1.26, diningCount: 2 },
  { hour: 16, queueCount: 3, turnoverRate: 1.32, diningCount: 3 },
  { hour: 17, queueCount: 7, turnoverRate: 1.47, diningCount: 6 },
  { hour: 18, queueCount: 18, turnoverRate: 1.84, diningCount: 14 },
  { hour: 19, queueCount: 14, turnoverRate: 2.21, diningCount: 10 },
  { hour: 20, queueCount: 6, turnoverRate: 2.42, diningCount: 5 },
];

const historicalSnapshots = mockSnapshots.filter(s => s.hour < currentHour);

export const useTrendStore = defineStore('trend', () => {
  const snapshots = ref<HourlySnapshot[]>([...historicalSnapshots]);

  const queueStore = useQueueStore();
  const tableStore = useTableStore();
  const statsStore = useStatsStore();

  const lastSnapshotHour = computed(() => {
    if (snapshots.value.length === 0) return -1;
    return snapshots.value[snapshots.value.length - 1].hour;
  });

  const takeSnapshot = () => {
    const hour = new Date().getHours();
    const queueCount = queueStore.waitingItems.length;
    const turnoverRate = statsStore.turnoverRate;
    const diningCount = tableStore.diningTables.length;

    if (hour === lastSnapshotHour.value) {
      snapshots.value[snapshots.value.length - 1] = { hour, queueCount, turnoverRate, diningCount };
    } else {
      snapshots.value.push({ hour, queueCount, turnoverRate, diningCount });
    }
  };

  const queueTrend = computed(() =>
    snapshots.value.map(s => s.queueCount)
  );

  const turnoverTrend = computed(() =>
    snapshots.value.map(s => s.turnoverRate)
  );

  const labels = computed(() =>
    snapshots.value.map(s => `${s.hour.toString().padStart(2, '0')}:00`)
  );

  const currentQueueCount = computed(() => queueStore.waitingItems.length);
  const currentTurnoverRate = computed(() => statsStore.turnoverRate);

  return {
    snapshots,
    takeSnapshot,
    queueTrend,
    turnoverTrend,
    labels,
    currentQueueCount,
    currentTurnoverRate,
  };
});
