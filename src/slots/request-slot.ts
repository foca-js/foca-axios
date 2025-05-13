import {
  AxiosError,
  type AxiosResponse,
  AxiosAdapter,
  InternalAxiosRequestConfig,
} from 'axios';
import type { TransformResponseHandler } from '../libs/prevent-transform';

export class RequestSlot {
  constructor(
    protected readonly defaultAdapter: AxiosAdapter,
    protected readonly getHttpStatus?: (response: AxiosResponse) => number,
  ) {
    if (!defaultAdapter) {
      throw new Error('axios default adapter is not found.');
    }
  }

  hit(
    config: InternalAxiosRequestConfig,
    [onResolve, onReject]: TransformResponseHandler,
    shouldRetry: (
      err: AxiosError,
      config: InternalAxiosRequestConfig,
      currentTimes: number,
    ) => Promise<boolean>,
  ): Promise<any> {
    // FIXME: what if config includes custom adapter?
    const adapter = this.defaultAdapter;
    const loop = (currentAttempt: number): Promise<any> => {
      return adapter(config)
        .then(onResolve, onReject)
        .then((response: AxiosResponse) => {
          const getHttpStatus = config.getHttpStatus || this.getHttpStatus;

          if (config.validateStatus && getHttpStatus) {
            const realHttpStatus = getHttpStatus(response);

            response.status = realHttpStatus;

            if (!config.validateStatus(realHttpStatus)) {
              return Promise.reject(
                new AxiosError(
                  'Request failed with status code ' + realHttpStatus,
                  void 0,
                  response.config,
                  response.request,
                  response,
                ),
              );
            }
          }

          return response;
        })
        .catch((err: AxiosError) => {
          return shouldRetry(err, config, currentAttempt + 1).then(
            (enable) => {
              return enable ? loop(currentAttempt + 1) : Promise.reject(err);
            },
            () => Promise.reject(err),
          );
        });
    };

    return loop(0);
  }
}
