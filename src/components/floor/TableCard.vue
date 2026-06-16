<script setup lang="ts">
import { computed, ref } from 'vue';
import { Clock, Users, Sparkles, CalendarCheck, CheckCircle, Loader } from 'lucide-vue-next';
import type { TableInfo } from '../../types/table';
import { useTableStore } from '../../stores/table';
import { formatDuration } from '../../composables/useTimer';

const props = defineProps<{
  table: TableInfo;
}>();

const emit = defineEmits<{
  (e: 'clean-done'): void;
  (e: 'start-dining'): void;
  (e: 'end-dining', duration: number): void;
}>();

const tableStore = useTableStore();
const showEndConfirm = ref(false);

const statusConfig = computed(() => tableStore.getStatusConfig(props.table.status));

const isLongDining = computed(() => {
  if (props.table.status !== 'dining') return false;
  return (props.table.diningDuration || 0) >= 90;
});

const handleEndDining = () => {
  const duration = tableStore.markCleaning(props.table.id);
  if (duration > 0) {
    emit('end-dining', duration);
  }
  showEndConfirm.value = false;
};

const handleStatusChange = () => {
  if (props.table.status === 'cleaning') {
    tableStore.markIdle(props.table.id);
    emit('clean-done');
  }
};
</script>

<template>
  <div
    class="relative rounded-2xl border-2 p-3 transition-all duration-300 group"
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

    <div v-if="table.status === 'dining'" class="space-y-2">
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
      <div v-if="isLongDining" class="text-[10px] text-rose-500 font-medium flex items-center gap-1">
        <Sparkles class="w-3 h-3" />
        用餐时间较长
      </div>

      <button
        class="w-full mt-1 px-2 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium flex items-center justify-center gap-1 transition-all opacity-0 group-hover:opacity-100"
        @click.stop="showEndConfirm = true"
      >
        <CheckCircle class="w-3.5 h-3.5" />
        结束用餐
      </button>
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

    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showEndConfirm"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="showEndConfirm = false" />
          <div class="relative bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full">
            <div class="text-center mb-4">
              <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                <Loader class="w-6 h-6 text-blue-600" />
              </div>
              <h3 class="text-lg font-bold text-slate-800 mb-1">确认结束用餐？</h3>
              <p class="text-sm text-slate-500">
                {{ table.name }} · {{ table.currentParty?.customerName }}<br />
                已用餐 <span class="font-semibold text-blue-600">{{ formatDuration(table.diningDuration || 0) }}</span>
              </p>
            </div>
            <div class="flex gap-3">
              <button
                class="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                @click="showEndConfirm = false"
              >
                取消
              </button>
              <button
                class="flex-1 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors flex items-center justify-center gap-1.5"
                @click="handleEndDining"
              >
                <CheckCircle class="w-4 h-4" />
                确认
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: scale(0.95);
}
</style>
