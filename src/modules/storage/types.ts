import { CommonEventData } from "../session-recorder";

export enum StorageType {
    LOCAL = 'local',
    SESSION = 'session',
  }

export enum StorageEventType {
  INITIAL_STORAGE_VALUE = 'initialStorageValue',
  KEY_UPDATE = 'keyUpdate',
}
  
  export type StorageEventData = CommonEventData & {
    timestamp: number;
    key: string;
    storageType: StorageType;
  } & (
    | {
        eventType: StorageEventType.INITIAL_STORAGE_VALUE;
        value: string | null;
      }
    | {
        eventType: StorageEventType.KEY_UPDATE;
        oldValue: string | null;
        newValue: string | null;
      }
  );

