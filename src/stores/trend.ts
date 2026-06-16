import { defineStore } from 'pinia';
import { ref, computed, onMounted, onUnmounted } from 'vue';
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
  const historical = ref<HourlySnapshot[]>([...historicalSnapshots]);
  const tick = ref(0);
  let timer: number | null = null;

  const queueStore = useQueueStore();
  const tableStore = useTableStore();
  const statsStore = useStatsStore();

  const currentHourLive = computed(() => {
    tick.value;
    return new Date().getHours();
  });

  const currentSnapshotLive = computed<HourlySnapshot>(() => ({
    hour: currentHourLive.value,
    queueCount: queueStore.waitingItems.length,
    turnoverRate: statsStore.turnoverRate,
    diningCount: tableStore.diningTables.length,
  }));

  const fullSnapshots = computed<HourlySnapshot[]>(() => {
    const hist = [...historical.value];
    const curr = currentSnapshotLive.value;

    if (hist.length === 0 || hist[hist.length - 1].hour < curr.hour) {
      hist.push({ ...curr });
    } else if (hist[hist.length - 1].hour === curr.hour) {
      hist[hist.length - 1] = { ...curr };
    }

    return hist;
  });

  const startTicker = () => {
    if (timer) return;
    timer = window.setInterval(() => {
      tick.value++;
    }, 10000);
  };

  const stopTicker = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  const takeSnapshot = () => {
    const curr = currentSnapshotLive.value;
    const hist = historical.value;

    if (hist.length === 0 || hist[hist.length - 1].hour < curr.hour) {
      hist.push({ ...curr });
    } else if (hist[hist.length - 1].hour === curr.hour) {
      hist[hist.length - 1] = { ...curr };
    }
  };

  const queueTrend = computed(() =>
    fullSnapshots.value.map(s => s.queueCount)
  );

  const turnoverTrend = computed(() =>
    fullSnapshots.value.map(s => s.turnoverRate)
  );

  const labels = computed(() =>
    fullSnapshots.value.map(s => `${s.hour.toString().padStart(2, '0')}:00`)
  );

  const currentQueueCount = computed(() => queueStore.waitingItems.length);
  const currentTurnoverRate = computed(() => statsStore.turnoverRate);

  onMounted(() => {
    startTicker();
  });

  onUnmounted(() => {
    stopTicker();
  });

  return {
    snapshots: fullSnapshots,
    takeSnapshot,
    startTicker,
    stopTicker,
    queueTrend,
    turnoverTrend,
    labels,
    currentQueueCount,
    currentTurnoverRate,
  };
});
