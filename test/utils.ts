import { AxiosRequestConfig, AxiosResponse } from 'axios';

export const resolveResponse = (
  config: AxiosRequestConfig,
): Promise<AxiosResponse> =>
  Promise.resolve({
    data: {
      num: Math.random(),
    },
    config,
    request: {},
    headers: { 'Content-Type': 'b' },
    status: 200,
    statusText: 'OK',
  });

export const rejectRespone = () => Promise.reject(new Error(''));
