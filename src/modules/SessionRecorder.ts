import { record as recordVideo } from 'rrweb';
import { RQSession, RQSessionEvents } from '../types';

export interface SessionRecorderOptions {
  maxDuration?: number;
  video?: boolean;
}

interface TransientSession {
  startTime: number;
  events: RQSessionEvents;
}

export class SessionRecorder {
  #options: SessionRecorderOptions;
  #stopVideoRecording: () => void;
  #url: string;
  #stopTime: number;
  #transientSessions: [TransientSession, TransientSession];

  constructor(options: SessionRecorderOptions) {
    this.#options = { ...options } || {
      video: true,
    };

    this.#options.maxDuration = this.#options.maxDuration || 30 * 60 * 1000;
    this.#url = window.location.href;
  }

  #getEmptyTransientState(): TransientSession {
    return { startTime: Date.now(), events: { video: [] } };
  }

  start(): void {
    if (this.#options.video) {
      this.#stopVideoRecording = recordVideo({
        emit: (event, isCheckout) => {
          if (isCheckout) {
            this.#transientSessions = [this.#transientSessions[1], this.#getEmptyTransientState()];
          }
          this.#transientSessions[1].events.video.push(event);
        },
        checkoutEveryNms: this.#options.maxDuration,
      });
    }
    this.#transientSessions = [this.#getEmptyTransientState(), this.#getEmptyTransientState()];
  }

  stop(): void {
    this.#stopVideoRecording?.();
    this.#stopTime = Date.now();
  }

  getSession(): RQSession {
    const startTime = this.#transientSessions[0].startTime;
    const videoEvents = this.#transientSessions[0].events.video.concat(this.#transientSessions[1].events.video);

    return {
      attributes: {
        url: this.#url,
        startTime,
        duration: (this.#stopTime || Date.now()) - startTime,
      },
      events: {
        video: videoEvents,
      },
    };
  }
}
