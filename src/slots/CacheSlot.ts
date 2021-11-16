import { AxiosResponse } from 'axios';
import clone from 'clone';
import { cloneResponse } from '../libs/cloneResponse';
import { FocaRequestConfig } from '../enhancer';
import { mergeSlotOptions } from '../libs/mergeSlotOptions';

export interface CacheSlotOptions {
  /**
   * 是否允许使用缓存。
   */
  enable?: boolean;
  /**
   * 缓存存活时间(ms)，默认：10 * 60 *1000（10分钟）。
   *
   * @see CacheSlot.defaultMaxAge
   */
  maxAge?: number;
  /**
   * 作为缓存的依赖，你可以过滤掉无关的属性，容易命中缓存。
   *
   * 允许直接更改formatConfig对象，不会影响请求结果。
   */
  format?: (formatConfig: CacheFormatConfig) => object | string;
}

type CacheMap = Partial<{
  [K: string]: {
    time: number;
    response: AxiosResponse;
  };
}>;

type FormatKeys = typeof CacheSlot['formatKeys'][number];

export type CacheFormatConfig = Required<Pick<FocaRequestConfig, FormatKeys>>;

export class CacheSlot {
  static defaultMaxAge = 10 * 60 * 1000;

  static formatKeys = [
    'baseURL',
    'url',
    'method',
    'params',
    'data',
    'headers',
  ] as const;

  protected readonly cacheMap: CacheMap = {};

  constructor(protected readonly options?: CacheSlotOptions) {}

  hit(
    config: FocaRequestConfig,
    newCache: (config: FocaRequestConfig) => Promise<AxiosResponse>,
  ): Promise<AxiosResponse> {
    const options = mergeSlotOptions(this.options, config.cache);

    if (options.enable === false) {
      return newCache(config);
    }

    const { maxAge = CacheSlot.defaultMaxAge, format } = options;
    const formatConfig = CacheSlot.getFormatConfig(config);
    const key = JSON.stringify(
      format ? format(clone(formatConfig!, false)) : formatConfig,
    );

    const cacheData = this.cacheMap[key];

    if (cacheData) {
      if (cacheData.time + maxAge >= Date.now()) {
        return Promise.resolve(cloneResponse(cacheData.response, config));
      }

      delete this.cacheMap[key];
    }

    return newCache(config).then((response) => {
      const next = cloneResponse(response, response.config);

      this.cacheMap[key] = {
        time: Date.now(),
        response: next,
      };

      return response;
    });
  }

  protected static getFormatConfig(
    config: FocaRequestConfig,
  ): CacheFormatConfig {
    return this.formatKeys.reduce((carry, key) => {
      carry[key] = config[key];
      return carry;
    }, <Pick<FocaRequestConfig, FormatKeys>>{}) as CacheFormatConfig;
  }
}
