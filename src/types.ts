import { eventWithTime } from 'rrweb/typings/types';

export interface RequestlySession {
  url: string;
  startTime?: number;
  stopTime?: number;
  events: {
    video?: eventWithTime[];
  };
}
