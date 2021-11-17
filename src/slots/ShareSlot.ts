import axios, { AxiosError, AxiosResponse, Method } from 'axios';
import createError from 'axios/lib/core/createError';
import clone from 'clone';
import { cloneResponse } from '../libs/cloneResponse';
import { FocaRequestConfig } from '../enhancer';
import { mergeSlotOptions } from '../libs/mergeSlotOptions';

export interface ShareSlotOptions {
  /**
   * 是否允许共享，默认：true
   */
  enable?: boolean;
  /**
   * 允许共享的方法，默认：['get', 'head', 'put', 'patch', 'delete']
   * @see ShareSlot.defaultAllowedMethods
   */
  allowedMethods?: `${Lowercase<Method>}`[];
  /**
   * 作为共享的依赖，你可以过滤掉无关的属性，容易命中共享中的请求。
   *
   * 允许直接更改formatConfig对象，不会影响请求结果。
   */
  format?: (formatConfig: ShareFormatConfig) => object | string;
}

type FormatKeys = typeof ShareSlot['formatKeys'][number];

export type ShareFormatConfig = Required<Pick<FocaRequestConfig, FormatKeys>>;

export class ShareSlot {
  static formatKeys = [
    'baseURL',
    'url',
    'method',
    'params',
    'data',
    'headers',
    'timeout',
    'maxContentLength',
    'maxBodyLength',
    'xsrfCookieName',
    'xsrfHeaderName',
  ] as const;

  static defaultAllowedMethods: NonNullable<
    ShareSlotOptions['allowedMethods']
  > = ['get', 'head', 'put', 'patch', 'delete'];

  protected readonly threads: Partial<{
    [K: string]: Promise<AxiosResponse>;
  }> = {};

  constructor(protected readonly options?: boolean | ShareSlotOptions) {}

  hit(
    config: FocaRequestConfig,
    newThread: (config: FocaRequestConfig) => Promise<AxiosResponse>,
  ): Promise<AxiosResponse> {
    const options = mergeSlotOptions(this.options, config.share);
    const { format, allowedMethods = ShareSlot.defaultAllowedMethods } =
      options;

    const enable =
      options.enable !== false &&
      allowedMethods.includes(
        config.method!.toLowerCase() as `${Lowercase<Method>}`,
      );

    if (!enable) {
      return newThread(config);
    }

    const formatConfig = ShareSlot.getFormatConfig(config);
    const key = JSON.stringify(
      format ? format(clone(formatConfig, false)) : formatConfig,
    );

    const thread = this.threads[key];

    if (thread) {
      return thread
        .then((response) => cloneResponse(response, config))
        .catch((err: AxiosError) => {
          return Promise.reject(
            axios.isCancel(err)
              ? err
              : createError(
                  err.message,
                  config,
                  err.code,
                  err.request,
                  err.response ? cloneResponse(err.response, config) : void 0,
                ),
          );
        });
    }

    const promise = (this.threads[key] = newThread(config));
    const clearThread = () => {
      delete this.threads[key];
    };

    /**
     * 请求结束后需清理共享池
     *
     * then/catch 在 chrome@32 引入，除了IE之外基本都支持了。
     * finally 在 chrome@63 引入，支持得比较晚，不建议使用。
     */
    promise.then(clearThread, clearThread);

    return promise;
  }

  protected static getFormatConfig(
    config: FocaRequestConfig,
  ): ShareFormatConfig {
    return this.formatKeys.reduce((carry, key) => {
      carry[key] = config[key];
      return carry;
    }, <Pick<FocaRequestConfig, FormatKeys>>{}) as ShareFormatConfig;
  }
}
