import './apis/xhr';
import './apis/fetch';
import { addInterceptor, clearInterceptors } from './interceptors';

export const Network = {
  intercept: addInterceptor,
  clearInterceptors,
};
