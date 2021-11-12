import { AxiosResponse } from 'axios';
import assign from 'object-assign';
import clone from 'clone';
import { FocaRequestConfig } from './enhancer';

export interface CacheSlotOptions {
  /**
   * 是否允许使用缓存，全局设置时默认：false，请求时默认：true
   */
  enable?: boolean;
  /**
   * 缓存存活时间(ms)，默认：10 * 60 *1000（10分钟）
   */
  maxAge?: number;
  /**
   * 作为缓存的依赖，你可以过滤掉无关的属性，容易命中缓存。
   *
   * 允许直接更改formatConfig对象，不会影响请求结果。
   */
  formatKey?: (formatConfig: CacheFormatConfig) => object | string | void;
}

interface CacheData {
  time: number;
  response: AxiosResponse;
}

export class CacheSlot {
  protected static defaultMaxAge = 10 * 60 * 1000;

  protected readonly cache: Partial<{
    [K: string]: CacheData;
  }> = {};

  constructor(protected readonly options: CacheSlotOptions = {}) {}

  hit(
    config: FocaRequestConfig,
    newCache: () => Promise<AxiosResponse>,
  ): Promise<AxiosResponse> {
    const options = assign({}, this.options, config.cache);
    const { maxAge = CacheSlot.defaultMaxAge } = options;

    const enable = config.cache ? options.enable !== false : false;
    const formatConfig = enable ? getFormatConfig(config) : null;
    const key = enable
      ? JSON.stringify(
          options.formatKey
            ? options.formatKey(clone(formatConfig!))
            : formatConfig,
        )
      : '';

    if (enable) {
      const cacheData = this.cache[key];

      if (cacheData) {
        if (cacheData.time + maxAge >= Date.now()) {
          const next = clone(cacheData.response, false);
          next.config = config;

          return Promise.resolve(next);
        }

        this.cache[key] = void 0;
      }
    }

    return newCache().then((response) => {
      if (enable) {
        const config = response.config;
        // @ts-expect-error
        response.config = null;
        const next = clone(response, false);
        response.config = config;

        this.cache[key] = {
          time: Date.now(),
          response: next,
        };
      }

      return response;
    });
  }
}

const formatKeys = [
  'baseURL',
  'url',
  'method',
  'params',
  'data',
  'headers',
] as const;

type FormatKeys = typeof formatKeys[number];

export type CacheFormatConfig = Required<Pick<FocaRequestConfig, FormatKeys>>;

const getFormatConfig = (config: FocaRequestConfig): CacheFormatConfig => {
  return formatKeys.reduce((carry, key) => {
    carry[key] = config[key];
    return carry;
  }, <Pick<FocaRequestConfig, FormatKeys>>{}) as CacheFormatConfig;
};
