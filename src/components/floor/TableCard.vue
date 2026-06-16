<script setup lang="ts">
import { computed } from 'vue';
import { Clock, Users, Sparkles, CalendarCheck } from 'lucide-vue-next';
import type { TableInfo } from '../../types/table';
import { useTableStore } from '../../stores/table';
import { useStatsStore } from '../../stores/stats';
import { formatDuration } from '../../composables/useTimer';

const props = defineProps<{
  table: TableInfo;
}>();

const emit = defineEmits<{
  (e: 'clean-done'): void;
  (e: 'start-dining'): void;
}>();

const tableStore = useTableStore();
const statsStore = useStatsStore();

const statusConfig = computed(() => tableStore.getStatusConfig(props.table.status));

const isLongDining = computed(() => {
  if (props.table.status !== 'dining') return false;
  return (props.table.diningDuration || 0) >= 90;
});

const handleStatusChange = () => {
  if (props.table.status === 'cleaning') {
    tableStore.markIdle(props.table.id);
  }
};
</script>

<template>
  <div
    class="relative rounded-2xl border-2 p-3 transition-all duration-300 cursor-pointer group"
    :class="[
      statusConfig.bgColor,
      statusConfig.borderColor,
      table.status === 'dining' ? 'shadow-md' : 'hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5',
      isLongDining ? 'ring-2 ring-rose-300' : '',
    ]"
    @click="handleStatusChange"
  >
    <div class="flex items-start justify-between mb-1.5">
      <span class="font-bold text-slate-800">{{ table.name }}</span>
      <span
        class="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
        :class="[statusConfig.bgColor, statusConfig.textColor, `border ${statusConfig.borderColor}`]"
      >
        {{ statusConfig.label }}
      </span>
    </div>

    <div class="text-xs text-slate-500 mb-2">
      {{ table.capacity }}人桌
    </div>

    <div v-if="table.status === 'dining'" class="space-y-1">
      <div
        class="text-sm font-semibold tabular-nums flex items-center gap-1"
        :class="isLongDining ? 'text-rose-600' : 'text-blue-700'"
      >
        <Clock class="w-3.5 h-3.5" />
        {{ formatDuration(table.diningDuration || 0) }}
      </div>
      <div v-if="table.currentParty" class="text-xs text-slate-600 flex items-center gap-1 truncate">
        <Users class="w-3 h-3 shrink-0" />
        <span class="truncate">{{ table.currentParty.customerName }} · {{ table.currentParty.partySize }}人</span>
      </div>
      <div v-if="isLongDining" class="text-[10px] text-rose-500 font-medium mt-1 flex items-center gap-1">
        <Sparkles class="w-3 h-3" />
        用餐时间较长
      </div>
    </div>

    <div v-else-if="table.status === 'cleaning'" class="space-y-1">
      <div class="text-xs text-amber-700 font-medium flex items-center gap-1">
        <Sparkles class="w-3.5 h-3.5" />
        正在清理
      </div>
      <div class="text-[10px] text-amber-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
        点击标记为空闲
      </div>
    </div>

    <div v-else-if="table.status === 'reserved'" class="space-y-1">
      <div class="text-xs text-violet-700 font-medium flex items-center gap-1">
        <CalendarCheck class="w-3.5 h-3.5" />
        已预订
      </div>
    </div>

    <div v-else class="space-y-1">
      <div class="text-xs text-emerald-700 font-medium">
        可接待
      </div>
    </div>
  </div>
</template>
