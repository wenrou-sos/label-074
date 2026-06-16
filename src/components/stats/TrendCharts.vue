<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { TrendingUp, Users } from 'lucide-vue-next';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { useTrendStore } from '../../stores/trend';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const trendStore = useTrendStore();

const queueChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index' as const,
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      titleColor: '#e2e8f0',
      bodyColor: '#e2e8f0',
      borderColor: 'rgba(148, 163, 184, 0.2)',
      borderWidth: 1,
      cornerRadius: 8,
      padding: 10,
      callbacks: {
        label: (ctx: any) => `等位 ${ctx.parsed.y} 人`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#94a3b8', font: { size: 11 } },
      border: { display: false },
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(148, 163, 184, 0.1)' },
      ticks: {
        color: '#94a3b8',
        font: { size: 11 },
        stepSize: 5,
        callback: (value: any) => `${value}人`,
      },
      border: { display: false },
    },
  },
  elements: {
    point: {
      radius: 3,
      hoverRadius: 6,
      borderWidth: 2,
    },
  },
};

const turnoverChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index' as const,
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      titleColor: '#e2e8f0',
      bodyColor: '#e2e8f0',
      borderColor: 'rgba(148, 163, 184, 0.2)',
      borderWidth: 1,
      cornerRadius: 8,
      padding: 10,
      callbacks: {
        label: (ctx: any) => `翻台率 ${ctx.parsed.y.toFixed(2)} 轮`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#94a3b8', font: { size: 11 } },
      border: { display: false },
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(148, 163, 184, 0.1)' },
      ticks: {
        color: '#94a3b8',
        font: { size: 11 },
        callback: (value: any) => `${value.toFixed(1)}轮`,
      },
      border: { display: false },
    },
  },
  elements: {
    point: {
      radius: 3,
      hoverRadius: 6,
      borderWidth: 2,
    },
  },
};

const queueChartData = computed(() => ({
  labels: trendStore.labels,
  datasets: [
    {
      label: '等位人数',
      data: trendStore.queueTrend,
      borderColor: '#f97316',
      backgroundColor: (ctx: any) => {
        const chart = ctx.chart;
        const { ctx: canvasCtx, chartArea } = chart;
        if (!chartArea) return 'rgba(249, 115, 22, 0.1)';
        const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, 'rgba(249, 115, 22, 0.3)');
        gradient.addColorStop(1, 'rgba(249, 115, 22, 0.02)');
        return gradient;
      },
      fill: true,
      tension: 0.4,
      borderWidth: 2.5,
      pointBackgroundColor: '#f97316',
      pointBorderColor: '#fff',
    },
  ],
}));

const turnoverChartData = computed(() => ({
  labels: trendStore.labels,
  datasets: [
    {
      label: '翻台率',
      data: trendStore.turnoverTrend,
      borderColor: '#10b981',
      backgroundColor: (ctx: any) => {
        const chart = ctx.chart;
        const { ctx: canvasCtx, chartArea } = chart;
        if (!chartArea) return 'rgba(16, 185, 129, 0.1)';
        const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0.02)');
        return gradient;
      },
      fill: true,
      tension: 0.4,
      borderWidth: 2.5,
      pointBackgroundColor: '#10b981',
      pointBorderColor: '#fff',
    },
  ],
}));

const peakQueueHour = computed(() => {
  const trend = trendStore.queueTrend;
  if (trend.length === 0) return '-';
  const maxVal = Math.max(...trend);
  const maxIdx = trend.indexOf(maxVal);
  return trendStore.labels[maxIdx] || '-';
});

const peakQueueValue = computed(() => {
  const trend = trendStore.queueTrend;
  if (trend.length === 0) return 0;
  return Math.max(...trend);
});
</script>

<template>
  <div class="grid grid-cols-2 gap-4">
    <div class="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div class="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-orange-50 to-amber-50 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center shadow-sm">
            <Users class="w-4 h-4 text-white" />
          </div>
          <div>
            <div class="font-bold text-slate-800 text-sm">今日等位趋势</div>
            <div class="text-[11px] text-slate-500">按小时统计排队人数</div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-lg font-black text-orange-600 tabular-nums">{{ trendStore.currentQueueCount }}</div>
          <div class="text-[10px] text-slate-500">当前等位</div>
        </div>
      </div>
      <div class="p-4">
        <div class="h-[180px]">
          <Line :data="queueChartData" :options="queueChartOptions" />
        </div>
        <div class="flex items-center justify-between mt-3 px-1">
          <div class="text-[11px] text-slate-500 flex items-center gap-1">
            <span class="inline-block w-2 h-2 rounded-full bg-orange-400" />
            高峰时段: <span class="font-semibold text-slate-700">{{ peakQueueHour }}</span>
          </div>
          <div class="text-[11px] text-slate-500">
            峰值: <span class="font-semibold text-orange-600">{{ peakQueueValue }}人</span>
          </div>
        </div>
      </div>
    </div>

    <div class="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div class="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-sm">
            <TrendingUp class="w-4 h-4 text-white" />
          </div>
          <div>
            <div class="font-bold text-slate-800 text-sm">翻台率走势</div>
            <div class="text-[11px] text-slate-500">按小时统计翻台轮次</div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-lg font-black text-emerald-600 tabular-nums">{{ trendStore.currentTurnoverRate.toFixed(1) }}</div>
          <div class="text-[10px] text-slate-500">当前轮次</div>
        </div>
      </div>
      <div class="p-4">
        <div class="h-[180px]">
          <Line :data="turnoverChartData" :options="turnoverChartOptions" />
        </div>
        <div class="flex items-center justify-between mt-3 px-1">
          <div class="text-[11px] text-slate-500 flex items-center gap-1">
            <span class="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            累计翻台: <span class="font-semibold text-slate-700">{{ trendStore.snapshots.length > 0 ? trendStore.snapshots[trendStore.snapshots.length - 1].turnoverRate.toFixed(2) : '0.00' }}轮</span>
          </div>
          <div class="text-[11px] text-slate-500">
            目标: <span class="font-semibold text-emerald-600">3.0轮</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
