export const isForceEnable = (config: boolean | { enable?: boolean } | undefined) => {
  return (
    config && (config === true || (typeof config === 'object' && config.enable !== false))
  );
};
