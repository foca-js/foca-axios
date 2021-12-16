interface BaseConfig {
  enable?: boolean;
}

export const mergeSlotOptions = <T extends BaseConfig>(
  globalOptions?: boolean | T,
  localOptions?: boolean | T,
): T => {
  if (!globalOptions && !localOptions) {
    return <T>{ enable: false };
  }

  const globalOpts: BaseConfig | undefined =
    typeof globalOptions === 'boolean'
      ? { enable: globalOptions }
      : globalOptions;
  const localOpts: BaseConfig | undefined =
    typeof localOptions === 'boolean' ? { enable: localOptions } : localOptions;

  const next = Object.assign({}, globalOpts, localOpts);

  if (localOpts && localOpts.enable !== false) {
    next.enable = true;
  }

  return next as T;
};
