import { record as recordVideo } from 'rrweb';
import { eventWithTime } from 'rrweb/typings/types';
import { RQSession, RQSessionAttributes } from '../types';

export interface SessionRecorderOptions {
  maxDuration?: number;
  video?: boolean;
}

export class SessionRecorder {
  #options: SessionRecorderOptions;
  #stopVideoRecording: () => void;
  #sessionAttributes: RQSessionAttributes;
  #videoEventsMatrix: [eventWithTime[], eventWithTime[]] = [[], []];

  constructor(options: SessionRecorderOptions) {
    this.#options = { ...options } || {
      video: true,
    };

    this.#options.maxDuration = this.#options.maxDuration || 30 * 60 * 1000;

    this.#sessionAttributes = {
      url: window.location.href,
    };
  }

  start(): void {
    if (this.#options.video) {
      this.#stopVideoRecording = recordVideo({
        emit: (event, isCheckout) => {
          if (isCheckout) {
            this.#videoEventsMatrix = [this.#videoEventsMatrix[1], []];
          }
          this.#videoEventsMatrix[1].push(event);
        },
        checkoutEveryNms: this.#options.maxDuration,
      });
    }
    this.#sessionAttributes.startTime = Date.now();
  }

  stop(): void {
    this.#stopVideoRecording?.();
    this.#sessionAttributes.duration = this.getSessionDuration();
  }

  getSessionDuration(): number {
    return Date.now() - this.#sessionAttributes.startTime;
  }

  getSession(): RQSession {
    return {
      attributes: {
        ...this.#sessionAttributes,
        duration: this.#sessionAttributes.duration || this.getSessionDuration(),
      },
      events: {
        video: this.#videoEventsMatrix[0].concat(this.#videoEventsMatrix[1]),
      },
    };
  }
}
