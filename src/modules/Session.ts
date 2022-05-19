export interface SessionOptions {
  video?: boolean;
  networkRequests?: boolean;
}

export interface SessionData {
  startTime: number;
  stopTime: number;
}

export class Session {
  #options: SessionOptions;
  #startTime: number;
  #stopTime: number;

  constructor(options: SessionOptions) {
    this.#options = options || {
      video: true,
      networkRequests: true,
    };
  }

  start(): void {
    this.#startTime = Date.now();
    console.log('Starting session recording...');
    if (this.#options.video) {
      console.log('Recording video in session...');
    }
  }

  stop(): void {
    this.#stopTime = Date.now();
    console.log('Stopped session recording');
  }

  getData(): SessionData {
    return {
      startTime: this.#startTime,
      stopTime: this.#stopTime,
    };
  }
}
