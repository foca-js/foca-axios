import axios, {
  AxiosError,
  type AxiosResponse,
  type Cancel,
  type Method,
} from 'axios';
import type { FocaRequestConfig } from '../enhancer';
import { isForceEnable } from '../libs/isForceEnable';
import { mergeSlotOptions } from '../libs/mergeSlotOptions';

export interface RetryOptions {
  /**
   * 失败的请求是否允许重试，默认：true
   */
  enable?: boolean;
  /**
   * 最大重试次数，默认：3次
   * @see RetrySlot.defaultMaxTimes
   */
  maxTimes?: number;
  /**
   * 每次重试间隔，默认：100ms
   * @see setTimeout()
   * @see RetrySlot.defaultDelay
   */
  delay?: number;
  /**
   * 允许重试的请求方法，默认：['get', 'head', 'put', 'patch', 'delete']
   * @see RetrySlot.defaultAllowedMethods
   */
  allowedMethods?: `${Lowercase<Method>}`[];
  /**
   * 允许重试的http状态码区间，默认：[[100, 199], 429, [500, 599]]
   * @see RetrySlot.defaultAllowedHttpStatus
   */
  allowedHttpStatus?: (number | [number, number])[];
  /**
   * 对于过滤后初步允许重试的请求，执行该方法再次确认。
   */
  validate?(config: FocaRequestConfig): boolean;
}

export class RetrySlot {
  static defaultAllowedMethods: NonNullable<RetryOptions['allowedMethods']> = [
    'get',
    'head',
    'put',
    'patch',
    'delete',
  ];

  static defaultAllowedHttpStatus: NonNullable<
    RetryOptions['allowedHttpStatus']
  > = [[100, 199], 429, [500, 599]];

  static defaultMaxTimes = 3;

  static defaultDelay = 100;

  constructor(protected readonly options?: boolean | RetryOptions) {}

  validate(
    err: AxiosError | Cancel,
    config: FocaRequestConfig,
    currentTimes: number,
  ): Promise<boolean> {
    const options = mergeSlotOptions(this.options, config.retry);
    const {
      delay = RetrySlot.defaultDelay,
      maxTimes = RetrySlot.defaultMaxTimes,
      allowedMethods = RetrySlot.defaultAllowedMethods,
      allowedHttpStatus = RetrySlot.defaultAllowedHttpStatus,
      validate,
    } = options;

    const enable =
      options.enable !== false &&
      currentTimes <= maxTimes &&
      !axios.isCancel(err) &&
      (isForceEnable(config.retry) ||
        allowedMethods.includes(
          config.method!.toLowerCase() as `${Lowercase<Method>}`,
        )) &&
      (!err.response ||
        this.isAllowedStatus(err.response, allowedHttpStatus)) &&
      (!validate || validate(config));

    return new Promise((resolve) => {
      if (enable) {
        setTimeout(() => {
          resolve(true);
        }, delay);
      } else {
        resolve(false);
      }
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
