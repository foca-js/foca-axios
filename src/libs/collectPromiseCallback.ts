export type PromiseCallback = [
  onResolve?: (...args: any[]) => any,
  onReject?: (...args: any[]) => any,
];

export const collectPromiseCallback = (
  promise: Promise<any>,
  callback: PromiseCallback,
) => {
  const originalThen = promise.then;

  promise.then = function () {
    promise.then = originalThen;
    callback.push.apply(callback, arguments as unknown as PromiseCallback);
    return promise;
  };
};
