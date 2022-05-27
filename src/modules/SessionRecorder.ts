import { record, getRecordConsolePlugin } from 'rrweb';
import { RQSession, RQSessionEvents } from '../types';

export interface SessionRecorderOptions {
  maxDuration?: number;
  video?: boolean;
  console?: boolean;
}

interface TransientSession {
  startTime: number;
  events: RQSessionEvents;
}

export class SessionRecorder {
  #options: SessionRecorderOptions;
  #stopRecording: () => void;
  #url: string;
  #stopTime: number;
  #transientSessions: [TransientSession, TransientSession];

  constructor(options: SessionRecorderOptions) {
    this.#options = { ...options } || {
      video: true,
    };

    this.#options.maxDuration = this.#options.maxDuration || 10 * 60 * 1000;
    this.#url = window.location.href;
  }

  #getEmptyTransientState(): TransientSession {
    return { startTime: Date.now(), events: { rrweb: [] } };
  }

  start(): void {
    const plugins = [];
    if (this.#options.console) {
      plugins.push(getRecordConsolePlugin());
    }

    if (this.#options.video) {
      this.#transientSessions = [this.#getEmptyTransientState(), this.#getEmptyTransientState()];
      this.#stopRecording = record({
        emit: (event, isCheckout) => {
          if (isCheckout) {
            this.#transientSessions = [this.#transientSessions[1], this.#getEmptyTransientState()];
          }
          this.#transientSessions[1].events.rrweb.push(event);
        },
        checkoutEveryNms: this.#options.maxDuration,
        plugins,
      });
    }
  }

  stop(): void {
    this.#stopRecording?.();
    this.#stopTime = Date.now();
  }

  getSession(): RQSession {
    const startTime = this.#transientSessions[0].startTime;
    const rrwebEvents = this.#transientSessions[0].events.rrweb.concat(this.#transientSessions[1].events.rrweb);

    return {
      attributes: {
        url: this.#url,
        startTime,
        duration: (this.#stopTime || Date.now()) - startTime,
      },
      events: {
        rrweb: rrwebEvents,
      },
    };
  }
}
