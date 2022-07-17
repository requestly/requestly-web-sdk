export enum ApiType {
  XHR = 'xmlhttprequest',
  FETCH = 'fetch',
}

export type NetworkHeaders = Record<string, string>;

export interface NetworkInterceptorArgs {
  api: ApiType;
  method: string;
  url: string;
  requestHeaders: NetworkHeaders;
  requestData: unknown;
  responseType: string;
  responseHeaders: NetworkHeaders;
  response: unknown;
  responseJSON: unknown;
  status: number;
  statusText: string;
  time?: number;
}

export interface CustomResponse {
  body?: unknown;
  headers?: NetworkHeaders;
  status?: number;
  statusText?: string;
}

export type NetworkInterceptor = (args: NetworkInterceptorArgs) => CustomResponse;
