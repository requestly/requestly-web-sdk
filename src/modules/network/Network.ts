import './apis/xhr';
import './apis/fetch';
import { addInterceptor } from './interceptors';

export const Network = {
  intercept: addInterceptor,
};
