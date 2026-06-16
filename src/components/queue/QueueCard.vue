<script setup lang="ts">
import { computed } from 'vue';
import { Users, Clock, Phone } from 'lucide-vue-next';
import type { QueueItem } from '../../types/queue';
import { formatDuration } from '../../composables/useTimer';

const props = defineProps<{
  item: QueueItem;
  isFirst: boolean;
  colorClass: string;
  bgColorClass: string;
}>();

const emit = defineEmits<{
  (e: 'seat'): void;
  (e: 'miss'): void;
  (e: 'cancel'): void;
}>();

const queueNumber = computed(() => `${props.item.prefix}${props.item.number.toString().padStart(3, '0')}`);
</script>

<template>
  <div
    class="relative rounded-xl p-3 transition-all duration-300 border"
    :class="[
      isFirst
        ? `${bgColorClass} border-2 shadow-lg scale-[1.02] -translate-y-0.5`
        : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-md',
      item.status === 'called' ? 'ring-2 ring-orange-400 ring-offset-1 animate-pulse' : '',
    ]"
  >
    <div class="flex items-start justify-between gap-2">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1.5">
          <span
            class="text-lg font-bold tabular-nums px-2 py-0.5 rounded-md"
            :class="isFirst ? colorClass : 'text-slate-700 bg-slate-100'"
          >
            {{ queueNumber }}
          </span>
          <span v-if="item.status === 'called'" class="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
            已叫号
          </span>
        </div>
        <div class="flex items-center gap-3 text-sm text-slate-600">
          <span class="flex items-center gap-1">
            <Users class="w-3.5 h-3.5" />
            {{ item.partySize }}人
          </span>
          <span class="flex items-center gap-1">
            <Clock class="w-3.5 h-3.5" />
            等{{ formatDuration(item.waitTime) }}
          </span>
        </div>
        <div class="flex items-center gap-1 mt-1 text-xs text-slate-400">
          <Phone class="w-3 h-3" />
          <span>{{ item.phone }}</span>
        </div>
      </div>

      <div v-if="isFirst && item.status !== 'called'" class="flex flex-col gap-1.5 shrink-0">
        <button
          class="text-xs px-2.5 py-1 rounded-md bg-emerald-500 text-white hover:bg-emerald-600 transition-colors font-medium"
          @click="emit('seat')"
        >
          入座
        </button>
        <button
          class="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          @click="emit('miss')"
        >
          过号
        </button>
        <button
          class="text-xs px-2.5 py-1 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
          @click="emit('cancel')"
        >
          取消
        </button>
      </div>

      <div v-else-if="item.status === 'called'" class="flex flex-col gap-1.5 shrink-0">
        <button
          class="text-xs px-2.5 py-1 rounded-md bg-emerald-500 text-white hover:bg-emerald-600 transition-colors font-medium"
          @click="emit('seat')"
        >
          入座
        </button>
        <button
          class="text-xs px-2.5 py-1 rounded-md bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
          @click="emit('miss')"
        >
          过号重排
        </button>
      </div>
    </div>

    <div
      v-if="isFirst && item.estimatedTime > 0"
      class="mt-2 text-xs text-slate-500 flex items-center gap-1"
    >
      <Clock class="w-3 h-3" />
      <span>预计还需 {{ formatDuration(item.estimatedTime) }}</span>
    </div>
  </div>
</template>
