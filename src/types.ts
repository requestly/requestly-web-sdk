import { eventWithTime } from 'rrweb/typings/types';

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

export interface RQSessionEvents {
  rrweb?: eventWithTime[];
}

export interface RQSession {
  attributes: RQSessionAttributes;
  events: RQSessionEvents;
}
