import { NetworkInterceptor, NetworkInterceptorArgs } from '../types';

interface InterceptRecord {
  urlPattern: RegExp;
  callback: NetworkInterceptor;
}

const records: InterceptRecord[] = [];

export const intercept = (urlPattern: RegExp, callback: NetworkInterceptor): void => {
  records.push({ urlPattern, callback });
};

const getInterceptorForUrl = (url: string): NetworkInterceptor => {
  const record = records.find(({ urlPattern }) => urlPattern.test(getAbsoluteUrl(url)));
  return record?.callback;
};

const getAbsoluteUrl = (url: string): string => {
  if (url && url.startsWith('/')) {
    return window.origin + url;
  }
  return url;
};

const jsonifyValidJSONString = (mightBeJSONString: unknown): unknown => {
  if (typeof mightBeJSONString !== 'string') {
    return mightBeJSONString;
  }

  try {
    return JSON.parse(mightBeJSONString);
  } catch (e) {
    /* Do Nothing. Unable to parse the param value */
  }

  return mightBeJSONString;
};

const convertSearchParamsToJSON = (url: string): Record<string, unknown> => {
  const result = {};

  if (!url || url === '?' || url.indexOf('?') === -1) {
    return result;
  }

  const paramsObject = Object.fromEntries(new URL(url).searchParams);

  Object.entries(paramsObject).forEach(([paramName, paramValue]) => {
    result[paramName] = jsonifyValidJSONString(paramValue);
  });

  return result;
};

const parseHeaders = (headers: unknown): Record<string, string> => {
  if (headers instanceof Headers) {
    return Array.from(headers).reduce((obj, [key, val]) => {
      obj[key] = val;
      return obj;
    }, {});
  } else if (Array.isArray(headers)) {
    return headers.reduce((obj, [key, val]) => {
      obj[key] = val;
      return obj;
    }, {});
  }

  return headers as Record<string, string>;
};

/******************* Intercept XMLHttpRequest ********************/
const onReadyStateChange = async function (): Promise<void> {
  if (this.readyState === 4) {
    const interceptor = getInterceptorForUrl(this.responseURL);

    if (!interceptor) {
      return;
    }

    let time;
    if (this.startTime) {
      time = Date.now() - this.startTime;
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
      api: 'xmlhttprequest',
      time,
      method: this.method,
      url: this.responseURL,
      requestHeaders: this.requestHeaders,
      requestData: jsonifyValidJSONString(this.requestData),
      responseType: this.responseType,
      response: this.response,
      responseJSON: jsonifyValidJSONString(this.response),
      responseHeaders,
    };

    let customResponse = await interceptor(args);

    if (customResponse === null || customResponse === undefined) {
      customResponse = this.response;
    } else if (typeof customResponse === 'object' && responseType === 'json') {
      customResponse = JSON.stringify(customResponse);
    }

    Object.defineProperty(this, 'response', {
      get() {
        if (responseType === 'json') {
          if (typeof customResponse === 'object') {
            return customResponse;
          }

          return jsonifyValidJSONString(customResponse);
        }

        return customResponse;
      },
    });

    if (responseType === '' || responseType === 'text') {
      Object.defineProperty(this, 'responseText', {
        get() {
          return customResponse;
        },
      });
    }
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
  this.startTime = Date.now();
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

/******************* Intercept fetch API ********************/
const _fetch = fetch;
// @ts-ignore
fetch = async (resource: RequestInfo, initOptions: RequestInit = {}) => {
  const url = resource instanceof Request ? resource.url : resource.toString();
  const startTime = Date.now();
  const fetchedResponse = await _fetch(resource, initOptions);
  const time = Date.now() - startTime;

  const interceptor = getInterceptorForUrl(url);

  if (!interceptor) {
    return;
  }

  if (fetchedResponse.status === 204) {
    // Return the same response when status is 204. fetch doesn't allow to create new response with empty body
    return fetchedResponse;
  }

  let method: string;
  let requestHeaders: Record<string, string>;
  let requestData: unknown;

  if (resource instanceof Request) {
    const request = resource.clone();
    method = request.method || 'GET';
    requestHeaders = parseHeaders(request.headers);
    requestData = jsonifyValidJSONString(await request.text());
  } else {
    requestHeaders = parseHeaders(initOptions.headers);
    if (method === 'POST') {
      requestData = jsonifyValidJSONString(initOptions.body);
    } else {
      requestData = convertSearchParamsToJSON(url);
    }
  }

  const fetchedResponseData = await fetchedResponse.text();
  const responseType = fetchedResponse.headers.get('content-type');
  const isResponseJSON = responseType && responseType.indexOf('application/json') !== -1;
  const fetchedResponseDataAsJson = jsonifyValidJSONString(fetchedResponseData);

  const args: NetworkInterceptorArgs = {
    api: 'fetch',
    time,
    method,
    url,
    requestHeaders,
    requestData,
    responseType,
    response: fetchedResponseData,
    responseJSON: fetchedResponseDataAsJson,
    responseHeaders: undefined, // TODO
  };

  let customResponse = await interceptor(args);

  if (typeof customResponse === 'object' && isResponseJSON) {
    customResponse = JSON.stringify(customResponse);
  }

  return new Response(new Blob([customResponse as BlobPart]), {
    status: fetchedResponse.status,
    statusText: fetchedResponse.statusText,
    headers: fetchedResponse.headers,
  });
};
