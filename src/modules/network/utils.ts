import { CustomResponse, NetworkInterceptor, NetworkInterceptorArgs } from './types';

export const getAbsoluteUrl = (url: string): string => {
  const dummyLink = document.createElement('a');
  dummyLink.href = url;
  return dummyLink.href;
};

export const jsonifyIfPossible = (value: unknown): unknown => {
  let jsonString: string;

  if (!value) {
    return value;
  }

  if (value instanceof FormData) {
    jsonString = JSON.stringify(Object.fromEntries(value));
  } else if ((value as Buffer).buffer instanceof ArrayBuffer) {
    jsonString = new TextDecoder().decode((value as Buffer).buffer);
  } else if (typeof value !== 'string') {
    jsonString = JSON.stringify(value);
  }

  try {
    return JSON.parse(jsonString);
  } catch (e) {
    /* Do Nothing. Unable to parse the param value */
  }

  return value;
};

export const convertSearchParamsToJSON = (url: string): Record<string, unknown> => {
  const result = {};

  if (!url || url === '?' || url.indexOf('?') === -1) {
    return result;
  }

  const paramsObject = Object.fromEntries(new URL(url).searchParams);

  Object.entries(paramsObject).forEach(([paramName, paramValue]) => {
    result[paramName] = jsonifyIfPossible(paramValue);
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
  isJsonResponse: boolean,
): Promise<CustomResponse> => {
  const customResponse = await interceptor(args);

  if (customResponse) {
    if (typeof customResponse === 'object' && isJsonResponse) {
      customResponse.body = JSON.stringify(customResponse);
    }

    if (args.status === 204) {
      customResponse.status = 200;
    }

    return {
      body: args.response,
      headers: args.responseHeaders,
      status: args.status,
      statusText: args.statusText,
      ...customResponse,
    };
  }

  return null;
};

export const isJsonResponse = (response: Response): boolean => {
  return response.headers.get('content-type')?.indexOf('application/json') !== -1;
};
