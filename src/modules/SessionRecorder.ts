import { record as recordVideo } from 'rrweb';
import { RequestlySession } from '../types';

export interface SessionRecorderOptions {
  video?: boolean;
  networkRequests?: boolean;
}

export class SessionRecorder {
  #options: SessionRecorderOptions;
  #session: RequestlySession;
  #stopVideoRecording: () => void;

  constructor(options: SessionRecorderOptions) {
    this.#options = options || {
      video: true,
      networkRequests: true,
    };

    this.#session = {
      url: window.location.href,
      events: {},
    };
  }

  start(): void {
    if (this.#options.video) {
      this.#session.events.video = [];

      this.#stopVideoRecording = recordVideo({
        emit: (event) => {
          this.#session.events.video.push(event);
        },
      });
    }
    this.#session.startTime = Date.now();
  }

  stop(): void {
    this.#stopVideoRecording?.();
    this.#session.stopTime = Date.now();
  }

  getData(): RequestlySession {
    return this.#session;
  }
}
