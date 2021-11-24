import { Axios, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { CacheSlot, CacheOptions } from './slots/CacheSlot';
import {
  preventTransform,
  TransformResponseHandler,
} from './libs/preventTransform';
import { overrideRequest, FocaAxiosPromise } from './libs/overrideRequest';
import { RetryOptions, RetrySlot } from './slots/RetrySlot';
import { ThrottleSlot, ThrottleOptions } from './slots/ThrottleSlot';
import { RequestSlot } from './slots/RequestSlot';

export interface EnhanceOptions {
  /**
   * 相同请求共享。
   */
  throttle?: boolean | ThrottleOptions;
  /**
   * 失败后的重试。
   */
  retry?: boolean | RetryOptions;
  /**
   * 缓存响应成功的数据。建议默认关闭，仅在不需要增删改的请求上做缓存。
   */
  cache?: boolean | CacheOptions;
  /**
   * 一些接口偏向于把错误码放到响应数据中，httpStatus总是设置成200。
   * 你需要实现该方法以返回正确的status，这样axios才会判定为是异常的请求。
   *
   * 另一方面，只有异常的请求才会触发重试，所以需要重试的非标准接口必须实现该方法。
   *
   * @see Axios.defaults.validateStatus
   */
  getHttpStatus?: (response: AxiosResponse) => number;
}

export interface FocaRequestConfig<D = any>
  extends AxiosRequestConfig<D>,
    EnhanceOptions {}

export interface Enhancer extends Axios {
  request: <T = unknown, D = any>(
    config?: FocaRequestConfig<D>,
  ) => FocaAxiosPromise<T, D>;

  get: <T = unknown, D = any>(
    url: string,
    config?: FocaRequestConfig<D>,
  ) => FocaAxiosPromise<T, D>;
  delete: <T = unknown, D = any>(
    url: string,
    config?: FocaRequestConfig<D>,
  ) => FocaAxiosPromise<T, D>;
  head: <T = unknown, D = any>(
    url: string,
    config?: FocaRequestConfig<D>,
  ) => FocaAxiosPromise<T, D>;
  options: <T = unknown, D = any>(
    url: string,
    config?: FocaRequestConfig<D>,
  ) => FocaAxiosPromise<T, D>;

  post: <T = unknown, D = any>(
    url: string,
    data?: D,
    config?: FocaRequestConfig<D>,
  ) => FocaAxiosPromise<T, D>;
  put: <T = unknown, D = any>(
    url: string,
    data?: D,
    config?: FocaRequestConfig<D>,
  ) => FocaAxiosPromise<T, D>;
  patch: <T = unknown, D = any>(
    url: string,
    data?: D,
    config?: FocaRequestConfig<D>,
  ) => FocaAxiosPromise<T, D>;
}

/**
 * axios增强适配器
 * ```typescript
 * import axios from 'axios';
 * import { enhance } from 'foca-axios';
 *
 * const instance = axios.create(...);
 * export const http = enhance(instance);
 * http === instance // true
 * ```
 * 增强后的实例与传入的实例是同一个，只不过类型提示变了。
 */
export const enhance = (
  instance: AxiosInstance,
  options: EnhanceOptions = {},
): Enhancer => {
  overrideRequest(instance);

  const cache = new CacheSlot(options.cache);
  const throttle = new ThrottleSlot(options.throttle);
  const request = new RequestSlot(
    instance.defaults.adapter!,
    options.getHttpStatus,
  );
  const retry = new RetrySlot(options.retry);
  const validateRetry = retry.validate.bind(retry);

  instance.defaults.adapter = function focaAdapter(config: FocaRequestConfig) {
    const transformHandler: TransformResponseHandler = [];

    const promise = Promise.resolve().then(() => {
      return cache.hit(config, () => {
        return throttle.hit(config, () => {
          return request.hit(config, transformHandler, validateRetry);
        });
      });
    });

    return preventTransform(promise, transformHandler);
  };

  // @ts-expect-error
  return instance;
};
