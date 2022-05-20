import { record as recordVideo } from 'rrweb';
import { RQSession } from '../types';

export interface SessionRecorderOptions {
  video?: boolean;
  networkRequests?: boolean;
}

export class SessionRecorder {
  #options: SessionRecorderOptions;
  #session: RQSession;
  #stopVideoRecording: () => void;

  constructor(options: SessionRecorderOptions) {
    this.#options = options || {
      video: true,
      networkRequests: true,
    };

    this.#session = {
      attributes: {
        url: window.location.href,
      },
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
    this.#session.attributes.startTime = Date.now();
  }

  stop(): void {
    this.#stopVideoRecording?.();
    this.#session.attributes.stopTime = Date.now();
  }

  getSession(): RQSession {
    return this.#session;
  }
}
