import { NetworkInterceptor } from './types';

export interface InterceptRecord {
  urlPattern: RegExp;
  interceptor: NetworkInterceptor;
  overrideResponse: boolean;
}

const records: InterceptRecord[] = [];

export const addInterceptor = (urlPattern: RegExp, interceptor: NetworkInterceptor, overrideResponse = false): void => {
  records.unshift({ urlPattern, interceptor, overrideResponse });
};

export const getInterceptRecordForUrl = (url: string): InterceptRecord => {
  return records.find(({ urlPattern }) => urlPattern.test(url));
};

export const clearInterceptors = (): void => {
  records.length = 0;
};
