import { record, getRecordConsolePlugin } from 'rrweb';
import { Environment, RQSession, RQSessionEvents } from '../types';
import Bowser from 'bowser';

export interface SessionRecorderOptions {
  maxDuration?: number;
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
  #environment: Environment;
  #stopTime: number;
  #transientSessions: [TransientSession, TransientSession];

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

  #getEmptyTransientState(): TransientSession {
    return { startTime: Date.now(), events: { rrweb: [] } };
  }

  start(): void {
    const plugins = [];
    if (this.#options.console) {
      plugins.push(getRecordConsolePlugin());
    }

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
        environment: this.#environment,
      },
      events: {
        rrweb: rrwebEvents,
      },
    };
  }
}
