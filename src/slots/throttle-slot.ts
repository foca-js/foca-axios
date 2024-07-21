import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
  type AxiosResponse,
  type Cancel,
  type Method,
} from 'axios';
import clone from 'clone';
import { cloneResponse } from '../libs/clone-response';
import { mergeSlotOptions } from '../libs/merge-slot-options';

export interface ThrottleOptions {
  /**
   * 是否允许共享，默认：`true`
   */
  enable?: boolean;
  /**
   * 允许共享的方法，默认：`['get', 'head', 'put', 'patch', 'delete']`
   * @see ThrottleSlot.defaultAllowedMethods
   */
  allowedMethods?: `${Lowercase<Method>}`[];
  /**
   * 作为共享的依赖，你可以过滤掉无关的属性，容易命中共享中的请求。
   *
   * 允许直接更改formatConfig对象，不会影响请求结果。
   */
  format?: (formatConfig: ThrottleFormatConfig) => object | string;
  /**
   * 对于过滤后初步允许共享的请求，执行该方法再次确认。
   */
  validate?(config: AxiosRequestConfig): boolean;
}

type FormatKeys = (typeof ThrottleSlot)['formatKeys'][number];

export type ThrottleFormatConfig = Required<Pick<AxiosRequestConfig, FormatKeys>>;

export class ThrottleSlot {
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

  static defaultAllowedMethods: NonNullable<ThrottleOptions['allowedMethods']> = [
    'get',
    'head',
    'put',
    'patch',
    'delete',
  ];

  protected readonly threads: Partial<{
    [K: string]: Promise<AxiosResponse>;
  }> = {};

  constructor(protected readonly options?: boolean | ThrottleOptions) {}

  hit(
    config: InternalAxiosRequestConfig,
    newThread: (config: InternalAxiosRequestConfig) => Promise<AxiosResponse>,
  ): Promise<AxiosResponse> {
    const options = mergeSlotOptions(this.options, config.throttle);
    const {
      allowedMethods = ThrottleSlot.defaultAllowedMethods,
      format,
      validate,
    } = options;

    const enable =
      options.enable !== false &&
      allowedMethods.includes(config.method!.toLowerCase() as `${Lowercase<Method>}`) &&
      (!validate || validate(config));

    if (!enable) {
      return newThread(config);
    }

    const formatConfig = ThrottleSlot.getFormatConfig(config);
    const key = JSON.stringify(
      format ? format(clone(formatConfig, false)) : formatConfig,
    );

    const thread = this.threads[key];

    if (thread) {
      return thread
        .then((response) => cloneResponse(response, config))
        .catch((err: AxiosError | Cancel) => {
          return Promise.reject(
            axios.isCancel(err)
              ? err
              : new AxiosError(
                  err.message,
                  err.code,
                  config,
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

  protected static getFormatConfig(config: AxiosRequestConfig): ThrottleFormatConfig {
    return this.formatKeys.reduce(
      (carry, key) => {
        carry[key] = config[key];
        return carry;
      },
      <Pick<AxiosRequestConfig, FormatKeys>>{},
    ) as ThrottleFormatConfig;
  }
}
