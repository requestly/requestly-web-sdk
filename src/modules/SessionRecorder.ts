import { record, getRecordConsolePlugin } from 'rrweb';
import { Environment, RQSession, RQSessionEvents } from '../types';
import Bowser from 'bowser';

export interface SessionRecorderOptions {
  maxDuration?: number;
  console?: boolean;
}

export class SessionRecorder {
  #options: SessionRecorderOptions;
  #stopRecording: () => void;
  #url: string;
  #environment: Environment;
  #lastTwoSessionEvents: [RQSessionEvents, RQSessionEvents];

  constructor(options: SessionRecorderOptions) {
    this.#options = {
      ...options,
      maxDuration: options.maxDuration || 10 * 60 * 1000,
    };
    this.#url = window.location.href;

    const userAgent = window.navigator.userAgent;
    const parsedEnvironment = Bowser.parse(userAgent);
    this.#environment = {
      userAgent,
      language: window.navigator.languages?.[0] || window.navigator.language,
      browser: parsedEnvironment.browser,
      os: parsedEnvironment.os,
      // @ts-ignore
      platform: parsedEnvironment.platform,
      browserDimensions: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      screenDimensions: {
        width: window.screen.width,
        height: window.screen.height,
      },
      devicePixelRatio: window.devicePixelRatio,
    };
  }

  #getEmptySessionEvents(): RQSessionEvents {
    return { rrweb: [] };
  }

  start(): void {
    const plugins = [];
    if (this.#options.console) {
      plugins.push(getRecordConsolePlugin());
    }

    this.#lastTwoSessionEvents = [this.#getEmptySessionEvents(), this.#getEmptySessionEvents()];
    this.#stopRecording = record({
      emit: (event, isCheckout) => {
        if (isCheckout) {
          this.#lastTwoSessionEvents = [this.#lastTwoSessionEvents[1], this.#getEmptySessionEvents()];
        }
        this.#lastTwoSessionEvents[1].rrweb.push(event);
      },
      checkoutEveryNms: this.#options.maxDuration,
      plugins,
    });
  }

  stop(): void {
    this.#stopRecording?.();
    this.#stopRecording = null;
  }

  getSession(): RQSession {
    const rrwebEvents = this.#lastTwoSessionEvents[0].rrweb.concat(this.#lastTwoSessionEvents[1].rrweb);
    const firstEventTime = rrwebEvents[0]?.timestamp;
    const lastEventTime = rrwebEvents[rrwebEvents.length - 1]?.timestamp;

    return {
      attributes: {
        url: this.#url,
        startTime: firstEventTime,
        duration: lastEventTime - firstEventTime,
        environment: this.#environment,
      },
      events: {
        rrweb: rrwebEvents,
      },
    };
  }
}
