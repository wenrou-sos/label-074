<script setup lang="ts">
import { computed } from 'vue';
import { LayoutGrid, Users, UtensilsCrossed, Sparkles, CalendarCheck } from 'lucide-vue-next';
import { useTableStore } from '../../stores/table';
import TableCard from './TableCard.vue';

const tableStore = useTableStore();

const tablesByRows = computed(() => tableStore.getTablesByRows());

const rowLabels: Record<number, string> = {
  0: '小桌区 (A区)',
  1: '中桌区 (B区)',
  2: '大桌区 (C区)',
  3: '包厢区 (D区)',
};

const statusLegend = computed(() => tableStore.statusConfigs);
</script>

<template>
  <div class="flex flex-col h-full rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
    <div class="px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-emerald-50 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
          <LayoutGrid class="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <div class="font-bold text-slate-800">翻台看板</div>
          <div class="text-xs text-slate-500">
            共 {{ tableStore.totalTables }} 桌
            ·
            <span class="text-emerald-600 font-medium">空闲 {{ tableStore.idleTables.length }}</span>
            ·
            <span class="text-blue-600 font-medium">就餐 {{ tableStore.diningTables.length }}</span>
            ·
            <span class="text-amber-600 font-medium">待清 {{ tableStore.cleaningTables.length }}</span>
            ·
            <span class="text-violet-600 font-medium">预订 {{ tableStore.reservedTables.length }}</span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div v-for="s in statusLegend" :key="s.status" class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded-full" :class="s.color" />
          <span class="text-xs text-slate-600">{{ s.label }}</span>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-auto p-4 bg-slate-50/50">
      <div class="space-y-6 min-w-max">
        <div v-for="(tables, rowIdx) in tablesByRows" :key="rowIdx">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-sm font-bold text-slate-600">{{ rowLabels[Number(rowIdx)] || `${Number(rowIdx) + 1}区` }}</span>
            <div class="flex-1 h-px bg-slate-200" />
          </div>
          <div class="grid grid-cols-6 gap-3">
            <TableCard
              v-for="table in tables"
              :key="table.id"
              :table="table"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
