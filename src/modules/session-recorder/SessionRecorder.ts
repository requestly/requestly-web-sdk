import { record, getRecordConsolePlugin, PLUGIN_NAME as CONSOLE_PLUGIN, EventType } from 'rrweb';
import {
  Environment,
  NetworkEventData,
  RQSession,
  RQSessionEvent,
  RQSessionEvents,
  RQSessionEventType,
  RRWebEventData,
} from './types';
import Bowser from 'bowser';
import { Network } from '../network';

const POST_MESSAGE_SOURCE = 'requestly:websdk:sessionRecorder';
const RELAY_EVENT_MESSAGE_ACTION = 'relayEventToTopDocument';

interface RelayEventMessagePayload {
  eventType: RQSessionEventType;
  event: RQSessionEvent;
  url: string;
}

export interface SessionRecorderOptions {
  maxDuration?: number;
  console?: boolean;
  network?: boolean;
  relayEventsToTop?: boolean;
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
      relayEventsToTop: options.relayEventsToTop && window.top !== window,
    };
    this.#url = window.location.href;

    if (!this.#options.relayEventsToTop) {
      this.#captureEnvironment();

      window.addEventListener('message', (message) => {
        if (message.data.source !== POST_MESSAGE_SOURCE) {
          return;
        }

        if (message.data.action === RELAY_EVENT_MESSAGE_ACTION) {
          const { eventType, event, url } = message.data.payload as RelayEventMessagePayload;
          this.#addEvent(eventType, {
            ...event,
            frameUrl: url,
          });
        }
      });
    }
  }

  start(): void {
    const plugins = [];
    if (this.#options.console) {
      plugins.push(getRecordConsolePlugin());
    }

    if (this.#options.relayEventsToTop) {
      if (this.#isCrossDomainFrame()) {
        // RRWeb already handles events for same domain frames
        this.#stopRecording = record({
          plugins,
          emit: (event) => {
            if (event.type === EventType.Plugin && event.data.plugin === CONSOLE_PLUGIN) {
              this.#relayEventToTopDocument(RQSessionEventType.RRWEB, event);
            }
          },
        });
      }

      this.#interceptNetworkRequests((event) => {
        this.#relayEventToTopDocument(RQSessionEventType.NETWORK, event);
      });

      return;
    }

    this.#lastTwoSessionEvents = [this.#getEmptySessionEvents(), this.#getEmptySessionEvents()];
    this.#stopRecording = record({
      plugins,
      checkoutEveryNms: this.#options.maxDuration,
      emit: (event, isCheckout) => {
        if (isCheckout) {
          this.#lastTwoSessionEvents = [this.#lastTwoSessionEvents[1], this.#getEmptySessionEvents()];
        }
        this.#addEvent(RQSessionEventType.RRWEB, event);
      },
    });

    this.#interceptNetworkRequests((event) => {
      this.#addEvent(RQSessionEventType.NETWORK, event);
    });
  }

  stop(): void {
    this.#stopRecording?.();
    this.#stopRecording = null;
    Network.clearInterceptors();
  }

  getSession(): RQSession {
    if (this.#options.relayEventsToTop) {
      return null;
    }

    const events: RQSessionEvents = {};
    Object.values(RQSessionEventType).forEach((eventType) => {
      events[eventType] = this.#lastTwoSessionEvents[0][eventType].concat(this.#lastTwoSessionEvents[1][eventType]);
    });

    const rrwebEvents = events[RQSessionEventType.RRWEB] as RRWebEventData[];
    const firstEventTime = rrwebEvents[0]?.timestamp;
    const lastEventTime = rrwebEvents[rrwebEvents.length - 1]?.timestamp;

    return {
      attributes: {
        url: this.#url,
        startTime: firstEventTime,
        duration: lastEventTime - firstEventTime,
        environment: this.#environment,
      },
      events,
    };
  }

  #interceptNetworkRequests(captureEventFn: (event: NetworkEventData) => void): void {
    if (!this.#options.network) {
      return;
    }

    Network.intercept(/.*/, ({ method, url, requestData, response, contentType, status, responseTime }) => {
      captureEventFn({
        timestamp: Date.now(),
        method,
        url,
        requestData,
        response,
        contentType,
        status,
        responseTime,
      });
    });
  }

  #addEvent(eventType: RQSessionEventType, event: RQSessionEvent): void {
    this.#lastTwoSessionEvents[1]?.[eventType]?.push(event);
  }

  #isCrossDomainFrame(): boolean {
    try {
      if (window.parent.document !== null) {
        // can access parent frame -> not a cross domain frame
        return false;
      }
    } catch (e) {}

    return true;
  }

  #captureEnvironment(): void {
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
    const emptySessionEvents: RQSessionEvents = {};

    Object.values(RQSessionEventType).forEach((eventType) => {
      emptySessionEvents[eventType] = [];
    });
    return emptySessionEvents;
  }

  #relayEventToTopDocument(eventType: RQSessionEventType, event: RQSessionEvent): void {
    window.top.postMessage(
      {
        source: POST_MESSAGE_SOURCE,
        action: RELAY_EVENT_MESSAGE_ACTION,
        payload: {
          eventType,
          event,
          url: this.#url,
        } as RelayEventMessagePayload,
      },
      '*',
    );
  }
}
