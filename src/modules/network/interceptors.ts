import { NetworkInterceptor } from './types';
import { getAbsoluteUrl } from './utils';

interface InterceptRecord {
  urlPattern: RegExp;
  interceptor: NetworkInterceptor;
}

const records: InterceptRecord[] = [];

export const addInterceptor = (urlPattern: RegExp, interceptor: NetworkInterceptor): void => {
  records.unshift({ urlPattern, interceptor });
};

export const getInterceptorForUrl = (url: string): NetworkInterceptor => {
  const record = records.find(({ urlPattern }) => urlPattern.test(getAbsoluteUrl(url)));
  return record?.interceptor;
};
