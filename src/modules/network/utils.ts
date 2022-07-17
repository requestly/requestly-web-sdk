import { CustomResponse, NetworkInterceptor, NetworkInterceptorArgs } from './types';

export const getAbsoluteUrl = (url: string): string => {
  if (url && url.startsWith('/')) {
    return window.origin + url;
  }
  return url;
};

export const jsonifyValidJSONString = (mightBeJSONString: unknown): unknown => {
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

export const convertSearchParamsToJSON = (url: string): Record<string, unknown> => {
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

export const parseHeaders = (headers: unknown): Record<string, string> => {
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

export const getCustomResponse = async (
  interceptor: NetworkInterceptor,
  args: NetworkInterceptorArgs,
  originalResponse: CustomResponse,
  isJsonResponse: boolean,
): Promise<CustomResponse> => {
  const responseFromInterceptor = await interceptor(args);

  if (responseFromInterceptor) {
    if (typeof responseFromInterceptor === 'object' && isJsonResponse) {
      responseFromInterceptor.body = JSON.stringify(responseFromInterceptor);
    }

    if (originalResponse.status === 204) {
      responseFromInterceptor.status = 200;
    }

    return { ...originalResponse, ...responseFromInterceptor };
  }

  return originalResponse;
};
