declare module 'axios/lib/core/createError' {
  import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

  export default function createError(
    message: string,
    config: AxiosRequestConfig,
    code: string | null,
    request: any,
    response: AxiosResponse,
  ): AxiosError;
}
