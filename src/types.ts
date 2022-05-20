import { eventWithTime } from 'rrweb/typings/types';

export interface RQSessionAttributes {
  url: string;
  startTime?: number;
  duration?: number;
}

export interface RQSessionEvents {
  video?: eventWithTime[];
}

export interface RQSession {
  attributes: RQSessionAttributes;
  events: RQSessionEvents;
}
