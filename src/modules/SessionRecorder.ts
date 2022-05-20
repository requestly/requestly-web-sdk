import { record as recordVideo } from 'rrweb';
import { eventWithTime } from 'rrweb/typings/types';

export interface SessionOptions {
  video?: boolean;
  networkRequests?: boolean;
}

export interface SessionData {
  url: string;
  startTime?: number;
  stopTime?: number;
  videoEvents?: eventWithTime[];
}

export class SessionRecorder {
  #options: SessionOptions;
  #session: SessionData;
  #stopVideoRecording: () => void;

  constructor(options: SessionOptions) {
    this.#options = options || {
      video: true,
      networkRequests: true,
    };

    this.#session = {
      url: window.location.href,
    };
  }

  start(): void {
    if (this.#options.video) {
      this.#session.videoEvents = [];

      this.#stopVideoRecording = recordVideo({
        emit: (event) => {
          this.#session.videoEvents.push(event);
        },
      });
    }
    this.#session.startTime = Date.now();
  }

  stop(): void {
    this.#stopVideoRecording?.();
    this.#session.stopTime = Date.now();
  }

  getData(): SessionData {
    return this.#session;
  }
}
