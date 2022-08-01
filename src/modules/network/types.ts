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
  responseHeaders: NetworkHeaders;
  responseType?: string; // only available in XHR
  response: unknown;
  responseJSON: unknown;
  contentType?: string;
  responseTime?: number;
  status: number;
  statusText: string;
}

export interface CustomResponse {
  body?: unknown;
  headers?: NetworkHeaders;
  status?: number;
  statusText?: string;
}

type NetworkInterceptorReturnValue = CustomResponse | void;

export type NetworkInterceptor = (
  args: NetworkInterceptorArgs,
) => NetworkInterceptorReturnValue | Promise<NetworkInterceptorReturnValue>;
