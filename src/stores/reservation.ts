import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Reservation } from '../types/reservation';
import { initialReservations } from '../mock/reservation';
import { getMinutesDiff } from '../composables/useTimer';

export const useReservationStore = defineStore('reservation', () => {
  const reservations = ref<Reservation[]>([...initialReservations]);

  const todayReservations = computed(() =>
    [...reservations.value].sort((a, b) => a.reservedTime.getTime() - b.reservedTime.getTime())
  );

  const pendingReservations = computed(() =>
    todayReservations.value.filter((r) => r.status === 'pending')
  );

  const checkExpired = () => {
    const now = new Date();
    reservations.value.forEach((r) => {
      if (r.status === 'pending') {
        const diff = getMinutesDiff(r.reservedTime, now);
        if (diff > 15) {
          r.status = 'expired';
          if (r.tableId) {
            r.tableId = undefined;
            r.tableName = undefined;
          }
        }
      }
    });
  };

  const markArrived = (id: string) => {
    const r = reservations.value.find((x) => x.id === id);
    if (r) r.status = 'arrived';
  };

  const cancelReservation = (id: string) => {
    const r = reservations.value.find((x) => x.id === id);
    if (r) {
      r.status = 'cancelled';
      if (r.tableId) {
        r.tableId = undefined;
        r.tableName = undefined;
      }
    }
  };

  const getTimeGroupedReservations = () => {
    const groups: Record<string, Reservation[]> = {};
    todayReservations.value.forEach((r) => {
      const hour = r.reservedTime.getHours();
      const key = `${hour.toString().padStart(2, '0')}:00`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    return groups;
  };

  return {
    reservations,
    todayReservations,
    pendingReservations,
    checkExpired,
    markArrived,
    cancelReservation,
    getTimeGroupedReservations,
  };
});
