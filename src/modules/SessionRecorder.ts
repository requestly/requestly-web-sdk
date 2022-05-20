import { record } from 'rrweb';
import { eventWithTime } from 'rrweb/typings/types';

export interface SessionOptions {
  video?: boolean;
  networkRequests?: boolean;
}

export interface SessionData {
  url: string;
  startTime: number;
  stopTime: number;
  videoEvents?: eventWithTime[];
}

export class SessionRecorder {
  #options: SessionOptions;
  #session: SessionData = {
    url: '',
    startTime: null,
    stopTime: null,
    videoEvents: [],
  };

  constructor(options: SessionOptions) {
    this.#options = options || {
      video: true,
      networkRequests: true,
    };
    this.#session.url = window.location.href;
  }

  start(): void {
    this.#session.startTime = Date.now();

    if (this.#options.video) {
      record({
        emit(event) {
          this.#session.videoEvents.push(event);
        },
      });
    }
  }

  stop(): void {
    this.#session.stopTime = Date.now();
  }

  getData(): SessionData {
    return this.#session;
  }
}
