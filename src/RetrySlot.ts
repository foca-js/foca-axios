import axios, {
  AxiosAdapter,
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  Method,
} from 'axios';
import assign from 'object-assign';
import { FocaRequestConfig } from './enhancer';
import createError from 'axios/lib/core/createError';
import { PromiseCallback } from './collectPromiseCallback';

export interface RetrySlotOptions {
  /**
   * 是否支持重试，默认： true
   */
  enable?: boolean;
  /**
   * 重试次数，默认：3次
   */
  maxTimes?: number;
  /**
   * 每次重试间隔，默认：100 ms
   */
  delay?: number;
  /**
   * 允许重试的请求方法，默认：['get', 'head', 'put', 'patch', 'delete']
   */
  allowedMethods?: `${Lowercase<Method>}`[];
  /**
   * 允许重试的http状态码区间，默认：[[100, 199], 429, [500, 599]]
   */
  allowedHttpStatus?: (number | [number, number])[];
}

export class RetrySlot {
  protected static defaultAllowedMethods: NonNullable<
    RetrySlotOptions['allowedMethods']
  > = ['get', 'head', 'put', 'patch', 'delete'];

  protected static defaultAllowedHttpStatus: NonNullable<
    RetrySlotOptions['allowedHttpStatus']
  > = [[100, 199], 429, [500, 599]];

  protected static defaultMaxTimes = 3;

  protected static defaultDelay = 300;

  protected readonly originalAdapter: AxiosAdapter;

  constructor(
    axios: AxiosInstance,
    protected readonly options: RetrySlotOptions = { enable: false },
    protected readonly getHttpStatus?: (response: AxiosResponse) => number,
  ) {
    const originalAdapter = axios.defaults.adapter;
    if (!originalAdapter) {
      throw new Error('axios default adapter is not found.');
    }
    this.originalAdapter = originalAdapter;
  }

  hit(
    config: FocaRequestConfig,
    [onResolve, onReject]: PromiseCallback,
  ): Promise<any> {
    const options = assign({}, this.options, config.retry);
    const {
      delay = RetrySlot.defaultDelay,
      maxTimes = RetrySlot.defaultMaxTimes,
      allowedMethods = RetrySlot.defaultAllowedMethods,
    } = options;
    const enable =
      options.enable !== false &&
      // 强制允许时，不检测method
      ((config.retry && config.retry.enable === true) ||
        allowedMethods.includes(
          config.method!.toLowerCase() as `${Lowercase<Method>}`,
        ));

    const loop = (currentTimes: number): Promise<any> => {
      return this.originalAdapter(config)
        .then(onResolve, onReject)
        .then((response) => {
          const getHttpStatus = config.getHttpStatus || this.getHttpStatus;

          if (config.validateStatus && getHttpStatus) {
            const httpStatus = getHttpStatus(response);

            if (!config.validateStatus(httpStatus)) {
              return Promise.reject(
                createError(
                  'Request failed with status code ' + httpStatus,
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
            (err.response && !this.isAllowedStatus(err.response))
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

  protected isAllowedStatus(response: AxiosResponse) {
    const currentStatus = response.status;
    const httpStatuses =
      (response.config as FocaRequestConfig).retry?.allowedHttpStatus ||
      this.options.allowedHttpStatus ||
      RetrySlot.defaultAllowedHttpStatus;

    return httpStatuses.some((range) => {
      return typeof range === 'number'
        ? range === currentStatus
        : currentStatus >= range[0] && currentStatus <= range[1];
    });
  }
}
