import { getInterceptRecordForUrl } from '../interceptors';
import { ApiType, NetworkInterceptorArgs } from '../types';
import {
  convertSearchParamsToJSON,
  getAbsoluteUrl,
  getCustomResponse,
  isJsonResponse,
  jsonifyValidJSONString,
  parseHeaders,
} from '../utils';

const getInterceptorArgs = async (
  url: string,
  request: Request,
  response: Response,
  responseTime: number,
): Promise<NetworkInterceptorArgs> => {
  const method = request.method;
  const requestHeaders = parseHeaders(request.headers);
  let requestData: unknown;

  if (method === 'POST') {
    requestData = jsonifyValidJSONString(await request.text());
  } else {
    requestData = convertSearchParamsToJSON(url);
  }

  const responseData = await response.text();
  const responseHeaders = parseHeaders(response.headers);
  const responseDataAsJson = jsonifyValidJSONString(responseData);

  return {
    api: ApiType.FETCH,
    method,
    url,
    requestHeaders,
    requestData,
    response: responseData,
    responseURL: response.url,
    responseJSON: responseDataAsJson,
    responseHeaders,
    contentType: responseHeaders['content-type'],
    responseTime,
    status: response.status,
    statusText: response.statusText,
  };
};

const _fetch = fetch;

// @ts-ignore
fetch = async (resource: RequestInfo, initOptions: RequestInit = {}) => {
  const getOriginalResponse = (): Promise<Response> => _fetch(resource, initOptions);

  let request: Request;
  if (resource instanceof Request) {
    request = resource.clone();
  } else {
    request = new Request(resource.toString(), initOptions);
  }

  const url = getAbsoluteUrl(request.url);
  const startTime = performance.now();
  const originalResponse = await getOriginalResponse();
  const responseTime = Math.floor(performance.now() - startTime);

  const { interceptor, overrideResponse } = getInterceptRecordForUrl(url) || {};

  if (!interceptor) {
    return originalResponse;
  }

  const response = originalResponse.clone();

  if (!overrideResponse) {
    // do not wait for interceptor to finish execution
    getInterceptorArgs(url, request, response, responseTime).then(interceptor);
    return originalResponse;
  }

  const interceptorArgs = await getInterceptorArgs(url, request, response, responseTime);
  const customResponse = await getCustomResponse(interceptor, interceptorArgs, isJsonResponse(response));

  if (!customResponse) {
    // nothing to override, return original response
    return originalResponse;
  }

  return new Response(new Blob([customResponse.body as BlobPart]), {
    status: customResponse.status,
    statusText: customResponse.statusText,
    headers: customResponse.headers,
  });
};
