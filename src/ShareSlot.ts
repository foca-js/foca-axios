import { AxiosResponse, Method } from 'axios';
import clone from 'clone';
import assign from 'object-assign';
import { FocaRequestConfig } from './enhancer';

export interface ShareSlotOptions {
  /**
   * 是否支持共享，默认：true
   */
  enable?: boolean;
  /**
   * 允许共享的方法，默认：['get', 'head', 'put', 'patch', 'delete']
   *
   */
  allowedMethods?: `${Lowercase<Method>}`[];
  /**
   * 作为共享的依赖，你可以过滤掉无关的属性，容易命中共享中的请求。
   *
   * 允许直接更改formatConfig对象，不会影响请求结果。
   */
  formatKey?: (formatConfig: ShareFormatConfig) => object | string | void;
}

export class ShareSlot {
  protected static defaultAllowedMethods: NonNullable<
    ShareSlotOptions['allowedMethods']
  > = ['get', 'head', 'put', 'patch', 'delete'];

  protected readonly threads: Partial<{
    [K: string]: Promise<AxiosResponse>;
  }> = {};

  constructor(
    protected readonly options: ShareSlotOptions = { enable: false },
  ) {}

  async hit(
    config: FocaRequestConfig,
    newThread: () => Promise<AxiosResponse>,
  ): Promise<AxiosResponse> {
    const options = assign({}, this.options, config.share);
    const { allowedMethods = ShareSlot.defaultAllowedMethods } = options;

    const enable =
      options.enable !== false &&
      // 强制允许时，不检测method
      ((config.share && config.share.enable === true) ||
        allowedMethods.includes(
          config.method!.toLowerCase() as `${Lowercase<Method>}`,
        ));

    if (!enable) {
      return newThread();
    }

    const formatConfig = enable ? getFormatConfig(config) : null;
    const key = enable
      ? JSON.stringify(
          options.formatKey
            ? options.formatKey(clone(formatConfig!))
            : formatConfig,
        )
      : '';

    const thread = this.threads[key];

    if (thread) {
      return thread;
    }

    const promise = (this.threads[key] = newThread());

    /**
     * 请求结束后需清理共享池
     *
     * then/catch 在 chrome@32 引入，除了IE之外基本都支持了。
     * finally 在 chrome@63 引入，支持得比较晚，不建议冒险使用。
     */
    promise
      .then(() => {
        this.threads[key] = void 0;
      })
      .catch(() => {
        this.threads[key] = void 0;
      });

    return promise;
  }
}

const formatKeys = [
  'baseURL',
  'url',
  'method',
  'params',
  'data',
  'headers',
  'timeout',
  'maxContentLength',
  'maxBodyLength',
  'xsrfCookieName',
  'xsrfHeaderName',
] as const;

type FormatKeys = typeof formatKeys[number];

export type ShareFormatConfig = Required<Pick<FocaRequestConfig, FormatKeys>>;

const getFormatConfig = (config: FocaRequestConfig): ShareFormatConfig => {
  return formatKeys.reduce((carry, key) => {
    carry[key] = config[key];
    return carry;
  }, <Pick<FocaRequestConfig, FormatKeys>>{}) as ShareFormatConfig;
};
