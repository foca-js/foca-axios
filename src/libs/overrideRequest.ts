import {
  Axios,
  AxiosRequestConfig,
  type AxiosInstance,
  type AxiosResponse,
} from 'axios';

export interface FocaAxiosPromise<T = any, D = any> extends Promise<T> {
  /**
   * 返回axios原始的response格式
   * @see AxiosResponse
   */
  toRaw: () => Promise<AxiosResponse<T, D>>;
}

export const overrideRequest = (instance: AxiosInstance) => {
  // 真实的context = new Axios()，但是未暴露出来，导致request方法重写无效。
  Object.keys(Axios.prototype).forEach((key) => {
    // @ts-expect-error
    instance[key] = Axios.prototype[key].bind(instance);
  });

  const originalRequest = instance.request;

  instance.request = function focaRequest(config?: AxiosRequestConfig) {
    let shouldUnwrap: boolean = true;

    const promise = originalRequest<any>(config).then((response) => {
      return shouldUnwrap ? (response as AxiosResponse).data : response;
    }) as FocaAxiosPromise;

    promise.toRaw = function toRawResponse() {
      shouldUnwrap = false;
      return promise;
    };

    return promise;
  };
};
