import { eventWithTime } from 'rrweb/typings/types';

export interface RQSessionAttributes {
  url: string;
  startTime?: number;
  duration?: number;
}

export interface RQSessionEvents {
  rrweb?: eventWithTime[];
}

export interface RQSession {
  attributes: RQSessionAttributes;
  events: RQSessionEvents;
}

export interface NetworkInterceptorArgs {
  api: 'xmlhttprequest' | 'fetch';
  method: string;
  url: string;
  requestHeaders: Record<string, string>;
  requestData: unknown;
  responseType: string;
  responseHeaders: Record<string, string>;
  response: unknown;
  responseJSON: unknown;
  time?: number;
}

export type NetworkInterceptor = (args: NetworkInterceptorArgs) => unknown;
