<script setup lang="ts">
import { computed, ref } from 'vue';
import { Clock, Users, Phone, MapPin, AlertTriangle, Check, X, MessageSquare, Sparkles, UtensilsCrossed, ChevronRight, CalendarCheck } from 'lucide-vue-next';
import type { Reservation } from '../../types/reservation';
import type { TableInfo } from '../../types/table';
import { formatTime, getMinutesDiff } from '../../composables/useTimer';
import { useReservationStore } from '../../stores/reservation';

const props = defineProps<{
  reservation: Reservation;
}>();

const emit = defineEmits<{
  (e: 'arrive'): void;
  (e: 'cancel'): void;
  (e: 'seated', tableId: string): void;
}>();

const reservationStore = useReservationStore();
const showTableSelect = ref(false);

const typeLabels: Record<string, string> = {
  small: '小桌',
  medium: '中桌',
  large: '大桌',
  private: '包厢',
};

const recommendedTables = computed(() => 
  reservationStore.getRecommendedTables(props.reservation.id)
);

const hasRecommendedTables = computed(() => recommendedTables.value.length > 0);

const isSeated = computed(() => reservationStore.isReservationSeated(props.reservation.id));

const isArrivedNotSeated = computed(() => 
  props.reservation.status === 'arrived' && !isSeated.value
);

const isReservedTable = (table: TableInfo): boolean => {
  return table.id === props.reservation.tableId && table.status === 'reserved';
};

const getTableMatchLevel = (table: TableInfo): 'reserved' | 'perfect' | 'good' | 'alternative' => {
  if (isReservedTable(table)) {
    return 'reserved';
  }
  if (table.tableType === props.reservation.tableType && table.capacity === props.reservation.partySize) {
    return 'perfect';
  }
  if (table.tableType === props.reservation.tableType) {
    return 'good';
  }
  return 'alternative';
};

const matchLevelLabels: Record<string, { label: string; class: string; bgClass: string }> = {
  reserved: { label: '预留桌位', class: 'text-violet-700', bgClass: 'bg-violet-100' },
  perfect: { label: '完美匹配', class: 'text-emerald-700', bgClass: 'bg-emerald-100' },
  good: { label: '推荐', class: 'text-blue-700', bgClass: 'bg-blue-100' },
  alternative: { label: '备选', class: 'text-amber-700', bgClass: 'bg-amber-100' },
};

const handleArriveClick = () => {
  if (hasRecommendedTables.value) {
    showTableSelect.value = true;
  } else {
    emit('arrive');
  }
};

const handleSelectTable = (tableId: string) => {
  emit('seated', tableId);
  showTableSelect.value = false;
};

const handleMarkArrivedOnly = () => {
  emit('arrive');
  showTableSelect.value = false;
};

const isExpiring = computed(() => {
  if (props.reservation.status !== 'pending') return false;
  const diff = getMinutesDiff(props.reservation.reservedTime);
  return diff > 0 && diff <= 15;
});

const isOverdue = computed(() => {
  if (props.reservation.status !== 'pending') return false;
  return getMinutesDiff(props.reservation.reservedTime) > 15;
});

const statusConfig = computed(() => {
  switch (props.reservation.status) {
    case 'pending':
      return {
        label: isExpiring.value ? '即将超时' : '待到店',
        class: isExpiring.value
          ? 'bg-orange-100 text-orange-700 border-orange-200'
          : 'bg-blue-50 text-blue-700 border-blue-200',
        icon: Clock,
      };
    case 'arrived':
      if (!isSeated.value) {
        return {
          label: '待入座',
          class: 'bg-amber-100 text-amber-700 border-amber-200',
          icon: AlertTriangle,
        };
      }
      return {
        label: '已入座',
        class: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        icon: Check,
      };
    case 'cancelled':
      return { label: '已取消', class: 'bg-slate-100 text-slate-500 border-slate-200', icon: X };
    case 'expired':
      return { label: '已超时', class: 'bg-rose-100 text-rose-700 border-rose-200', icon: AlertTriangle };
    default:
      return { label: '未知', class: 'bg-slate-100 text-slate-500 border-slate-200', icon: Clock };
  }
});
</script>

