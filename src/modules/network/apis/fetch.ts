import { getInterceptorForUrl } from '../interceptors';
import { ApiType, CustomResponse, NetworkInterceptorArgs } from '../types';
import { convertSearchParamsToJSON, getCustomResponse, jsonifyValidJSONString, parseHeaders } from '../utils';

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

  const startTime = performance.now();
  const fetchedResponse = await getOriginalResponse();
  const time = Math.floor(performance.now() - startTime);

  const url = fetchedResponse.url; // final URL obtained after any redirects

  const interceptor = getInterceptorForUrl(url);

  if (!interceptor) {
    return fetchedResponse;
  }

  const method = request.method;
  const requestHeaders = parseHeaders(request.headers);
  let requestData: unknown;

  if (method === 'POST') {
    requestData = jsonifyValidJSONString(await request.text());
  } else {
    requestData = convertSearchParamsToJSON(url);
  }

  const fetchedResponseData = await fetchedResponse.text();
  const responseHeaders = parseHeaders(fetchedResponse.headers);
  const responseType = responseHeaders['content-type'];
  const isResponseJSON = responseType && responseType.indexOf('application/json') !== -1;
  const fetchedResponseDataAsJson = jsonifyValidJSONString(fetchedResponseData);

  const args: NetworkInterceptorArgs = {
    api: ApiType.FETCH,
    time,
    method,
    url,
    requestHeaders,
    requestData,
    responseType,
    response: fetchedResponseData,
    responseJSON: fetchedResponseDataAsJson,
    responseHeaders: responseHeaders,
    status: fetchedResponse.status,
    statusText: fetchedResponse.statusText,
  };

  const originalResponse: CustomResponse = {
    body: fetchedResponseData,
    headers: responseHeaders,
    status: fetchedResponse.status,
    statusText: fetchedResponse.statusText,
  };
  const customResponse = await getCustomResponse(interceptor, args, originalResponse, isResponseJSON);

  return new Response(new Blob([customResponse.body as BlobPart]), {
    status: customResponse.status,
    statusText: customResponse.statusText,
    headers: customResponse.headers,
  });
};
