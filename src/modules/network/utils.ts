import { CustomResponse, NetworkInterceptor, NetworkInterceptorArgs } from './types';

export const getAbsoluteUrl = (url: string): string => {
  const dummyLink = document.createElement('a');
  dummyLink.href = url;
  return dummyLink.href;
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
