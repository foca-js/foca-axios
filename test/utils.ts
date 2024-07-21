import { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

export const resolveResponse = (
  config: InternalAxiosRequestConfig,
): Promise<AxiosResponse> => {
  return Promise.resolve({
    data: {
      num: Math.random(),
    },
    config,
    request: {},
    headers: { 'Content-Type': 'b' },
    status: 200,
    statusText: 'OK',
  });
};

export const rejectResponse = () => Promise.reject(new Error(''));
