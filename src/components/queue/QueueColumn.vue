<script setup lang="ts">
import { computed } from 'vue';
import { Megaphone, UtensilsCrossed, Users, UsersRound, DoorOpen, Plus } from 'lucide-vue-next';
import type { TableType } from '../../types/queue';
import { useQueueStore } from '../../stores/queue';
import { useTableStore } from '../../stores/table';
import { useSpeech } from '../../composables/useSpeech';
import QueueCard from './QueueCard.vue';

const props = defineProps<{
  tableType: TableType;
}>();

const queueStore = useQueueStore();
const tableStore = useTableStore();
const { speak } = useSpeech();

const columnConfig = computed(() =>
  queueStore.columnConfigs.find((c) => c.tableType === props.tableType)!
);

const items = computed(() => queueStore.getItemsByType(props.tableType));
const idleCount = computed(() => tableStore.getIdleTablesByType(props.tableType).length);
const waitCount = computed(() => queueStore.getWaitCountByType(props.tableType));

const iconMap: Record<string, any> = {
  UtensilsCrossed,
  Users,
  UsersRound,
  DoorOpen,
};

const IconComponent = computed(() => iconMap[columnConfig.value.icon] || Users);

const handleCall = () => {
  const called = queueStore.callNext(props.tableType);
  if (called) {
    const typeLabel = columnConfig.value.label;
    const num = `${called.prefix}${called.number.toString().padStart(3, '0')}`;
    speak(`请${num}号顾客，${typeLabel}用餐，请到${typeLabel}区就座`);
  }
};

const handleSeat = (itemId: string) => {
  queueStore.confirmSeated(itemId);
};

const handleMiss = (itemId: string) => {
  queueStore.markMissed(itemId);
};

const handleCancel = (itemId: string) => {
  queueStore.cancelItem(itemId);
};

const handleAddQueue = () => {
  const partySizes: Record<TableType, number> = {
    small: 2 + Math.floor(Math.random() * 3),
    medium: 4 + Math.floor(Math.random() * 3),
    large: 6 + Math.floor(Math.random() * 4),
    private: 10 + Math.floor(Math.random() * 6),
  };
  queueStore.addQueueItem(props.tableType, partySizes[props.tableType]);
};
</script>

<template>
  <div class="flex flex-col h-full rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
    <div
      class="px-4 py-3 border-b flex items-center justify-between"
      :class="[columnConfig.bgColor, columnConfig.borderColor]"
    >
      <div class="flex items-center gap-2.5">
        <div
          class="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
          :class="`${columnConfig.color} bg-white`"
        >
          <component :is="IconComponent" class="w-5 h-5" />
        </div>
        <div>
          <div class="font-bold text-slate-800 flex items-center gap-1.5">
            {{ columnConfig.label }}
            <span class="text-xs font-normal text-slate-500">{{ columnConfig.capacity }}</span>
          </div>
          <div class="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
            <span>排队 <span class="font-semibold text-slate-700">{{ waitCount }}</span></span>
            <span class="text-slate-300">|</span>
            <span>空桌 <span class="font-semibold text-emerald-600">{{ idleCount }}</span></span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-1.5">
        <button
          class="p-2 rounded-lg bg-white hover:bg-slate-50 transition-colors text-slate-500 hover:text-slate-700"
          title="模拟取号"
          @click="handleAddQueue"
        >
          <Plus class="w-4 h-4" />
        </button>
        <button
          class="px-3 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold flex items-center gap-1.5 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          :disabled="items.length === 0 || idleCount === 0"
          @click="handleCall"
        >
          <Megaphone class="w-4 h-4" />
          叫号
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-3 space-y-2.5">
      <template v-if="items.length > 0">
        <QueueCard
          v-for="(item, index) in items"
          :key="item.id"
          :item="item"
          :is-first="index === 0 && item.status !== 'called'"
          :color-class="columnConfig.color"
          :bg-color-class="columnConfig.bgColor"
          @seat="handleSeat(item.id)"
          @miss="handleMiss(item.id)"
          @cancel="handleCancel(item.id)"
        />
      </template>
      <div v-else class="h-full flex flex-col items-center justify-center text-slate-400 py-8">
        <UtensilsCrossed class="w-10 h-10 mb-2 opacity-40" />
        <span class="text-sm">暂无排队</span>
      </div>
    </div>
  </div>
</template>
