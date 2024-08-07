import type {
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
  Method,
} from 'axios';
import clone from 'clone';
import { cloneResponse } from '../libs/clone-response';
import { mergeSlotOptions } from '../libs/merge-slot-options';

export interface CacheOptions {
  /**
   * 是否允许使用缓存。默认：`false`
   */
  enable?: boolean;
  /**
   * 缓存存活时间(ms)，默认：`10 * 60 *1000`（10分钟）。
   *
   * @see CacheSlot.defaultMaxAge
   */
  maxAge?: number;
  /**
   * 允许缓存的请求方法，默认：`['get']`
   * @see CacheSlot.defaultAllowedMethods
   */
  allowedMethods?: `${Lowercase<Method>}`[];
  /**
   * 作为缓存的依赖，你可以过滤掉无关的属性，容易命中缓存。
   * 允许直接更改formatConfig对象，不会影响请求结果。
   */
  format?(formatConfig: CacheFormatConfig): object | string;
  /**
   * 允许使用缓存的请求，执行该方法再次确认。
   */
  validate?(config: AxiosRequestConfig): boolean;
}

type CacheMap = Partial<{
  [K: string]: {
    time: number;
    response: AxiosResponse;
  };
}>;

type FormatKeys = (typeof CacheSlot)['formatKeys'][number];

export type CacheFormatConfig = Required<Pick<AxiosRequestConfig, FormatKeys>>;

export class CacheSlot {
  static defaultMaxAge = 10 * 60 * 1000;

  static formatKeys = ['baseURL', 'url', 'method', 'params', 'data', 'headers'] as const;

  static defaultAllowedMethods: NonNullable<CacheOptions['allowedMethods']> = ['get'];

  protected cacheMap: CacheMap = {};

  constructor(protected readonly options: boolean | CacheOptions = false) {}

  hit(
    config: InternalAxiosRequestConfig,
    newCache: (config: InternalAxiosRequestConfig) => Promise<AxiosResponse>,
  ): Promise<AxiosResponse> {
    const options = mergeSlotOptions(this.options, config.cache);
    const { allowedMethods = CacheSlot.defaultAllowedMethods, validate } = options;
    const enable =
      options.enable !== false &&
      allowedMethods.includes(config.method!.toLowerCase() as `${Lowercase<Method>}`) &&
      (!validate || validate(config));

    if (!enable) {
      return newCache(config);
    }

    const { maxAge = CacheSlot.defaultMaxAge, format } = options;
    const formatConfig = CacheSlot.getFormatConfig(config);
    const key = JSON.stringify(
      format ? format(clone(formatConfig, false)) : formatConfig,
    );

    const cacheData = this.cacheMap[key];

    if (cacheData) {
      if (cacheData.time + maxAge >= Date.now()) {
        return Promise.resolve(cloneResponse(cacheData.response, config));
      }

      delete this.cacheMap[key];
    }

    return newCache(config).then((response) => {
      this.cacheMap[key] = {
        time: Date.now(),
        response: cloneResponse(response, response.config),
      };

      return response;
    });
  }

  clear(filter?: (config: CacheFormatConfig) => boolean) {
    if (!filter) {
      this.cacheMap = {};
      return;
    }

    const keys = Object.keys(this.cacheMap);

    for (let i = keys.length, key: string; i-- > 0; ) {
      key = keys[i]!;
      if (filter(JSON.parse(key))) {
        delete this.cacheMap[key];
      }
    }
  }

  protected static getFormatConfig(config: AxiosRequestConfig): CacheFormatConfig {
    return this.formatKeys.reduce(
      (carry, key) => {
        carry[key] = config[key];
        return carry;
      },
      <Pick<AxiosRequestConfig, FormatKeys>>{},
    ) as CacheFormatConfig;
  }
}
