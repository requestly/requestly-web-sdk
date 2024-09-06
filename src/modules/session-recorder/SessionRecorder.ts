import { record, getRecordConsolePlugin, PLUGIN_NAME as CONSOLE_PLUGIN, EventType, recordOptions } from 'rrweb';
import {
  Environment,
  NetworkEventData,
  RQNetworkEventErrorCodes,
  RQSession,
  RQSessionEvent,
  RQSessionEvents,
  RQSessionEventType,
  RRWebEventData,
  StorageEventData,
} from './types';
import Bowser from 'bowser';
import { Network } from '../network';
import { getObjectSizeInBytes, isMediaRequest } from './utils';

const POST_MESSAGE_SOURCE = 'requestly:websdk:sessionRecorder';
const RELAY_EVENT_MESSAGE_ACTION = 'relayEventToTopDocument';
const DEFAULT_MAX_DURATION = 5 * 60 * 1000;

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
  previousSession?: RQSession;
  ignoreMediaResponse?: boolean;
  maxPayloadSize?: number; // in Bytes
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
      maxDuration: options.maxDuration ?? DEFAULT_MAX_DURATION,
      relayEventsToTop: options.relayEventsToTop && window.top !== window,
      ignoreMediaResponse: options.ignoreMediaResponse ?? true,
      maxPayloadSize: options.maxPayloadSize ?? 100 * 1024, // 100KB max payload size of any request/response
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

    const commonRrwebOptions: Partial<recordOptions<unknown>> = {
      recordAfter: 'DOMContentLoaded',
      recordCrossOriginIframes: true,
      blockClass: 'rq-element',
    };

    if (this.#options.relayEventsToTop) {
      if (this.#isCrossDomainFrame()) {
        // RRWeb already handles events for same domain frames
        this.#stopRecording = record({
          plugins,
          ...commonRrwebOptions,
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

    const lastSessionEvents = this.#options.previousSession?.events ?? this.#getEmptySessionEvents();
    this.#lastTwoSessionEvents = [this.#getEmptySessionEvents(), lastSessionEvents];
    this.#stopRecording = record({
      plugins,
      ...commonRrwebOptions,
      checkoutEveryNms: this.#options.maxDuration,
      emit: (event, isCheckout) => {
        if (isCheckout) {
          const previousSessionEvents = this.#lastTwoSessionEvents[1];
          const previousSessionRRWebEvents = previousSessionEvents[exports.RQSessionEventType.RRWEB];
          if (previousSessionRRWebEvents.length > 1) {
            const timeElapsedInBucket =
              previousSessionRRWebEvents[previousSessionRRWebEvents.length - 1].timestamp -
              previousSessionRRWebEvents[0].timestamp;
            // final session duration should be between T and 2T where T is maxDuration
            if (timeElapsedInBucket >= this.#options.maxDuration) {
              this.#lastTwoSessionEvents = [previousSessionEvents, this.#getEmptySessionEvents()];
            }
          }
        }

        this.#addEvent(RQSessionEventType.RRWEB, event);
      },
    });

    this.#interceptNetworkRequests((event) => {
      this.#addEvent(RQSessionEventType.NETWORK, event);
    });

    this.#captureInitialLocalStorageDump();
    this.#startCapturingLocalStorage();
  }

  stop(): void {
    this.#stopRecording?.();
    this.#stopRecording = null;
    Network.clearInterceptors();
    this.#stopCapturingLocalStorage();
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
        url: this.#options.previousSession?.attributes.url ?? this.#url,
        startTime: firstEventTime,
        duration: lastEventTime - firstEventTime,
        environment: this.#options.previousSession?.attributes.environment ?? this.#environment,
      },
      events,
    };
  }

  #interceptNetworkRequests(captureEventFn: (event: NetworkEventData) => void): void {
    if (!this.#options.network) {
      return;
    }

    Network.intercept(
      /.*/,
      ({ method, url, requestData, responseJSON, responseURL, contentType, status, statusText, responseTime }) => {
        captureEventFn(
          this.#filterOutLargeNetworkValues({
            timestamp: Date.now(),
            method,
            url,
            requestData,
            response: responseJSON,
            responseURL,
            contentType,
            status,
            statusText,
            responseTime,
          }),
        );
      },
    );
  }

  #addEvent(eventType: RQSessionEventType, event: RQSessionEvent): void {
    const previousSessionEvents = this.#lastTwoSessionEvents[1]?.[eventType];
    // DOMContentLoaded events sometimes come out of order
    if (event.type === EventType.DomContentLoaded) {
      const insertIndex = previousSessionEvents?.findIndex((arrayEvent) => event.timestamp < arrayEvent.timestamp);
      if (insertIndex > -1) {
        previousSessionEvents?.splice(insertIndex, 0, event);
        return;
      }
    }
    previousSessionEvents?.push(event);
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

  #filterOutLargeNetworkValues(networkEventData: NetworkEventData): NetworkEventData {
    const errors: RQNetworkEventErrorCodes[] = [];

    if (this.#options.ignoreMediaResponse && isMediaRequest(networkEventData.contentType)) {
      networkEventData.response = '';
    } else {
      const responseBodySize = getObjectSizeInBytes(networkEventData.response);

      if (responseBodySize > this.#options.maxPayloadSize) {
        networkEventData.response = '';
        errors.push(RQNetworkEventErrorCodes.RESPONSE_TOO_LARGE);
      }
    }

    const requestDataSize = getObjectSizeInBytes(networkEventData.requestData);
    if (requestDataSize > this.#options.maxPayloadSize) {
      networkEventData.requestData = '';
      errors.push(RQNetworkEventErrorCodes.REQUEST_TOO_LARGE);
    }

    return { ...networkEventData, errors };
  }

  #captureInitialLocalStorageDump(): void {
    const localStorageKeys = Object.keys(localStorage);
    localStorageKeys.forEach((key) => {
      const value = localStorage?.getItem(key);
      const storageEvent: StorageEventData = {
        timestamp: Date.now(),
        key,
        value,
        eventType: "initialStorageValue",
        };
        console.log("storageEvent", storageEvent);
        this.#addEvent(RQSessionEventType.STORAGE, storageEvent);
    });
  }

  #startCapturingLocalStorage(): void {
    window.addEventListener('storage', this.#captureStorageEvent);
  }

  #stopCapturingLocalStorage(): void {
    window.removeEventListener('storage', this.#captureStorageEvent);
  }

  #captureStorageEvent = (event: StorageEvent): void => {
    if (event.storageArea === localStorage) {
      const storageEvent: StorageEventData = {
        timestamp: Date.now(),
        key: event.key,
        eventType: "keyUpdate",
        oldValue: event.oldValue,
        newValue: event.newValue,
      };
      this.#addEvent(RQSessionEventType.STORAGE, storageEvent);
    }
  };
}

