<script setup lang="ts">
import { computed } from 'vue';
import { Clock, Users, Phone, MapPin, AlertTriangle, Check, X, MessageSquare } from 'lucide-vue-next';
import type { Reservation } from '../../types/reservation';
import { formatTime, getMinutesDiff } from '../../composables/useTimer';

const props = defineProps<{
  reservation: Reservation;
}>();

const emit = defineEmits<{
  (e: 'arrive'): void;
  (e: 'cancel'): void;
}>();

const typeLabels: Record<string, string> = {
  small: '小桌',
  medium: '中桌',
  large: '大桌',
  private: '包厢',
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
      return {
        label: '已到店',
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
        'bg-emerald-500': reservation.status === 'arrived',
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
          @click="emit('arrive')"
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
</template>
