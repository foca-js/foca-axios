import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
  type AxiosResponse,
  type Cancel,
  type Method,
} from 'axios';
import { mergeSlotOptions } from '../libs/merge-slot-options';

export interface RetryOptions {
  /**
   * 失败的请求是否允许重试，默认：`true`
   */
  enable?: boolean;
  /**
   * 最大重试次数，默认：`3`次
   * @see RetrySlot.defaultMaxTimes
   */
  maxTimes?: number;
  /**
   * 每次重试间隔，默认：`300`ms
   * @see setTimeout()
   * @see RetrySlot.defaultDelay
   */
  delay?: number;
  /**
   * 允许重试的请求方法，默认：`['get', 'head', 'put', 'patch', 'delete']`
   * @see RetrySlot.defaultAllowedMethods
   */
  allowedMethods?: `${Lowercase<Method>}`[];
  /**
   * 允许重试的http状态码区间，默认：`[[100, 199], 429, [500, 599]]`
   * @see RetrySlot.defaultAllowedHttpStatus
   */
  allowedHttpStatus?: (number | [number, number])[];
  /**
   * 允许使用重试的请求，执行该方法再次确认
   */
  validate?(config: AxiosRequestConfig): boolean;
  /**
   * 重试前更新令牌
   *
   * 当检测到401 unauthorized状态码，如果该函数返回true，
   * 则忽略 `allowedMethods` 和 `allowedHttpStatus` 的判断并继续重试。
   *
   * 注意：函数内的请求即使出错也不会进行重试
   *
   * ```typescript
   * axios.create({
   *   retry: {
   *     async resolveUnauthorized(config) {
   *        const result = await axios.post('/refresh/token', {...});
   *        config.headers.Authorization = `Bearer ${result.token}`;
   *        return true;
   *     }
   *   }
   * });
   * ```
   */
  resolveUnauthorized?: (
    config: InternalAxiosRequestConfig,
    err: AxiosError,
  ) => Promise<boolean>;
}

export class RetrySlot {
  static defaultAllowedMethods: NonNullable<RetryOptions['allowedMethods']> = [
    'get',
    'head',
    'put',
    'patch',
    'delete',
  ];

  static defaultAllowedHttpStatus: NonNullable<RetryOptions['allowedHttpStatus']> = [
    [100, 199],
    429,
    [500, 599],
  ];

  static defaultMaxTimes = 3;

  static defaultDelay = 300;

  private resolvingAuthorized = false;

  constructor(protected readonly options?: boolean | RetryOptions) {}

  async validate(
    err: AxiosError | Cancel,
    config: InternalAxiosRequestConfig,
    currentTimes: number,
  ): Promise<boolean> {
    const options = mergeSlotOptions(this.options, config.retry);
    const {
      delay = RetrySlot.defaultDelay,
      maxTimes = RetrySlot.defaultMaxTimes,
      allowedMethods = RetrySlot.defaultAllowedMethods,
      allowedHttpStatus = RetrySlot.defaultAllowedHttpStatus,
      resolveUnauthorized,
      validate,
    } = options;

    if (this.resolvingAuthorized) return false;

    const basicEnable =
      options.enable !== false && currentTimes <= maxTimes && !axios.isCancel(err);

    if (!basicEnable) return false;

    let enable = false;
    if (err.response && err.response.status === 401 && resolveUnauthorized) {
      try {
        this.resolvingAuthorized = true;
        enable = await resolveUnauthorized(config, err);
      } catch {
        enable = false;
      } finally {
        this.resolvingAuthorized = false;
      }
    }

    if (!enable) {
      enable =
        allowedMethods.includes(config.method!.toLowerCase() as `${Lowercase<Method>}`) &&
        (!err.response || this.isAllowedStatus(err.response, allowedHttpStatus));
    }

    if (validate) {
      enable = validate(config);
    }

    if (!enable) return false;

    return new Promise((resolve) => {
      setTimeout(resolve, delay, true);
    });
  }

  protected isAllowedStatus(
    response: AxiosResponse,
    allowedHttpStatus: NonNullable<RetryOptions['allowedHttpStatus']>,
  ) {
    const currentStatus = response.status;

    return allowedHttpStatus.some((range) => {
      return typeof range === 'number'
        ? range === currentStatus
        : currentStatus >= range[0] && currentStatus <= range[1];
    });
  }
}
