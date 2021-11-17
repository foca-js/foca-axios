import { AxiosPromise, AxiosResponse } from 'axios';

export type TransformResponseHandler = [
  onResolve?: (
    value: AxiosResponse,
  ) => AxiosResponse | PromiseLike<AxiosResponse>,
  onReject?: (...args: any[]) => any,
];

/**
 * adapter执行完后会继续执行transform。
 * 但是缓存和共享的数据之前都已经执行过了，需要跳过。
 * 请求重试判断前也执行了transform，所以也需要跳过。
 */
export const preventTransform = (
  promise: Promise<any>,
  transform: TransformResponseHandler,
): Promise<any> => {
  return <AxiosPromise>{
    then() {
      transform.push.apply(
        transform,
        arguments as unknown as TransformResponseHandler,
      );
      return promise;
    },
  };
};
