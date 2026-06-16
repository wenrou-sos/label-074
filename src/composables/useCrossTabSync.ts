import { ref, watch, type Ref } from 'vue';

interface SyncMessage<T> {
  type: 'state-update' | 'state-request' | 'state-response';
  storeName: string;
  payload?: T;
  timestamp: number;
  senderId: string;
}

const CLIENT_ID = Math.random().toString(36).substring(2, 9);
const STORAGE_PREFIX = 'restaurant_sync_';

const channels: Record<string, BroadcastChannel | null> = {};
const lastTimestamps: Record<string, number> = {};

function getChannel(storeName: string): BroadcastChannel {
  if (!channels[storeName]) {
    channels[storeName] = new BroadcastChannel(`restaurant_${storeName}`);
  }
  return channels[storeName]!;
}

function getStorageKey(storeName: string): string {
  return `${STORAGE_PREFIX}${storeName}`;
}

function saveToStorage<T>(storeName: string, data: T): void {
  try {
    const wrapper = {
      data,
      timestamp: Date.now(),
      senderId: CLIENT_ID,
    };
    localStorage.setItem(getStorageKey(storeName), JSON.stringify(wrapper));
  } catch (e) {
    console.warn('Failed to save state to localStorage:', e);
  }
}

function loadFromStorage<T>(storeName: string): { data: T; timestamp: number } | null {
  try {
    const raw = localStorage.getItem(getStorageKey(storeName));
    if (!raw) return null;
    const wrapper = JSON.parse(raw);
    return { data: wrapper.data, timestamp: wrapper.timestamp };
  } catch (e) {
    console.warn('Failed to load state from localStorage:', e);
    return null;
  }
}

export function useCrossTabSync<T>(
  storeName: string,
  stateRef: Ref<T>,
  serialize: (state: T) => any,
  deserialize: (data: any) => T,
  onRemoteUpdate?: (data: T) => void
) {
  const isSyncing = ref(false);
  const channel = getChannel(storeName);

  const broadcast = (data: T) => {
    if (isSyncing.value) return;

    const timestamp = Date.now();
    lastTimestamps[storeName] = timestamp;

    const message: SyncMessage<T> = {
      type: 'state-update',
      storeName,
      payload: serialize(data),
      timestamp,
      senderId: CLIENT_ID,
    };

    try {
      channel.postMessage(message);
    } catch (e) {
      console.warn('Failed to broadcast message:', e);
    }

    saveToStorage(storeName, serialize(data));
  };

  const handleMessage = (event: MessageEvent<SyncMessage<T>>) => {
    const message = event.data;
    if (!message || message.storeName !== storeName) return;
    if (message.senderId === CLIENT_ID) return;

    if (message.type === 'state-update' && message.payload) {
      if (message.timestamp <= (lastTimestamps[storeName] || 0)) return;

      isSyncing.value = true;
      lastTimestamps[storeName] = message.timestamp;

      try {
        const newState = deserialize(message.payload);
        stateRef.value = newState;
        onRemoteUpdate?.(newState);
        saveToStorage(storeName, message.payload);
      } finally {
        setTimeout(() => {
          isSyncing.value = false;
        }, 50);
      }
    }

    if (message.type === 'state-request') {
      const response: SyncMessage<T> = {
        type: 'state-response',
        storeName,
        payload: serialize(stateRef.value),
        timestamp: Date.now(),
        senderId: CLIENT_ID,
      };
      try {
        channel.postMessage(response);
      } catch (e) {
        console.warn('Failed to send state response:', e);
      }
    }

    if (message.type === 'state-response' && message.payload) {
      const stored = loadFromStorage<T>(storeName);
      if (!stored || message.timestamp > stored.timestamp) {
        isSyncing.value = true;
        lastTimestamps[storeName] = message.timestamp;
        try {
          const newState = deserialize(message.payload);
          stateRef.value = newState;
          onRemoteUpdate?.(newState);
          saveToStorage(storeName, message.payload);
        } finally {
          setTimeout(() => {
            isSyncing.value = false;
          }, 50);
        }
      }
    }
  };

  const requestState = () => {
    const message: SyncMessage<T> = {
      type: 'state-request',
      storeName,
      timestamp: Date.now(),
      senderId: CLIENT_ID,
    };
    try {
      channel.postMessage(message);
    } catch (e) {
      console.warn('Failed to request state:', e);
    }
  };

  const loadInitialState = () => {
    const stored = loadFromStorage<T>(storeName);
    if (stored) {
      isSyncing.value = true;
      lastTimestamps[storeName] = stored.timestamp;
      try {
        const newState = deserialize(stored.data);
        stateRef.value = newState;
        onRemoteUpdate?.(newState);
      } finally {
        setTimeout(() => {
          isSyncing.value = false;
        }, 50);
      }
      return true;
    }
    return false;
  };

  channel.addEventListener('message', handleMessage);

  const stopWatch = watch(
    stateRef,
    (newVal) => {
      if (!isSyncing.value) {
        broadcast(newVal);
      }
    },
    { deep: true }
  );

  const cleanup = () => {
    channel.removeEventListener('message', handleMessage);
    stopWatch();
  };

  return {
    isSyncing,
    broadcast,
    requestState,
    loadInitialState,
    cleanup,
  };
}
