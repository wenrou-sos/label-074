import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { TableInfo, TableType, TableStatus } from '../types/table';
import { initialTables, tableStatusConfigs } from '../mock/tables';
import { getMinutesDiff } from '../composables/useTimer';
import { useStatsStore } from './stats';
import { useCrossTabSync } from '../composables/useCrossTabSync';

interface TableSyncState {
  tables: TableInfo[];
}

const serializeTableState = (state: TableSyncState) => ({
  tables: state.tables.map((table) => ({
    ...table,
    diningStartTime: table.diningStartTime ? table.diningStartTime.toISOString() : null,
  })),
});

const deserializeTableState = (data: any): TableSyncState => ({
  tables: data.tables.map((table: any) => ({
    ...table,
    diningStartTime: table.diningStartTime ? new Date(table.diningStartTime) : undefined,
  })),
});

export const useTableStore = defineStore('table', () => {
  const tables = ref<TableInfo[]>(JSON.parse(JSON.stringify(initialTables)));
  const statusConfigs = tableStatusConfigs;
  const statsStore = useStatsStore();

  const syncState = computed<TableSyncState>(() => ({
    tables: tables.value,
  }));

  const syncStateRef = ref<TableSyncState>(syncState.value);

  watch(
    syncState,
    (newVal) => {
      syncStateRef.value = newVal;
    },
    { deep: true }
  );

  const { loadInitialState, requestState, cleanup } = useCrossTabSync<TableSyncState>(
    'table',
    syncStateRef,
    serializeTableState,
    deserializeTableState,
    (newState) => {
      tables.value = newState.tables;
    }
  );

  const initialized = loadInitialState();
  if (!initialized) {
    requestState();
  }

  const totalTables = computed(() => tables.value.length);

  const tablesByStatus = (status: TableStatus) =>
    tables.value.filter((t) => t.status === status);

  const idleTables = computed(() => tablesByStatus('idle'));
  const diningTables = computed(() => tablesByStatus('dining'));
  const cleaningTables = computed(() => tablesByStatus('cleaning'));
  const reservedTables = computed(() => tablesByStatus('reserved'));

  const getTablesByType = (tableType: TableType) =>
    tables.value.filter((t) => t.tableType === tableType);

  const getIdleTablesByType = (tableType: TableType) =>
    tables.value.filter((t) => t.tableType === tableType && t.status === 'idle');

  const getTableById = (id: string) => tables.value.find((t) => t.id === id);

  const setTableStatus = (id: string, status: TableStatus) => {
    const table = getTableById(id);
    if (!table) return 0;

    const prevStatus = table.status;
    const prevDuration = table.diningDuration || 0;
    table.status = status;

    if (status === 'dining') {
      table.diningStartTime = new Date();
      table.diningDuration = 0;
    } else if (status === 'idle' || status === 'cleaning') {
      table.diningStartTime = undefined;
      table.diningDuration = undefined;
      table.currentParty = undefined;
    }

    if (prevStatus === 'dining' && status !== 'dining' && prevDuration > 0) {
      statsStore.addCompletedDining(prevDuration);
      return prevDuration;
    }
    return 0;
  };

  const seatParty = (tableId: string, customerName: string, partySize: number, queueId?: string, reservationId?: string) => {
    const table = getTableById(tableId);
    if (!table) return;
    table.status = 'dining';
    table.diningStartTime = new Date();
    table.diningDuration = 0;
    table.currentParty = { customerName, partySize, queueId, reservationId };
  };

  const markCleaning = (id: string) => setTableStatus(id, 'cleaning');
  const markIdle = (id: string) => setTableStatus(id, 'idle');
  const markReserved = (id: string) => setTableStatus(id, 'reserved');

  const updateDiningDurations = () => {
    const now = new Date();
    tables.value.forEach((table) => {
      if (table.status === 'dining' && table.diningStartTime) {
        table.diningDuration = getMinutesDiff(table.diningStartTime, now);
      }
    });
  };

  const getTablesByRows = () => {
    const rows: Record<number, TableInfo[]> = {};
    tables.value.forEach((t) => {
      if (!rows[t.position.row]) rows[t.position.row] = [];
      rows[t.position.row].push(t);
    });
    Object.values(rows).forEach((row) => row.sort((a, b) => a.position.col - b.position.col));
    return rows;
  };

  const getStatusConfig = (status: TableStatus) =>
    statusConfigs.find((c) => c.status === status) || statusConfigs[0];

  return {
    tables,
    statusConfigs,
    totalTables,
    idleTables,
    diningTables,
    cleaningTables,
    reservedTables,
    tablesByStatus,
    getTablesByType,
    getIdleTablesByType,
    getTableById,
    setTableStatus,
    seatParty,
    markCleaning,
    markIdle,
    markReserved,
    updateDiningDurations,
    getTablesByRows,
    getStatusConfig,
    _syncCleanup: cleanup,
  };
});
