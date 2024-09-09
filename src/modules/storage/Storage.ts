import { StorageEventData, StorageEventType, StorageType } from './types';

export class Storage {
  private static storageListeners: {
    [StorageType.LOCAL]: ((event: StorageEventData) => void) | null;
    [StorageType.SESSION]: ((event: StorageEventData) => void) | null;
  } = {
    [StorageType.LOCAL]: null,
    [StorageType.SESSION]: null,
  };

  static initStorageCapture(
    captureInitialDump: boolean = true,
    localStorage: boolean = false,
    sessionStorage: boolean = false,
  ): void {
    if (localStorage || sessionStorage) {
      if (captureInitialDump) {
        if (localStorage) this.captureInitialStorageDump(StorageType.LOCAL);
        if (sessionStorage) this.captureInitialStorageDump(StorageType.SESSION);
      }
      window.addEventListener('storage', this.captureStorageEvent);
    }
  }

  static stopStorageCapture(): void {
    window.removeEventListener('storage', this.captureStorageEvent);
  }

  static addListener(listener: (event: StorageEventData) => void, storageType: StorageType): void {
    this.storageListeners[storageType] = listener;
  }

  static removeListener(storageType: StorageType): void {
    this.storageListeners[storageType] = null;
  }

  private static captureInitialStorageDump(storageType: StorageType): void {
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

  private static captureStorageEvent = (event: StorageEvent): void => {
    if (event.storageArea === localStorage || event.storageArea === sessionStorage) {
      const storageEvent: StorageEventData = {
        timestamp: Date.now(),
        key: event.key,
        eventType: StorageEventType.KEY_UPDATE,
        oldValue: event.oldValue,
        newValue: event.newValue,
        storageType: event.storageArea === localStorage ? StorageType.LOCAL : StorageType.SESSION,
      };
      this.notifyListeners(storageEvent);
    }
  };

  private static notifyListeners(event: StorageEventData): void {
    const listener = this.storageListeners[event.storageType];
    if (listener) {
      listener(event);
    }
  }
}
