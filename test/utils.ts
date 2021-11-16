import { AxiosResponse } from 'axios';
import { FocaRequestConfig } from '../src';

export const resolveResponse = (
  config: FocaRequestConfig,
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
