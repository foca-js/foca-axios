import { AxiosError, type AxiosResponse, type AxiosRequestConfig } from 'axios';
import type { TransformResponseHandler } from '../libs/preventTransform';

export class RequestSlot {
  constructor(
    protected readonly defaultAdapter: NonNullable<AxiosRequestConfig['adapter']>,
    protected readonly getHttpStatus?: (response: AxiosResponse) => number,
  ) {
    if (!defaultAdapter) {
      throw new Error('axios default adapter is not found.');
    }
  }

  hit(
    config: AxiosRequestConfig,
    [onResolve, onReject]: TransformResponseHandler,
    shouldLoop: (
      err: AxiosError,
      config: AxiosRequestConfig,
      currentTimes: number,
    ) => Promise<boolean>,
  ): Promise<any> {
    // FIXME: what if config includes custom adapter?
    const adapter = this.defaultAdapter;
    const loop = (currentTimes: number): Promise<any> => {
      return adapter(config)
        .then(onResolve, onReject)
        .then((response: AxiosResponse) => {
          const getHttpStatus = config.getHttpStatus || this.getHttpStatus;

          if (config.validateStatus && getHttpStatus) {
            const realHttpStatus = getHttpStatus(response);

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
          return shouldLoop(err, config, currentTimes + 1).then(
            (enable) => {
              return enable ? loop(currentTimes + 1) : Promise.reject(err);
            },
            () => Promise.reject(err),
          );
        });
    };

    return loop(0);
  }
}
