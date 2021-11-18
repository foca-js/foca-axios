import { AxiosResponse, Method } from 'axios';
import clone from 'clone';
import { cloneResponse } from '../libs/cloneResponse';
import { FocaRequestConfig } from '../enhancer';
import { mergeSlotOptions } from '../libs/mergeSlotOptions';
import { isForceEnable } from '../libs/isForceEnable';

export interface CacheOptions {
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
   * 允许缓存的请求方法，默认：['get']
   * @see CacheSlot.defaultAllowedMethods
   */
  allowedMethods?: `${Lowercase<Method>}`[];
  /**
   * 作为缓存的依赖，你可以过滤掉无关的属性，容易命中缓存。
   * 允许直接更改formatConfig对象，不会影响请求结果。
   */
  format?(formatConfig: CacheFormatConfig): object | string;
  /**
   * 对于过滤后初步允许缓存的请求，执行该方法再次确认。
   */
  validate?(config: FocaRequestConfig): boolean;
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

  static defaultAllowedMethods: NonNullable<CacheOptions['allowedMethods']> = [
    'get',
  ];

  protected readonly cacheMap: CacheMap = {};

  constructor(protected readonly options?: boolean | CacheOptions) {}

  hit(
    config: FocaRequestConfig,
    newCache: (config: FocaRequestConfig) => Promise<AxiosResponse>,
  ): Promise<AxiosResponse> {
    const options = mergeSlotOptions(this.options, config.cache);
    const { allowedMethods = CacheSlot.defaultAllowedMethods, validate } =
      options;
    const enable =
      options.enable !== false &&
      (isForceEnable(config.cache) ||
        allowedMethods.includes(
          config.method!.toLowerCase() as `${Lowercase<Method>}`,
        )) &&
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

  protected static getFormatConfig(
    config: FocaRequestConfig,
  ): CacheFormatConfig {
    return this.formatKeys.reduce((carry, key) => {
      carry[key] = config[key];
      return carry;
    }, <Pick<FocaRequestConfig, FormatKeys>>{}) as CacheFormatConfig;
  }
}
