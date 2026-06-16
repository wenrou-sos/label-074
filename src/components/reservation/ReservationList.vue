<script setup lang="ts">
import { computed } from 'vue';
import { CalendarDays, Clock, AlertCircle } from 'lucide-vue-next';
import { useReservationStore } from '../../stores/reservation';
import ReservationCard from './ReservationCard.vue';

const reservationStore = useReservationStore();

const timeGroups = computed(() => reservationStore.getTimeGroupedReservations());

const todayStr = computed(() => {
  const d = new Date();
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`;
});

const pendingCount = computed(() => reservationStore.pendingReservations.length);
const expiredCount = computed(() =>
  reservationStore.reservations.filter((r) => r.status === 'expired').length
);

const handleArrive = (id: string) => {
  reservationStore.markArrived(id);
};

const handleSeated = (id: string, tableId: string) => {
  reservationStore.seatReservation(id, tableId);
};

const handleCancel = (id: string) => {
  reservationStore.cancelReservation(id);
};
</script>

<template>
  <div class="flex flex-col h-full rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
    <div class="px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-violet-50 to-blue-50">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          <div class="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
            <CalendarDays class="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <div class="font-bold text-slate-800">今日预订</div>
            <div class="text-xs text-slate-500 flex items-center gap-1">
              <Clock class="w-3 h-3" />
              {{ todayStr }}
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
            待到店 {{ pendingCount }}
          </span>
          <span v-if="expiredCount > 0" class="text-xs px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 font-medium flex items-center gap-1">
            <AlertCircle class="w-3 h-3" />
            超时 {{ expiredCount }}
          </span>
        </div>
      </div>
      <div class="text-xs text-slate-500 bg-white/60 rounded-lg px-3 py-2 flex items-center gap-1.5">
        <AlertCircle class="w-3.5 h-3.5 text-amber-500 shrink-0" />
        预订超时15分钟未到店将自动取消并释放桌台
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-4">
      <div v-for="(reservations, time) in timeGroups" :key="time">
        <div class="flex items-center gap-2 mb-2 mt-1">
          <span class="text-xs font-bold text-slate-400 tabular-nums bg-slate-100 px-2 py-0.5 rounded">
            {{ time }}
          </span>
          <div class="flex-1 h-px bg-slate-100" />
          <span class="text-xs text-slate-400">{{ reservations.length }}单</span>
        </div>
        <ReservationCard
          v-for="r in reservations"
          :key="r.id"
          :reservation="r"
          @arrive="handleArrive(r.id)"
          @seated="(tableId) => handleSeated(r.id, tableId)"
          @cancel="handleCancel(r.id)"
        />
      </div>

      <div
        v-if="reservationStore.todayReservations.length === 0"
        class="h-full flex flex-col items-center justify-center text-slate-400 py-16"
      >
        <CalendarDays class="w-12 h-12 mb-3 opacity-40" />
        <span class="text-sm">今日暂无预订</span>
      </div>
    </div>
  </div>
</template>
