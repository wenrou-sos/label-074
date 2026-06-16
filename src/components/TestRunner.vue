<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Play, CheckCircle, XCircle, RotateCcw, Terminal } from 'lucide-vue-next';
import { runTests } from '../tests/queueTableFlow.test';
import type { TestResult } from '../tests/queueTableFlow.test';

const isRunning = ref(false);
const testResults = ref<TestResult[]>([]);
const passedCount = ref(0);
const failedCount = ref(0);
const logs = ref<string[]>([]);
const showLogs = ref(false);

const originalConsoleLog = console.log;

const runAllTests = async () => {
  isRunning.value = true;
  testResults.value = [];
  logs.value = [];
  passedCount.value = 0;
  failedCount.value = 0;

  const logsBuffer: string[] = [];
  console.log = (...args: any[]) => {
    logsBuffer.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '));
    originalConsoleLog.apply(console, args);
  };

  try {
    const result = runTests();
    testResults.value = result.results;
    passedCount.value = result.passed;
    failedCount.value = result.failed;
  } finally {
    logs.value = logsBuffer;
    console.log = originalConsoleLog;
    isRunning.value = false;
  }
};

const successRate = () => {
  const total = passedCount.value + failedCount.value;
  if (total === 0) return 0;
  return ((passedCount.value / total) * 100).toFixed(1);
};

onMounted(() => {
  runAllTests();
});
</script>

<template>
  <div class="min-h-screen bg-slate-50 p-6">
    <div class="max-w-5xl mx-auto">
      <div class="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
        <div class="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-6 py-5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <Terminal class="w-6 h-6" />
              </div>
              <div>
                <h1 class="text-xl font-bold">餐厅前厅运营管理面板 - 功能测试</h1>
                <p class="text-slate-400 text-sm">排队入座 → 桌台分配 → 用餐结束 → 统计更新 全流程验证</p>
              </div>
            </div>
            <button
              class="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              :disabled="isRunning"
              @click="runAllTests"
            >
              <RotateCcw class="w-4 h-4" :class="{ 'animate-spin': isRunning }" />
              {{ isRunning ? '运行中...' : '重新运行' }}
            </button>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4 p-6 bg-slate-50 border-b border-slate-200">
          <div class="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
            <div class="flex items-center gap-2 mb-2">
              <CheckCircle class="w-5 h-5 text-emerald-500" />
              <span class="text-sm font-medium text-emerald-700">通过</span>
            </div>
            <div class="text-3xl font-black text-emerald-600 tabular-nums">{{ passedCount }}</div>
          </div>
          <div class="bg-rose-50 rounded-xl p-4 border border-rose-200">
            <div class="flex items-center gap-2 mb-2">
              <XCircle class="w-5 h-5 text-rose-500" />
              <span class="text-sm font-medium text-rose-700">失败</span>
            </div>
            <div class="text-3xl font-black text-rose-600 tabular-nums">{{ failedCount }}</div>
          </div>
          <div class="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div class="flex items-center gap-2 mb-2">
              <Play class="w-5 h-5 text-blue-500" />
              <span class="text-sm font-medium text-blue-700">成功率</span>
            </div>
            <div class="text-3xl font-black text-blue-600 tabular-nums">{{ successRate() }}%</div>
          </div>
        </div>

        <div class="p-6">
          <div class="space-y-3">
            <div
              v-for="(result, index) in testResults"
              :key="index"
              class="flex items-start gap-3 p-4 rounded-xl transition-all"
              :class="result.passed ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'"
            >
              <div class="shrink-0 mt-0.5">
                <CheckCircle v-if="result.passed" class="w-5 h-5 text-emerald-500" />
                <XCircle v-else class="w-5 h-5 text-rose-500" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-semibold" :class="result.passed ? 'text-emerald-800' : 'text-rose-800'">
                  {{ result.name }}
                </div>
                <div v-if="!result.passed" class="text-sm text-rose-600 mt-1">
                  {{ result.message }}
                </div>
              </div>
            </div>
          </div>

          <div v-if="testResults.length === 0 && !isRunning" class="text-center py-12 text-slate-400">
            <Play class="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>点击「重新运行」开始测试</p>
          </div>
        </div>

        <div class="border-t border-slate-200">
          <button
            class="w-full px-6 py-3 flex items-center justify-center gap-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            @click="showLogs = !showLogs"
          >
            <Terminal class="w-4 h-4" />
            {{ showLogs ? '隐藏' : '显示' }} 控制台日志
          </button>
          <div v-if="showLogs" class="bg-slate-900 text-slate-100 p-4 max-h-96 overflow-auto font-mono text-xs">
            <div v-for="(log, index) in logs" :key="index" class="py-0.5">
              {{ log }}
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-lg p-6">
        <h2 class="text-lg font-bold text-slate-800 mb-4">测试用例说明</h2>
        <div class="grid md:grid-cols-2 gap-4">
          <div class="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h3 class="font-semibold text-slate-700 mb-2">核心流程测试 (4-9)</h3>
            <ul class="text-sm text-slate-600 space-y-1">
              <li>• 排队顾客确认入座自动分配空闲桌台</li>
              <li>• 用餐桌次和翻台率实时更新</li>
              <li>• 结束用餐进入待清理状态</li>
              <li>• 平均用餐时长统计更新</li>
              <li>• 清理完成桌台恢复空闲</li>
            </ul>
          </div>
          <div class="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h3 class="font-semibold text-slate-700 mb-2">边界条件测试 (11-12)</h3>
            <ul class="text-sm text-slate-600 space-y-1">
              <li>• 无空闲桌台时无法入座</li>
              <li>• 只能分配对应类型的桌台</li>
              <li>• 桌台完整生命周期验证</li>
            </ul>
          </div>
          <div class="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h3 class="font-semibold text-slate-700 mb-2">初始状态验证 (1-3)</h3>
            <ul class="text-sm text-slate-600 space-y-1">
              <li>• 存在空闲小桌</li>
              <li>• 排队队列有等待顾客</li>
              <li>• 统计数据正确初始化</li>
            </ul>
          </div>
          <div class="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h3 class="font-semibold text-slate-700 mb-2">统计验证 (13-14)</h3>
            <ul class="text-sm text-slate-600 space-y-1">
              <li>• 等位流失率计算正确</li>
              <li>• 预订超时自动取消功能</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
