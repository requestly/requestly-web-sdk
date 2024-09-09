import { eventWithTime, EventType } from '@rrweb/types';
import { StorageEventData } from '../storage';

export interface Environment {
  userAgent: string;
  language: string;
  browser: {
    name?: string;
    version?: string;
  };
  os: {
    name?: string;
    version?: string;
    versionName?: string;
  };
  platform: {
    type?: 'tablet' | 'mobile' | 'desktop' | 'tv';
    vendor?: string;
    model?: string;
  };
  browserDimensions: {
    width: number;
    height: number;
  };
  screenDimensions: {
    width: number;
    height: number;
  };
  devicePixelRatio: number;
}

export interface RQSessionAttributes {
  url: string;
  startTime?: number;
  duration?: number;
  environment: Environment;
}

export enum RQSessionEventType {
  RRWEB = 'rrweb',
  NETWORK = 'network',
  STORAGE = 'storage',
}

export type CommonEventData = {
  frameUrl?: string;
  type?: EventType;
};

export type RRWebEventData = CommonEventData & eventWithTime;

export type NetworkEventData = CommonEventData & {
  timestamp: number;
  method: string;
  url: string;
  requestData: unknown;
  response: unknown;
  responseURL?: string;
  contentType?: string;
  status: number;
  statusText?: string;
  responseTime?: number;
  errors?: RQNetworkEventErrorCodes[];
};


export interface RQSessionEventDataType {
  [RQSessionEventType.RRWEB]: RRWebEventData;
  [RQSessionEventType.NETWORK]: NetworkEventData;
  [RQSessionEventType.STORAGE]: StorageEventData; 
}

export type RQSessionEvent = RQSessionEventDataType[RQSessionEventType];

export type RQSessionEvents = {
  [eventType in RQSessionEventType]?: RQSessionEvent[];
};

export interface RQSession {
  attributes: RQSessionAttributes;
  events: RQSessionEvents;
}

export enum RQNetworkEventErrorCodes {
  REQUEST_TOO_LARGE = 101,
  RESPONSE_TOO_LARGE = 102,
}
