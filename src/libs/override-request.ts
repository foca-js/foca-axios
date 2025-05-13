import { Axios, AxiosRequestConfig, type AxiosInstance, type AxiosResponse } from 'axios';

export interface FocaAxiosPromise<T = any, D = any> extends Promise<T> {
  /**
   * 返回axios原始的response格式
   * @see AxiosResponse
   */
  toRaw: () => Promise<AxiosResponse<T, D>>;
}

export const overrideRequest = (instance: AxiosInstance) => {
  // 真实的上下文 context = new Axios()，但是未暴露出来，导致 instance.request 与 context.request 不是同一个。
  Object.keys(Axios.prototype).forEach((key) => {
    // @ts-expect-error
    if (typeof Axios.prototype[key] === 'function') {
      Object.defineProperty(instance, key, {
        get() {
          // @ts-expect-error
          return Axios.prototype[key].bind(instance);
        },
        enumerable: true,
      });
    }
  });

  instance.request = function overrideRequest(cfg?: AxiosRequestConfig<any>) {
    let shouldUnwrap: boolean = true;
    const config = cfg || {};
    const promise = Axios.prototype.request.call(instance, config).then((response) => {
      return shouldUnwrap ? (response as AxiosResponse).data : response;
    }) as FocaAxiosPromise;

    promise.toRaw = function toRawResponse() {
      shouldUnwrap = false;
      return promise;
    };

    return promise;
  };
};
