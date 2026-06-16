<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Clock, Users, UtensilsCrossed, UsersRound, DoorOpen, Volume2, ChevronRight, ArrowLeft, Wifi, WifiOff } from 'lucide-vue-next';
import { useQueueStore } from '../stores/queue';
import { useTableStore } from '../stores/table';
import type { TableType, QueueItem } from '../types/queue';

const queueStore = useQueueStore();
const tableStore = useTableStore();
const router = useRouter();

const currentTime = ref(new Date());
let timeTimer: number | null = null;

const lastSyncTime = ref<Date | null>(null);
const syncStatus = ref<'connected' | 'syncing' | 'disconnected'>('connected');
let syncCheckTimer: number | null = null;

watch(
  () => [queueStore.items.length, queueStore.currentCalled?.id],
  () => {
    lastSyncTime.value = new Date();
    syncStatus.value = 'syncing';
    setTimeout(() => {
      syncStatus.value = 'connected';
    }, 500);
  },
  { deep: true }
);

const iconMap: Record<string, any> = {
  UtensilsCrossed,
  Users,
  UsersRound,
  DoorOpen,
};

const currentCalledNumber = computed(() => {
  if (!queueStore.currentCalled) return '';
  return `${queueStore.currentCalled.prefix}${queueStore.currentCalled.number.toString().padStart(3, '0')}`;
});

const currentCalledConfig = computed(() => {
  if (!queueStore.currentCalled) return null;
  return queueStore.columnConfigs.find((c) => c.tableType === queueStore.currentCalled!.tableType);
});

const totalWaiting = computed(() => queueStore.waitingItems.length);

const columnStats = computed(() => {
  return queueStore.columnConfigs.map((config) => {
    const items = queueStore.getItemsByType(config.tableType);
    const waitingItems = items.filter((i) => i.status === 'waiting');
    const idleTables = tableStore.getIdleTablesByType(config.tableType).length;
    const firstItem = waitingItems[0];
    const firstNumber = firstItem
      ? `${firstItem.prefix}${firstItem.number.toString().padStart(3, '0')}`
      : '--';

    return {
      ...config,
      waitCount: waitingItems.length,
      idleCount: idleTables,
      firstNumber,
    };
  });
});

const upcomingNumbers = computed(() => {
  const allWaiting: QueueItem[] = [];
  queueStore.columnConfigs.forEach((config) => {
    const items = queueStore.getItemsByType(config.tableType);
    const waiting = items.filter((i) => i.status === 'waiting');
    allWaiting.push(...waiting.slice(0, 2));
  });
  return allWaiting.slice(0, 6);
});

