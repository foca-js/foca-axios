import { Axios, AxiosInstance, AxiosResponse } from 'axios';
import { FocaRequestConfig } from './enhancer';

export interface FocaAxioaPromise<T = any, D = any> extends Promise<T> {
  /**
   * 返回axios原始的response格式
   *
   * @see AxiosResponse
   */
  toRawResponse: () => Promise<AxiosResponse<T, D>>;
}

export const overrideRequest = (instance: AxiosInstance) => {
  // 真实的context未暴露出来，导致request方法重写无效。
  Object.keys(Axios.prototype).forEach((key) => {
    // @ts-expect-error
    instance[key] = Axios.prototype[key].bind(instance);
  });

  const originalRequest = instance.request;

  instance.request = function focaRequest(config: FocaRequestConfig) {
    let shouldUnwrap = true;

    const promise = originalRequest(config).then((response) => {
      return shouldUnwrap ? response.data : response;
    }) as FocaAxioaPromise;

    promise.toRawResponse = function () {
      shouldUnwrap = false;
      return this;
    };

    return promise;
  };
};
