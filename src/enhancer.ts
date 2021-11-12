import { Axios, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { CacheSlot, CacheSlotOptions } from './CacheSlot';
import {
  collectPromiseCallback,
  PromiseCallback,
} from './collectPromiseCallback';
import { overrideRequest, FocaAxioaPromise } from './overrideRequest';
import { RetrySlotOptions, RetrySlot } from './RetrySlot';
import { ShareSlot, ShareSlotOptions } from './ShareSlot';

export interface AdapterOptions {
  /**
   * 相同请求共享句柄。
   */
  share?: ShareSlotOptions;
  /**
   * 失败后的重试。
   */
  retry?: RetrySlotOptions;
  /**
   * 响应成功的缓存，默认不开启。此处只是设置全局参数。
   */
  cache?: Omit<CacheSlotOptions, 'enable'>;
  /**
   * 一些接口偏向于把错误码放到响应数据中，httpStatus总是设置成200。
   *
   * 这种情况下，你需要实现该回调函数返回正确的status。
   */
  getHttpStatus?: (response: AxiosResponse) => number;
}

export interface FocaRequestConfig<D = any>
  extends AxiosRequestConfig<D>,
    AdapterOptions {
  /**
   * 响应成功的缓存。
   */
  cache?: CacheSlotOptions;
}

export interface Enhancer extends Axios {
  request: <T = any, D = any>(
    config?: FocaRequestConfig<D>,
  ) => FocaAxioaPromise<T, D>;

  get: <T = any, D = any>(
    url: string,
    config?: FocaRequestConfig<D>,
  ) => FocaAxioaPromise<T, D>;
  delete: <T = any, D = any>(
    url: string,
    config?: FocaRequestConfig<D>,
  ) => FocaAxioaPromise<T, D>;
  head: <T = any, D = any>(
    url: string,
    config?: FocaRequestConfig<D>,
  ) => FocaAxioaPromise<T, D>;
  options: <T = any, D = any>(
    url: string,
    config?: FocaRequestConfig<D>,
  ) => FocaAxioaPromise<T, D>;

  post: <T = any, D = any>(
    url: string,
    data?: D,
    config?: FocaRequestConfig<D>,
  ) => FocaAxioaPromise<T, D>;
  put: <T = any, D = any>(
    url: string,
    data?: D,
    config?: FocaRequestConfig<D>,
  ) => FocaAxioaPromise<T, D>;
  patch: <T = any, D = any>(
    url: string,
    data?: D,
    config?: FocaRequestConfig<D>,
  ) => FocaAxioaPromise<T, D>;
}

export const enhanceAxios = (
  instance: AxiosInstance,
  options: AdapterOptions = {},
): Enhancer => {
  overrideRequest(instance);

  const retry = new RetrySlot(instance, options.retry, options.getHttpStatus);
  const cache = new CacheSlot(options.cache);
  const share = new ShareSlot(options.share);

  instance.defaults.adapter = function focaAdapter(config: FocaRequestConfig) {
    const callback: PromiseCallback = [];

    const promise = cache.hit(config, () => {
      return share.hit(config, () => {
        return Promise.resolve().then(() => {
          return retry.hit(config, callback);
        });
      });
    });

    collectPromiseCallback(promise, callback);

    return promise;
  };

  // @ts-expect-error
  return instance;
};
