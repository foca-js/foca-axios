interface BaseConfig {
  enable?: boolean;
}

export const mergeSlotOptions = <T extends BaseConfig>(
  globalOptions?: boolean | T,
  localOptions?: boolean | T,
): T => {
  const globalOpts: BaseConfig | undefined =
    typeof globalOptions === 'undefined'
      ? {}
      : typeof globalOptions === 'boolean'
        ? { enable: globalOptions }
        : { enable: true, ...globalOptions };
  const localOpts: BaseConfig | undefined =
    typeof localOptions === 'undefined'
      ? {}
      : typeof localOptions === 'boolean'
        ? { enable: localOptions }
        : { enable: true, ...localOptions };

  return Object.assign({ enable: true }, globalOpts, localOpts) as T;
};
