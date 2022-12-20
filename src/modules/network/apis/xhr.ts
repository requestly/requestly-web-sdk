import { getInterceptRecordForUrl } from '../interceptors';
import { ApiType, NetworkHeaders, NetworkInterceptorArgs } from '../types';
import { convertSearchParamsToJSON, getAbsoluteUrl, getCustomResponse, jsonifyIfPossible } from '../utils';

interface XMLHttpRequestWithMeta extends XMLHttpRequest {
  startTime: number;
  method: string;
  requestHeaders: NetworkHeaders;
  requestData: unknown;
  url: string;
}

const onReadyStateChange = async function (this: XMLHttpRequestWithMeta): Promise<void> {
  if (this.readyState === 4) {
    const { interceptor, overrideResponse } = getInterceptRecordForUrl(this.url) || {};

    if (!interceptor) {
      return;
    }

    const responseTime = Math.floor(performance.now() - this.startTime);

    const responseHeaders = {};
    this.getAllResponseHeaders()
      .trim()
      .split(/[\r\n]+/)
      .forEach((line: string) => {
        const parts = line.split(': ');
        const header = parts.shift();
        const value = parts.join(': ');
        responseHeaders[header] = value;
      });

    const responseType = this.responseType;
    let requestData: unknown;

    if (this.method === 'POST') {
      requestData = jsonifyIfPossible(this.requestData);
    } else {
      requestData = convertSearchParamsToJSON(this.url);
    }

    const interceptorArgs: NetworkInterceptorArgs = {
      api: ApiType.XHR,
      responseTime,
      method: this.method,
      url: this.url,
      requestHeaders: this.requestHeaders,
      requestData,
      responseType: this.responseType,
      response: this.response,
      responseURL: this.responseURL,
      responseJSON: jsonifyIfPossible(this.response),
      responseHeaders,
      status: this.status,
      statusText: this.statusText,
      contentType: responseHeaders['content-type'],
    };

    // if response is not to be overridden, do not wait for interceptor to finish execution
    if (!overrideResponse) {
      if (this.response instanceof Blob) {
        this.response.text().then((responseText) => {
          interceptor({
            ...interceptorArgs,
            response: responseText,
            responseJSON: jsonifyIfPossible(responseText),
          });
        });
      } else {
        interceptor(interceptorArgs);
      }
      return;
    }

    const isJsonResponse = responseType === 'json';
    const customResponse = await getCustomResponse(interceptor, interceptorArgs, isJsonResponse);

    if (!customResponse) {
      // nothing to override
      return;
    }

    Object.defineProperty(this, 'response', {
      get() {
        if (isJsonResponse) {
          if (typeof customResponse.body === 'object') {
            return customResponse.body;
          }

          return jsonifyIfPossible(customResponse.body);
        }

        return customResponse.body;
      },
    });

    if (responseType === '' || responseType === 'text') {
      Object.defineProperty(this, 'responseText', { get: () => customResponse.body });
    }

    Object.defineProperty(this, 'status', { get: () => customResponse.status });
    Object.defineProperty(this, 'statusText', { get: () => customResponse.statusText });
    Object.defineProperty(this, 'headers', { get: () => customResponse.headers });
  }
};

const XHR = XMLHttpRequest;
// @ts-ignore
XMLHttpRequest = function () {
  const xhr = new XHR();
  xhr.addEventListener('readystatechange', onReadyStateChange.bind(xhr), false);
  return xhr;
};

XMLHttpRequest.prototype = XHR.prototype;
Object.entries(XHR).map(([key, val]) => {
  XMLHttpRequest[key] = val;
});

const open = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function (method: string, url: string) {
  this.method = method;
  this.startTime = performance.now();
  this.url = getAbsoluteUrl(url);
  open.apply(this, arguments);
};

const send = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.send = function (data: unknown) {
  this.requestData = data;
  send.apply(this, arguments);
};

const setRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
XMLHttpRequest.prototype.setRequestHeader = function (header: string, value: string) {
  this.requestHeaders = this.requestHeaders || {};
  this.requestHeaders[header] = value;
  setRequestHeader.apply(this, arguments);
};

['DONE', 'HEADERS_RECEIVED', 'LOADING', 'OPENED', 'UNSENT'].forEach((extraXHRProperty) => {
  XMLHttpRequest[extraXHRProperty] = XHR[extraXHRProperty];
});
