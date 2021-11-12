export type PromiseCallback = [onResolve?: () => any, onReject?: () => any];

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
