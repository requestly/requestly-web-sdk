import { CommonEventData } from '../session-recorder';

export enum StorageType {
  LOCAL = 'local',
  SESSION = 'session',
}

export enum StorageEventType {
  INITIAL_STORAGE_VALUE = 'initialStorageValue',
  KEY_UPDATE = 'keyUpdate',
}

interface BaseStorageEventData extends CommonEventData {
  timestamp: number;
  key: string;
  storageType: StorageType;
}

interface InitialStorageValueEvent extends BaseStorageEventData {
  eventType: StorageEventType.INITIAL_STORAGE_VALUE;
  value: string | null;
}

interface KeyUpdateEvent extends BaseStorageEventData {
  eventType: StorageEventType.KEY_UPDATE;
  oldValue: string | null;
  newValue: string | null;
}

export type StorageEventData = InitialStorageValueEvent | KeyUpdateEvent;
export type StorageListener = ((event: StorageEventData) => void) | null;
