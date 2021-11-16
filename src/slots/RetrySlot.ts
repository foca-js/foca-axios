import axios, { AxiosAdapter, AxiosError, AxiosResponse, Method } from 'axios';
import { FocaRequestConfig } from '../enhancer';
import createError from 'axios/lib/core/createError';
import { PromiseCallback } from '../libs/collectPromiseCallback';
import { mergeSlotOptions } from '../libs/mergeSlotOptions';

export interface RetrySlotOptions {
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
}

export class RetrySlot {
  static defaultAllowedMethods: NonNullable<
    RetrySlotOptions['allowedMethods']
  > = ['get', 'head', 'put', 'patch', 'delete'];

  static defaultAllowedHttpStatus: NonNullable<
    RetrySlotOptions['allowedHttpStatus']
  > = [[100, 199], 429, [500, 599]];

  static defaultMaxTimes = 3;

  static defaultDelay = 100;

  constructor(
    protected readonly options: RetrySlotOptions | undefined,
    protected readonly originalAdapter: AxiosAdapter,
    protected readonly getHttpStatus:
      | ((response: AxiosResponse) => number)
      | undefined,
  ) {
    if (!originalAdapter) {
      throw new Error('axios default adapter is not found.');
    }
  }

  hit(
    config: FocaRequestConfig,
    [onResolve, onReject]: PromiseCallback,
  ): Promise<any> {
    const options = mergeSlotOptions(this.options, config.retry);
    const {
      delay = RetrySlot.defaultDelay,
      maxTimes = RetrySlot.defaultMaxTimes,
      allowedMethods = RetrySlot.defaultAllowedMethods,
      allowedHttpStatus = RetrySlot.defaultAllowedHttpStatus,
    } = options;
    const enable =
      options.enable !== false &&
      allowedMethods.includes(
        config.method!.toLowerCase() as `${Lowercase<Method>}`,
      );

    const loop = (currentTimes: number): Promise<any> => {
      return this.originalAdapter(config)
        .then(onResolve, onReject)
        .then((response) => {
          const getHttpStatus = config.getHttpStatus || this.getHttpStatus;

          if (config.validateStatus && getHttpStatus) {
            const realHttpStatus = getHttpStatus(response);

            if (!config.validateStatus(realHttpStatus)) {
              return Promise.reject(
                createError(
                  'Request failed with status code ' + realHttpStatus,
                  response.config,
                  null,
                  response.request,
                  response,
                ),
              );
            }
          }

          return response;
        })
        .catch((err: AxiosError) => {
          if (
            !enable ||
            currentTimes >= maxTimes ||
            axios.isCancel(err) ||
            (err.response &&
              !this.isAllowedStatus(err.response, allowedHttpStatus))
          ) {
            return Promise.reject(err);
          }

          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(loop(currentTimes + 1));
            }, delay);
          });
        });
    };

    return loop(0);
  }

  protected isAllowedStatus(
    response: AxiosResponse,
    allowedHttpStatus: NonNullable<RetrySlotOptions['allowedHttpStatus']>,
  ) {
    const currentStatus = response.status;

    return allowedHttpStatus.some((range) => {
      return typeof range === 'number'
        ? range === currentStatus
        : currentStatus >= range[0] && currentStatus <= range[1];
    });
  }
}
