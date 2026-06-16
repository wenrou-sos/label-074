<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useQueueStore } from '../stores/queue';
import { useTableStore } from '../stores/table';
import { useReservationStore } from '../stores/reservation';
import StatsHeader from '../components/stats/StatsHeader.vue';
import QueueColumn from '../components/queue/QueueColumn.vue';
import CallScreen from '../components/queue/CallScreen.vue';
import ReservationList from '../components/reservation/ReservationList.vue';
import FloorPlan from '../components/floor/FloorPlan.vue';

const queueStore = useQueueStore();
const tableStore = useTableStore();
const reservationStore = useReservationStore();

let tickTimer: number | null = null;
let reservationTimer: number | null = null;

onMounted(() => {
  tickTimer = window.setInterval(() => {
    tableStore.updateDiningDurations();
    queueStore.updateWaitTimes();
  }, 60000);

  reservationTimer = window.setInterval(() => {
    reservationStore.checkExpired();
  }, 30000);

  reservationStore.checkExpired();
});

onUnmounted(() => {
  if (tickTimer) clearInterval(tickTimer);
  if (reservationTimer) clearInterval(reservationTimer);
});
</script>

<template>
  <div class="min-h-screen flex flex-col p-4 gap-4">
    <StatsHeader />

    <div class="flex-1 grid grid-cols-12 gap-4 min-h-0">
      <div class="col-span-5 flex flex-col gap-4 min-h-0">
        <div class="grid grid-cols-2 gap-4 flex-1 min-h-0">
          <QueueColumn table-type="small" />
          <QueueColumn table-type="medium" />
        </div>
        <div class="grid grid-cols-2 gap-4 flex-1 min-h-0">
          <QueueColumn table-type="large" />
          <QueueColumn table-type="private" />
        </div>
      </div>

      <div class="col-span-4 min-h-0">
        <FloorPlan />
      </div>

      <div class="col-span-3 min-h-0">
        <ReservationList />
      </div>
    </div>

    <CallScreen />
  </div>
</template>
