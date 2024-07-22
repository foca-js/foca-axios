import {
  default as originAxios,
  AxiosInstance,
  CreateAxiosDefaults,
  getAdapter,
  AxiosAdapter,
} from 'axios';
import { CacheSlot, CacheOptions, CacheFormatConfig } from './slots/cache-slot';
import { preventTransform, TransformResponseHandler } from './libs/prevent-transform';
import { overrideRequest, FocaAxiosPromise } from './libs/override-request';
import { RetryOptions, RetrySlot } from './slots/retry-slot';
import { ThrottleSlot, ThrottleOptions } from './slots/throttle-slot';
import { RequestSlot } from './slots/request-slot';

declare module 'axios' {
  export interface AxiosRequestConfig<D = any> {
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
    getHttpStatus?: (response: AxiosResponse<any, D>) => number;
  }

  export interface AxiosInstance extends Axios {
    request: <T = unknown, D = any>(
      config?: AxiosRequestConfig<D>,
    ) => FocaAxiosPromise<T, D>;

    get: <T = unknown, D = any>(
      url: string,
      config?: AxiosRequestConfig<D>,
    ) => FocaAxiosPromise<T, D>;

    delete: <T = unknown, D = any>(
      url: string,
      config?: AxiosRequestConfig<D>,
    ) => FocaAxiosPromise<T, D>;

    head: <T = unknown, D = any>(
      url: string,
      config?: AxiosRequestConfig<D>,
    ) => FocaAxiosPromise<T, D>;

    options: <T = unknown, D = any>(
      url: string,
      config?: AxiosRequestConfig<D>,
    ) => FocaAxiosPromise<T, D>;

    post: <T = unknown, D = any>(
      url: string,
      data?: D,
      config?: AxiosRequestConfig<D>,
    ) => FocaAxiosPromise<T, D>;

    put: <T = unknown, D = any>(
      url: string,
      data?: D,
      config?: AxiosRequestConfig<D>,
    ) => FocaAxiosPromise<T, D>;

    patch: <T = unknown, D = any>(
      url: string,
      data?: D,
      config?: AxiosRequestConfig<D>,
    ) => FocaAxiosPromise<T, D>;
    /**
     * 清除全部请求缓存。
     * 如果只需要清除特定的缓存，可以传入过滤函数
     */
    clearCache: (filter?: (config: CacheFormatConfig) => boolean) => void;
  }

  export interface AxiosAdapter {
    __prev_adapter__: any;
  }
}

/**
 * axios增强适配器
 */
export const enhance = <T extends AxiosInstance>(
  instance: T,
  options: CreateAxiosDefaults = {},
): T => {
  overrideRequest(instance);

  let defaultAdapter = instance.defaults.adapter;
  if (typeof defaultAdapter === 'function') {
    defaultAdapter = defaultAdapter.__prev_adapter__ || defaultAdapter;
  }

  const cache = new CacheSlot(options.cache);
  const throttle = new ThrottleSlot(options.throttle);
  const request = new RequestSlot(getAdapter(defaultAdapter), options.getHttpStatus);
  const retry = new RetrySlot(options.retry);
  const validateRetry = retry.validate.bind(retry);

  const focaAdapter: AxiosAdapter = function focaAdapter(config) {
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
  focaAdapter.__prev_adapter__ = defaultAdapter;
  instance.defaults.adapter = focaAdapter;
  instance.clearCache = cache.clear.bind(cache);

  return instance;
};

export const axios = enhance(originAxios, originAxios.defaults);

const axiosCreate = axios.create;
axios.create = (config) => enhance(axiosCreate(config));
