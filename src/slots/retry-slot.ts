import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
  type AxiosResponse,
  type Cancel,
  type Method,
} from 'axios';
import { mergeSlotOptions } from '../libs/merge-slot-options';

export type RetryOptions = {
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
   * 每次重试间隔。如果碰到报文`Retry-After`，则需到达报文指定的时间后才能重试。默认：`500`ms
   * @see setTimeout()
   * @see RetrySlot.defaultGap
   */
  gap?: number;
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
} & (
  | { resolveUnauthorized?: undefined; onAuthorized?: undefined }
  | {
      /**
       * 重试前更新令牌
       *
       * 当检测到401 unauthorized状态码，如果该函数返回true，
       * 则忽略 **allowedMethods** 和 **allowedHttpStatus** 的判断并继续重试。
       *
       * 注意：函数内的请求如果使用到GET等请求，建议在单个请求种手动关闭retry功能，以免出现死循环
       *
       * ```typescript
       * axios.create({
       *   retry: {
       *     async resolveUnauthorized() {
       *        const result = await axios.post('/refresh/token', {...});
       *        // 存储令牌，即将在 onAuthorized 中用到
       *        saveToken(result.token);
       *        // 代表已经解决授权问题，允许继续重试
       *        return true;
       *     }
       *   }
       * });
       * ```
       */
      resolveUnauthorized: (err: AxiosError) => Promise<boolean>;
      /**
       * 修改即将重试的config，比如替换令牌
       *
       * ```typescript
       * axios.create({
       *   retry: {
       *     onAuthorized(config) {
       *       const token = getToken();
       *       config.headers.Authorization = `Bearer ${token}`;
       *     }
       *   }
       * })
       * ```
       */
      onAuthorized: (config: InternalAxiosRequestConfig) => void | Promise<void>;
    }
);

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
  static defaultGap = 300;

  private readonly resolvingAuthorized: {
    refreshTime: number;
    handler: Promise<boolean> | null;
  } = {
    refreshTime: 0,
    handler: null,
  };

  constructor(protected readonly options?: boolean | RetryOptions) {}

  async validate(
    err: AxiosError | Cancel,
    config: InternalAxiosRequestConfig,
    currentTimes: number,
  ): Promise<boolean> {
    const options = mergeSlotOptions(this.options, config.retry);
    const {
      gap = RetrySlot.defaultGap,
      maxTimes = RetrySlot.defaultMaxTimes,
      allowedMethods = RetrySlot.defaultAllowedMethods,
      allowedHttpStatus = RetrySlot.defaultAllowedHttpStatus,
      resolveUnauthorized,
      onAuthorized,
      validate,
    } = options;

    const basicEnable =
      options.enable !== false && currentTimes <= maxTimes && !axios.isCancel(err);
    if (!basicEnable) return false;

    let enable = false;

    // 刷新令牌之类的操作只能执行一次，如果每个接口都去刷新，则会导致令牌覆盖问题
    if (err.response && err.response.status === 401 && resolveUnauthorized) {
      if (this.resolvingAuthorized.handler) {
        try {
          enable = await this.resolvingAuthorized.handler;
          await onAuthorized(config);
        } catch {
          enable = false;
        }
      } else if (this.resolvingAuthorized.refreshTime > config.timestamp) {
        await onAuthorized(config);
      } else {
        try {
          this.resolvingAuthorized.handler = resolveUnauthorized(err);
          enable = await this.resolvingAuthorized.handler;
          this.resolvingAuthorized.refreshTime = Date.now();
          await onAuthorized(config);
        } catch (e) {
          console.error(e);
          enable = false;
        } finally {
          this.resolvingAuthorized.handler = null;
        }
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

    const durationMS = err.response ? this.getRetryAfter(err.response.headers, gap) : gap;

    return new Promise((resolve) => {
      setTimeout(resolve, durationMS, true);
    });
  }

  protected getRetryAfter(headers: Record<string, any>, min: number) {
    const retryAfter = headers['Retry-After'] || headers['retry-after'];
    if (!retryAfter) return 0;
    if (Number.isFinite(Number(retryAfter))) {
      return Math.max(min, Number(retryAfter) * 1000);
    }
    const timestamp = new Date(retryAfter).getTime();
    if (Number.isInteger(timestamp)) {
      return Math.max(min, timestamp - Date.now());
    }
    return 0;
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
