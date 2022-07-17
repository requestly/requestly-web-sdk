import { getInterceptorForUrl } from '../interceptors';
import { ApiType, CustomResponse, NetworkHeaders, NetworkInterceptorArgs } from '../types';
import { getCustomResponse, jsonifyValidJSONString } from '../utils';

interface XMLHttpRequestWithMeta extends XMLHttpRequest {
  startTime: number;
  method: string;
  requestHeaders: NetworkHeaders;
  requestData: unknown;
}

const onReadyStateChange = async function (this: XMLHttpRequestWithMeta): Promise<void> {
  if (this.readyState === 4) {
    const interceptor = getInterceptorForUrl(this.responseURL);

    if (!interceptor) {
      return;
    }

    let time;
    if (this.startTime) {
      time = Math.floor(performance.now() - this.startTime);
    }

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

    const args: NetworkInterceptorArgs = {
      api: ApiType.XHR,
      time,
      method: this.method,
      url: this.responseURL,
      requestHeaders: this.requestHeaders,
      requestData: jsonifyValidJSONString(this.requestData),
      responseType: this.responseType,
      response: this.response,
      responseJSON: jsonifyValidJSONString(this.response),
      responseHeaders,
      status: this.status,
      statusText: this.statusText,
    };

    const isJsonResponse = responseType === 'json';
    const originalResponse: CustomResponse = {
      body: this.response,
      headers: responseHeaders,
      status: this.status,
      statusText: this.statusText,
    };
    const customResponse = await getCustomResponse(interceptor, args, originalResponse, isJsonResponse);

    Object.defineProperty(this, 'response', {
      get() {
        if (isJsonResponse) {
          if (typeof customResponse.body === 'object') {
            return customResponse.body;
          }

          return jsonifyValidJSONString(customResponse.body);
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
XMLHttpRequest.prototype.open = function (method) {
  this.method = method;
  this.startTime = performance.now();
  open.apply(this, arguments);
};

const send = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.send = function (data) {
  this.requestData = data;
  send.apply(this, arguments);
};

const setRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
XMLHttpRequest.prototype.setRequestHeader = function (header, value) {
  this.requestHeaders = this.requestHeaders || {};
  this.requestHeaders[header] = value;
  setRequestHeader.apply(this, arguments);
};

['DONE', 'HEADERS_RECEIVED', 'LOADING', 'OPENED', 'UNSENT'].forEach((extraXHRProperty) => {
  XMLHttpRequest[extraXHRProperty] = XHR[extraXHRProperty];
});