<template>
  <div
    class="relative pl-6 pb-4"
  >
    <div
      class="absolute left-0 top-1.5 w-3 h-3 rounded-full -translate-x-[5px] border-2 border-white shadow-sm z-10"
      :class="{
        'bg-blue-500': reservation.status === 'pending' && !isExpiring,
        'bg-orange-500': isExpiring,
        'bg-rose-500': isOverdue || reservation.status === 'expired',
        'bg-amber-500': isArrivedNotSeated,
        'bg-emerald-500': reservation.status === 'arrived' && isSeated,
        'bg-slate-400': reservation.status === 'cancelled',
      }"
    />
    <div
      class="absolute left-0 top-4 bottom-0 w-px -translate-x-[1px]"
      :class="reservation.status === 'pending' ? 'bg-blue-200' : 'bg-slate-200'"
    />

    <div
      class="rounded-xl p-3 border transition-all hover:shadow-md"
      :class="[
        reservation.status === 'expired'
          ? 'bg-rose-50/50 border-rose-200'
          : isExpiring
          ? 'bg-orange-50/50 border-orange-200'
          : isArrivedNotSeated
          ? 'bg-amber-50/50 border-amber-200'
          : reservation.status === 'cancelled'
          ? 'bg-slate-50 border-slate-200 opacity-70'
          : 'bg-white border-slate-200',
      ]"
    >
      <div class="flex items-start justify-between gap-2 mb-2">
        <div class="flex items-center gap-2">
          <span
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border"
            :class="statusConfig.class"
          >
            <component :is="statusConfig.icon" class="w-3 h-3" />
            {{ statusConfig.label }}
          </span>
          <span class="text-xs text-slate-500 px-2 py-0.5 rounded-full bg-slate-100">
            {{ typeLabels[reservation.tableType] }}
          </span>
        </div>
        <span class="text-sm font-semibold text-slate-700 tabular-nums">
          {{ formatTime(reservation.reservedTime) }}
        </span>
      </div>

      <div class="flex items-center justify-between mb-1.5">
        <span class="font-semibold text-slate-800">{{ reservation.customerName }}</span>
        <span class="text-sm text-slate-600 flex items-center gap-1">
          <Users class="w-3.5 h-3.5" />
          {{ reservation.partySize }}人
        </span>
      </div>

      <div class="flex items-center gap-3 text-xs text-slate-500 mb-2">
        <span class="flex items-center gap-1">
          <Phone class="w-3 h-3" />
          {{ reservation.phone }}
        </span>
        <span v-if="reservation.tableName" class="flex items-center gap-1">
          <MapPin class="w-3 h-3" />
          {{ reservation.tableName }}
        </span>
      </div>

      <div v-if="reservation.note" class="flex items-start gap-1 text-xs text-slate-500 mb-2 bg-slate-50 rounded-lg px-2 py-1.5">
        <MessageSquare class="w-3 h-3 mt-0.5 shrink-0" />
        <span>{{ reservation.note }}</span>
      </div>

      <div v-if="reservation.status === 'pending'" class="flex items-center gap-2 pt-2 border-t border-slate-100">
        <button
          class="flex-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium flex items-center justify-center gap-1 transition-colors"
          @click="handleArriveClick"
        >
          <Check class="w-3.5 h-3.5" />
          确认到店
        </button>
        <button
          class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium flex items-center justify-center gap-1 transition-colors"
          @click="emit('cancel')"
        >
          <X class="w-3.5 h-3.5" />
          取消
        </button>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="showTableSelect"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="showTableSelect = false" />
        <div class="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
          <div class="px-5 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-200">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                <UtensilsCrossed class="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 class="font-bold text-slate-800">选择桌台入座</h3>
                <p class="text-xs text-slate-500">
                  {{ reservation.customerName }} · {{ reservation.partySize }}人 · {{ typeLabels[reservation.tableType] }}
                </p>
              </div>
            </div>
          </div>

          <div class="max-h-96 overflow-y-auto">
            <div v-if="recommendedTables.length === 0" class="p-8 text-center">
              <div class="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle class="w-7 h-7 text-amber-500" />
              </div>
              <p class="text-sm text-slate-600 mb-1">暂无空闲桌台</p>
              <p class="text-xs text-slate-400">可先标记到店，稍后安排桌位</p>
            </div>

            <div v-else class="p-3 space-y-2">
              <div
                v-for="table in recommendedTables"
                :key="table.id"
                class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all group"
                :class="[
                  isReservedTable(table)
                    ? 'border-violet-300 bg-violet-50/60 hover:bg-violet-50 hover:border-violet-400'
                    : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                ]"
                @click="handleSelectTable(table.id)"
              >
                <div
                  class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  :class="isReservedTable(table) ? 'bg-violet-100' : 'bg-emerald-100'"
                >
                  <span
                    class="font-bold"
                    :class="isReservedTable(table) ? 'text-violet-700' : 'text-emerald-700'"
                  >
                    {{ table.name }}
                  </span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-0.5">
                    <span class="font-semibold text-slate-800">{{ table.name }}</span>
                    <span
                      class="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                      :class="[matchLevelLabels[getTableMatchLevel(table)].bgClass, matchLevelLabels[getTableMatchLevel(table)].class]"
                    >
                      <CalendarCheck v-if="getTableMatchLevel(table) === 'reserved'" class="w-3 h-3 inline -mt-0.5" />
                      <Sparkles v-else-if="getTableMatchLevel(table) === 'perfect'" class="w-3 h-3 inline -mt-0.5" />
                      {{ matchLevelLabels[getTableMatchLevel(table)].label }}
                    </span>
                  </div>
                  <div class="text-xs text-slate-500 flex items-center gap-2">
                    <span>{{ typeLabels[table.tableType] }}</span>
                    <span>·</span>
                    <span>可坐{{ table.capacity }}人</span>
                  </div>
                </div>
                <ChevronRight
                  class="w-5 h-5 transition-colors shrink-0"
                  :class="isReservedTable(table) ? 'text-violet-300 group-hover:text-violet-500' : 'text-slate-300 group-hover:text-emerald-500'"
                />
              </div>
            </div>
          </div>

          <div class="px-5 py-3 border-t border-slate-100 bg-slate-50 flex gap-2">
            <button
              class="flex-1 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium transition-colors"
              @click="showTableSelect = false"
            >
              取消
            </button>
            <button
              v-if="recommendedTables.length > 0"
              class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium transition-colors"
              @click="handleMarkArrivedOnly"
            >
              仅标记到店
            </button>
            <button
              v-if="recommendedTables.length > 0"
              class="flex-1 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
              @click="handleSelectTable(recommendedTables[0].id)"
            >
              <Check class="w-4 h-4" />
              快速入座
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
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
