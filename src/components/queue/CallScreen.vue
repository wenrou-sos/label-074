<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
import { X, Volume2, VolumeX, Check, SkipForward } from 'lucide-vue-next';
import { useQueueStore } from '../../stores/queue';
import { useSpeech } from '../../composables/useSpeech';
import { formatDuration } from '../../composables/useTimer';

const queueStore = useQueueStore();
const { speak, stop, isSpeaking } = useSpeech();

const soundEnabled = ref(true);
const flashCount = ref(0);

const columnConfig = computed(() => {
  if (!queueStore.currentCalled) return null;
  return queueStore.columnConfigs.find((c) => c.tableType === queueStore.currentCalled!.tableType);
});

const queueNumber = computed(() => {
  if (!queueStore.currentCalled) return '';
  return `${queueStore.currentCalled.prefix}${queueStore.currentCalled.number.toString().padStart(3, '0')}`;
});

let flashTimer: number | null = null;
let closeTimer: number | null = null;

const startFlash = () => {
  flashCount.value = 0;
  flashTimer = window.setInterval(() => {
    flashCount.value++;
  }, 500);
};

const stopFlash = () => {
  if (flashTimer) {
    clearInterval(flashTimer);
    flashTimer = null;
  }
};

const playAnnouncement = () => {
  if (!queueStore.currentCalled || !soundEnabled.value) return;
  const typeLabel = columnConfig.value?.label || '';
  const text = `叮咚，请${queueNumber.value}号顾客，${typeLabel}用餐，请您到${typeLabel}区就座。`;
  speak(text);
  setTimeout(() => {
    if (queueStore.currentCalled && soundEnabled.value) {
      speak(text);
    }
  }, 3000);
};

watch(
  () => queueStore.currentCalled,
  (newVal) => {
    if (newVal) {
      startFlash();
      playAnnouncement();
      if (closeTimer) clearTimeout(closeTimer);
      closeTimer = window.setTimeout(() => {
        queueStore.closeCallScreen();
      }, 15000);
    } else {
      stopFlash();
      stop();
    }
  },
  { immediate: true }
);

onMounted(() => {
  if (queueStore.currentCalled) {
    startFlash();
  }
});

onUnmounted(() => {
  stopFlash();
  if (closeTimer) clearTimeout(closeTimer);
  stop();
});

const handleClose = () => {
  queueStore.closeCallScreen();
};

const handleSeat = () => {
  if (queueStore.currentCalled) {
    queueStore.confirmSeated(queueStore.currentCalled.id);
  }
};

const handleMiss = () => {
  if (queueStore.currentCalled) {
    queueStore.markMissed(queueStore.currentCalled.id);
  }
};

const toggleSound = () => {
  soundEnabled.value = !soundEnabled.value;
  if (!soundEnabled.value) {
    stop();
  } else {
    playAnnouncement();
  }
};
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="queueStore.showCallScreen && queueStore.currentCalled"
        class="fixed inset-0 z-50 flex items-center justify-center p-8"
      >
        <div class="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" @click="handleClose" />

        <div
          class="relative w-full max-w-4xl aspect-[16/9] rounded-3xl overflow-hidden shadow-2xl"
          :class="flashCount % 2 === 0 ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-orange-900 via-slate-900 to-slate-800'"
        >
          <div class="absolute inset-0 opacity-20">
            <div class="absolute top-0 left-0 w-96 h-96 bg-orange-500 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div class="absolute bottom-0 right-0 w-96 h-96 bg-amber-500 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          </div>

          <button
            class="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
            @click="handleClose"
          >
            <X class="w-6 h-6" />
          </button>

          <button
            class="absolute top-6 left-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
            @click="toggleSound"
          >
            <Volume2 v-if="soundEnabled" class="w-6 h-6" />
            <VolumeX v-else class="w-6 h-6" />
          </button>

          <div class="relative h-full flex flex-col items-center justify-center text-white px-8">
            <div class="text-xl font-medium text-orange-300 mb-4 tracking-widest">请 您 就 餐</div>

            <div
              class="text-[10rem] font-black tabular-nums leading-none tracking-tight mb-4 transition-all duration-300"
              :class="flashCount % 2 === 0 ? 'text-white' : 'text-orange-400'"
              style="text-shadow: 0 0 60px rgba(251, 146, 60, 0.5)"
            >
              {{ queueNumber }}
            </div>

            <div class="flex items-center gap-3 mb-6">
              <span
                class="text-2xl font-bold px-6 py-2 rounded-full"
                :class="[columnConfig?.bgColor, columnConfig?.color]"
              >
                {{ columnConfig?.label }}
              </span>
              <span class="text-2xl text-slate-300">
                {{ queueStore.currentCalled?.partySize }}人
              </span>
            </div>

            <div class="text-lg text-slate-400 mb-8">
              {{ queueStore.currentCalled?.customerName }} · {{ queueStore.currentCalled?.phone }}
            </div>

            <div v-if="queueStore.currentCalled?.waitTime" class="text-sm text-slate-500 mb-8">
              感谢您的耐心等待，共等候 {{ formatDuration(queueStore.currentCalled.waitTime) }}
            </div>

            <div class="flex items-center gap-4">
              <button
                class="px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/30"
                @click="handleSeat"
              >
                <Check class="w-6 h-6" />
                确认入座
              </button>
              <button
                class="px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                @click="handleMiss"
              >
                <SkipForward class="w-6 h-6" />
                过号重排
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: scale(0.9);
}
</style>
