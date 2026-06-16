import { ref, onUnmounted } from 'vue';

export function useTimer(intervalMs: number = 60000) {
  const timerRef = ref<number | null>(null);
  const isRunning = ref(false);
  const tickCount = ref(0);

  const start = (callback: () => void) => {
    if (timerRef.value) return;
    isRunning.value = true;
    timerRef.value = window.setInterval(() => {
      tickCount.value++;
      callback();
    }, intervalMs);
  };

  const stop = () => {
    if (timerRef.value) {
      clearInterval(timerRef.value);
      timerRef.value = null;
      isRunning.value = false;
    }
  };

  onUnmounted(() => {
    stop();
  });

  return { start, stop, isRunning, tickCount };
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分` : `${hours}小时`;
}

export function formatTime(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function getMinutesDiff(from: Date, to: Date = new Date()): number {
  return Math.floor((to.getTime() - from.getTime()) / 60000);
}
