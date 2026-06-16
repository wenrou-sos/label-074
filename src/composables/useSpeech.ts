import { ref } from 'vue';

export function useSpeech() {
  const isSpeaking = ref(false);
  const isSupported = ref('speechSynthesis' in window);

  const speak = (text: string, lang: string = 'zh-CN') => {
    if (!isSupported.value) {
      console.warn('浏览器不支持语音合成');
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      isSpeaking.value = true;
    };

    utterance.onend = () => {
      isSpeaking.value = false;
    };

    utterance.onerror = () => {
      isSpeaking.value = false;
    };

    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    if (isSupported.value) {
      window.speechSynthesis.cancel();
      isSpeaking.value = false;
    }
  };

  return { speak, stop, isSpeaking, isSupported };
}
