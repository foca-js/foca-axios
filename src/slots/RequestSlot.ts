import axios from 'axios';
import type { AxiosError, AxiosAdapter, AxiosResponse } from 'axios';
import { FocaRequestConfig } from '../enhancer';
import { TransformResponseHandler } from '../libs/preventTransform';

export class RequestSlot {
  constructor(
    protected readonly originalAdapter: AxiosAdapter,
    protected readonly getHttpStatus?: (response: AxiosResponse) => number,
  ) {
    if (!originalAdapter) {
      throw new Error('axios default adapter is not found.');
    }
  }

  hit(
    config: FocaRequestConfig,
    [onResolve, onReject]: TransformResponseHandler,
    shouldLoop: (
      err: AxiosError,
      config: FocaRequestConfig,
      currentTimes: number,
    ) => Promise<boolean>,
  ): Promise<any> {
    const loop = (currentTimes: number): Promise<any> => {
      return this.originalAdapter(config)
        .then(onResolve, onReject)
        .then((response: AxiosResponse) => {
          const getHttpStatus = config.getHttpStatus || this.getHttpStatus;

          if (config.validateStatus && getHttpStatus) {
            const realHttpStatus = getHttpStatus(response);

            if (!config.validateStatus(realHttpStatus)) {
              return Promise.reject(
                // @ts-expect-error
                new axios.AxiosError(
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
