import assign from 'object-assign';

interface BaseConfig {
  enable?: boolean;
}

export const mergeSlotOptions = <T extends BaseConfig>(
  globalOptions?: T,
  options?: T,
): T => {
  if (!globalOptions && !options) {
    return <T>{ enable: false };
  }

  const next: T = assign({}, globalOptions, options);

  if (options && options.enable !== false) {
    next.enable = true;
  }

  return next;
};
