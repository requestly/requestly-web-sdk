import { StorageEventData, StorageEventType, StorageListener, StorageType } from './types';

class StorageClass {
  private storageListeners: Record<StorageType, StorageListener> = {
    [StorageType.LOCAL]: null,
    [StorageType.SESSION]: null,
  };

  initStorageCapture(storageType: StorageType): void {
    this.captureInitialStorageDump(storageType);
    window.addEventListener('storage', this.captureStorageEvent);
  }

  startCapturingStorage(storageType: StorageType, listener: StorageListener): void {
    this.storageListeners[storageType] = listener;
    this.initStorageCapture(storageType);
  }

  stopCapturingStorage(): void {
    window.removeEventListener('storage', this.captureStorageEvent);
    this.storageListeners = {
      [StorageType.LOCAL]: null,
      [StorageType.SESSION]: null,
    };
  }

  private captureInitialStorageDump(storageType: StorageType): void {
    const storage = storageType === StorageType.LOCAL ? localStorage : sessionStorage;
    Object.keys(storage).forEach((key) => {
      const value = storage.getItem(key);
      const storageEvent: StorageEventData = {
        timestamp: Date.now(),
        key,
        value,
        eventType: StorageEventType.INITIAL_STORAGE_VALUE,
        storageType,
      };
      this.notifyListeners(storageEvent);
    });
  }

  private captureStorageEvent = (event: StorageEvent): void => {
    const storageEvent: StorageEventData = {
      timestamp: Date.now(),
      key: event.key,
      eventType: StorageEventType.KEY_UPDATE,
      oldValue: event.oldValue,
      newValue: event.newValue,
      storageType: event.storageArea === localStorage ? StorageType.LOCAL : StorageType.SESSION,
    };
    this.notifyListeners(storageEvent);
  };

  private notifyListeners(event: StorageEventData): void {
    const listener = this.storageListeners[event.storageType];
    if (listener) {
      listener(event);
    }
  }
}

export const Storage = new StorageClass();
