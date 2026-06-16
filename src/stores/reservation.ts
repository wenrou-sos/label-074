import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Reservation } from '../types/reservation';
import type { TableInfo, TableType } from '../types/table';
import { initialReservations } from '../mock/reservation';
import { getMinutesDiff } from '../composables/useTimer';
import { useTableStore } from './table';

export const useReservationStore = defineStore('reservation', () => {
  const reservations = ref<Reservation[]>([...initialReservations]);
  const tableStore = useTableStore();

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

  const getRecommendedTables = (reservationId: string): TableInfo[] => {
    const reservation = reservations.value.find((r) => r.id === reservationId);
    if (!reservation) return [];

    const { tableType, partySize } = reservation;

    const idleTables = tableStore.tables.filter((t) => t.status === 'idle');

    const sameTypePerfect = idleTables.filter(
      (t) => t.tableType === tableType && t.capacity === partySize
    );

    const sameTypeLarger = idleTables
      .filter((t) => t.tableType === tableType && t.capacity > partySize)
      .sort((a, b) => a.capacity - b.capacity);

    const otherTypes = idleTables
      .filter((t) => t.tableType !== tableType && t.capacity >= partySize)
      .sort((a, b) => {
        const typeOrder: Record<TableType, number> = { small: 0, medium: 1, large: 2, private: 3 };
        const typeDiff = Math.abs(typeOrder[a.tableType] - typeOrder[tableType]) 
          - Math.abs(typeOrder[b.tableType] - typeOrder[tableType]);
        if (typeDiff !== 0) return typeDiff;
        return a.capacity - b.capacity;
      });

    return [...sameTypePerfect, ...sameTypeLarger, ...otherTypes];
  };

  const seatReservation = (reservationId: string, tableId: string) => {
    const reservation = reservations.value.find((r) => r.id === reservationId);
    if (!reservation) return false;

    const table = tableStore.getTableById(tableId);
    if (!table || table.status !== 'idle') return false;

    if (reservation.tableId && reservation.tableId !== tableId) {
      const oldTable = tableStore.getTableById(reservation.tableId);
      if (oldTable && oldTable.status === 'reserved') {
        tableStore.markIdle(reservation.tableId);
      }
    }

    reservation.status = 'arrived';
    reservation.tableId = table.id;
    reservation.tableName = table.name;

    tableStore.seatParty(
      table.id,
      reservation.customerName,
      reservation.partySize,
      undefined,
      reservation.id
    );

    return true;
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
    getRecommendedTables,
    seatReservation,
    cancelReservation,
    getTimeGroupedReservations,
  };
});
