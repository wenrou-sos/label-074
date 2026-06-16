import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { QueueItem, TableType, QueueStatus } from '../types/queue';
import { queueColumnConfigs, initialQueueItems, customerNames, genRandomPhone } from '../mock/queue';
import { getMinutesDiff } from '../composables/useTimer';

export const useQueueStore = defineStore('queue', () => {
  const items = ref<QueueItem[]>([...initialQueueItems]);
  const currentCalled = ref<QueueItem | null>(null);
  const showCallScreen = ref(false);
  const callHistory = ref<QueueItem[]>([]);
  const counters = ref<Record<string, number>>({
    small: 18,
    medium: 10,
    large: 4,
    private: 2,
  });

  const waitingItems = computed(() =>
    items.value.filter((i) => i.status === 'waiting' || i.status === 'called')
  );

  const getItemsByType = (tableType: TableType) =>
    waitingItems.value
      .filter((i) => i.tableType === tableType)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const getWaitCountByType = (tableType: TableType) =>
    waitingItems.value.filter((i) => i.tableType === tableType && i.status === 'waiting').length;

  const columnConfigs = queueColumnConfigs;

  const addQueueItem = (tableType: TableType, partySize: number, customerName?: string, phone?: string) => {
    const config = queueColumnConfigs.find((c) => c.tableType === tableType);
    if (!config) return null;

    counters.value[tableType]++;
    const newItem: QueueItem = {
      id: `q-${Date.now()}`,
      number: counters.value[tableType],
      prefix: config.prefix,
      tableType,
      customerName: customerName || customerNames[Math.floor(Math.random() * customerNames.length)],
      phone: phone || genRandomPhone(),
      partySize,
      waitTime: 0,
      estimatedTime: Math.max(0, getWaitCountByType(tableType) * 15),
      status: 'waiting',
      createdAt: new Date(),
    };
    items.value.push(newItem);
    updateEstimatedTimes();
    return newItem;
  };

  const callNext = (tableType: TableType) => {
    const queue = getItemsByType(tableType);
    const next = queue.find((i) => i.status === 'waiting');
    if (!next) return null;

    next.status = 'called';
    next.calledAt = new Date();
    currentCalled.value = next;
    showCallScreen.value = true;
    callHistory.value.unshift(next);
    return next;
  };

  const confirmSeated = (itemId: string) => {
    const item = items.value.find((i) => i.id === itemId);
    if (item) {
      item.status = 'seated';
    }
    if (currentCalled.value?.id === itemId) {
      currentCalled.value = null;
      showCallScreen.value = false;
    }
    updateEstimatedTimes();
  };

  const markMissed = (itemId: string) => {
    const item = items.value.find((i) => i.id === itemId);
    if (item) {
      item.status = 'missed';
    }
    if (currentCalled.value?.id === itemId) {
      currentCalled.value = null;
      showCallScreen.value = false;
    }
    updateEstimatedTimes();
  };

  const cancelItem = (itemId: string) => {
    const item = items.value.find((i) => i.id === itemId);
    if (item) {
      item.status = 'cancelled';
    }
    if (currentCalled.value?.id === itemId) {
      currentCalled.value = null;
      showCallScreen.value = false;
    }
    updateEstimatedTimes();
  };

  const closeCallScreen = () => {
    showCallScreen.value = false;
  };

  const updateWaitTimes = () => {
    const now = new Date();
    items.value.forEach((item) => {
      if (item.status === 'waiting') {
        item.waitTime = getMinutesDiff(item.createdAt, now);
      }
    });
  };

  const updateEstimatedTimes = () => {
    queueColumnConfigs.forEach((config) => {
      const typeItems = items.value
        .filter((i) => i.tableType === config.tableType && i.status === 'waiting')
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      typeItems.forEach((item, index) => {
        item.estimatedTime = index * 15;
      });
    });
  };

  const getQueueStats = () => {
    const all = items.value;
    const total = all.length;
    const lost = all.filter((i) => i.status === 'cancelled' || i.status === 'missed').length;
    return { total, lost };
  };

  return {
    items,
    waitingItems,
    currentCalled,
    showCallScreen,
    callHistory,
    counters,
    columnConfigs,
    getItemsByType,
    getWaitCountByType,
    addQueueItem,
    callNext,
    confirmSeated,
    markMissed,
    cancelItem,
    closeCallScreen,
    updateWaitTimes,
    updateEstimatedTimes,
    getQueueStats,
  };
});