const formatTime = (date: Date) => {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  const s = date.getSeconds().toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const formatDate = (date: Date) => {
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  return `${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`;
};

onMounted(() => {
  timeTimer = window.setInterval(() => {
    currentTime.value = new Date();
  }, 1000);

  syncCheckTimer = window.setInterval(() => {
    if (lastSyncTime.value) {
      const diff = (Date.now() - lastSyncTime.value.getTime()) / 1000;
      if (diff > 30 && syncStatus.value === 'connected') {
        syncStatus.value = 'disconnected';
      }
    }
  }, 5000);

  lastSyncTime.value = new Date();
});

onUnmounted(() => {
  if (timeTimer) {
    clearInterval(timeTimer);
  }
  if (syncCheckTimer) {
    clearInterval(syncCheckTimer);
  }
});
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div class="absolute top-1/3 -right-40 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      <div class="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
    </div>

    <div class="relative z-10 min-h-screen flex flex-col">
      <header class="px-12 py-6 flex items-center justify-between border-b border-white/10">
        <div class="flex items-center gap-4">
          <button
            class="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            @click="router.push('/')"
          >
            <ArrowLeft class="w-6 h-6" />
          </button>
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <UtensilsCrossed class="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 class="text-3xl font-bold tracking-wide">叫号显示屏</h1>
            <p class="text-sm text-slate-400 mt-0.5">欢迎光临，请稍候入座</p>
          </div>
        </div>

        <div class="flex items-center gap-10">
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-1.5">
              <Wifi v-if="syncStatus === 'connected'" class="w-5 h-5 text-emerald-400" />
              <Wifi v-else-if="syncStatus === 'syncing'" class="w-5 h-5 text-amber-400 animate-pulse" />
              <WifiOff v-else class="w-5 h-5 text-rose-400" />
            </div>
            <div class="text-right">
              <div class="text-sm font-medium" :class="{
                'text-emerald-400': syncStatus === 'connected',
                'text-amber-400': syncStatus === 'syncing',
                'text-rose-400': syncStatus === 'disconnected',
              }">
                {{ syncStatus === 'connected' ? '已同步' : syncStatus === 'syncing' ? '同步中...' : '未连接' }}
              </div>
              <div class="text-xs text-slate-500">
                {{ lastSyncTime ? `${lastSyncTime.getHours().toString().padStart(2,'0')}:${lastSyncTime.getMinutes().toString().padStart(2,'0')}:${lastSyncTime.getSeconds().toString().padStart(2,'0')}` : '--' }}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <Users class="w-6 h-6 text-amber-400" />
            <div class="text-right">
              <div class="text-3xl font-bold tabular-nums">{{ totalWaiting }}</div>
              <div class="text-xs text-slate-400">等候总人数</div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <Clock class="w-6 h-6 text-blue-400" />
            <div class="text-right">
              <div class="text-3xl font-bold tabular-nums font-mono">{{ formatTime(currentTime) }}</div>
              <div class="text-xs text-slate-400">{{ formatDate(currentTime) }}</div>
            </div>
          </div>
        </div>
      </header>

      <main class="flex-1 flex flex-col px-12 py-8 gap-8">
        <section class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <div class="text-xl text-slate-400 mb-4 tracking-[0.5em] uppercase">
              {{ queueStore.currentCalled ? '当前叫号' : '等待叫号' }}
            </div>

            <div
              v-if="queueStore.currentCalled && currentCalledConfig"
              class="relative"
            >
              <div class="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-orange-500/20 blur-3xl rounded-full" />
              <div
                class="relative text-[12rem] font-black tabular-nums leading-none tracking-tight mb-6"
                style="text-shadow: 0 0 80px rgba(251, 191, 36, 0.4)"
              >
                <span class="bg-gradient-to-b from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent">
                  {{ currentCalledNumber }}
                </span>
              </div>

              <div class="flex items-center justify-center gap-4 mb-4">
                <span
                  class="text-2xl font-bold px-8 py-3 rounded-2xl"
                  :class="[currentCalledConfig.bgColor, currentCalledConfig.color]"
                >
                  {{ currentCalledConfig.label }}
                </span>
                <span class="text-2xl text-slate-300">
                  {{ queueStore.currentCalled.partySize }}人
                </span>
              </div>

              <div class="text-lg text-slate-400">
                请 {{ currentCalledNumber }} 号顾客到 {{ currentCalledConfig.label }} 区就座
              </div>
            </div>

            <div v-else class="py-20">
              <div class="text-7xl font-bold text-slate-600 mb-4">--</div>
              <p class="text-xl text-slate-500">暂无叫号</p>
            </div>
          </div>
        </section>

        <section class="grid grid-cols-4 gap-6">
          <div
            v-for="stat in columnStats"
            :key="stat.tableType"
            class="rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 transition-all hover:bg-white/10"
          >
            <div class="flex items-center gap-3 mb-4">
              <div
                class="w-12 h-12 rounded-2xl flex items-center justify-center"
                :class="stat.bgColor"
              >
                <component :is="iconMap[stat.icon]" class="w-6 h-6" :class="stat.color" />
              </div>
              <div>
                <div class="text-xl font-bold">{{ stat.label }}</div>
                <div class="text-xs text-slate-400">{{ stat.capacity }}</div>
              </div>
            </div>

            <div class="space-y-3">
              <div class="flex items-end justify-between">
                <span class="text-sm text-slate-400">当前等待</span>
                <span class="text-4xl font-bold tabular-nums">{{ stat.waitCount }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-400">下一位</span>
                <span class="font-mono font-semibold text-emerald-400">{{ stat.firstNumber }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-400">空闲桌台</span>
                <span class="font-semibold text-blue-400">{{ stat.idleCount }} 桌</span>
              </div>
            </div>
          </div>
        </section>

        <section class="rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 p-6">
          <div class="flex items-center gap-2 mb-4">
            <Volume2 class="w-5 h-5 text-slate-400" />
            <h2 class="text-lg font-semibold text-slate-300">即将叫号</h2>
          </div>

          <div v-if="upcomingNumbers.length > 0" class="flex items-center gap-4 overflow-x-auto pb-2">
            <div
              v-for="(item, index) in upcomingNumbers"
              :key="item.id"
              class="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 shrink-0"
            >
              <span
                class="text-sm px-2 py-0.5 rounded-md"
                :class="[
                  queueStore.columnConfigs.find(c => c.tableType === item.tableType)?.bgColor,
                  queueStore.columnConfigs.find(c => c.tableType === item.tableType)?.color,
                ]"
              >
                {{ queueStore.columnConfigs.find(c => c.tableType === item.tableType)?.label }}
              </span>
              <span class="text-2xl font-bold tabular-nums font-mono text-slate-200">
                {{ item.prefix }}{{ item.number.toString().padStart(3, '0') }}
              </span>
              <span class="text-sm text-slate-500">{{ item.partySize }}人</span>
              <ChevronRight v-if="index < upcomingNumbers.length - 1" class="w-5 h-5 text-slate-600" />
            </div>
          </div>

          <div v-else class="text-center py-4 text-slate-500">
            暂无等候顾客
          </div>
        </section>
      </main>

      <footer class="px-12 py-5 border-t border-white/10 flex items-center justify-between">
        <div class="text-sm text-slate-500">
          温馨提示：请关注叫号信息，过号需重新取号
        </div>
        <div class="text-sm text-slate-600">
          祝您用餐愉快
        </div>
      </footer>
    </div>
  </div>
</template>
