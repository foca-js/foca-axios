import {
  AxiosError,
  AxiosHeaders,
  CanceledError,
  InternalAxiosRequestConfig,
} from 'axios';
import { describe, expect, test } from 'vitest';
import { RetrySlot } from '../src/slots/retry-slot';

test('允许重试', async () => {
  const retry = new RetrySlot();
  const config: InternalAxiosRequestConfig = {
    url: '/users',
    method: 'get',
    headers: new AxiosHeaders(),
  };
  const error = new AxiosError('', void 0, config, null, undefined);

  await expect(retry.validate(error, config, 1)).resolves.toBeTruthy();
});

test('validate权限最高', async () => {
  const retry = new RetrySlot({
    validate(config) {
      return config.url !== '/users';
    },
  });
  const config1: InternalAxiosRequestConfig = {
    url: '/users',
    method: 'get',
    headers: new AxiosHeaders(),
  };
  const error1 = new AxiosError('', void 0, config1, null, undefined);
  const config2: InternalAxiosRequestConfig = {
    url: '/admins',
    method: 'get',
    headers: new AxiosHeaders(),
  };
  const error2 = new AxiosError('', void 0, config2, null, undefined);

  await expect(retry.validate(error1, config1, 1)).resolves.toBeFalsy();
  await expect(retry.validate(error2, config2, 1)).resolves.toBeTruthy();
});

test('最大重试次数', async () => {
  const retry = new RetrySlot({
    maxTimes: 2,
  });

  const config: InternalAxiosRequestConfig = {
    url: '/users',
    method: 'get',
    headers: new AxiosHeaders(),
  };
  const error = new AxiosError('', void 0, config, null, undefined);

  await expect(retry.validate(error, config, 1)).resolves.toBeTruthy();
  await expect(retry.validate(error, config, 2)).resolves.toBeTruthy();
  await expect(retry.validate(error, config, 3)).resolves.toBeFalsy();
  await expect(retry.validate(error, config, 2)).resolves.toBeTruthy();
  await expect(retry.validate(error, config, 1)).resolves.toBeTruthy();
});

test('被手动取消的请求不会重试', async () => {
  const retry = new RetrySlot();
  const config: InternalAxiosRequestConfig = {
    url: '/users',
    method: 'get',
    headers: new AxiosHeaders(),
  };

  await expect(retry.validate(new CanceledError(''), config, 1)).resolves.toBeFalsy();
});

test('匹配http状态码', async () => {
  const retry = new RetrySlot();
  const retry1 = new RetrySlot({
    allowedHttpStatus: [[400, 500], 600],
  });

  const config: InternalAxiosRequestConfig = {
    url: '/users',
    method: 'get',
    headers: new AxiosHeaders(),
  };
  const error = new AxiosError(
    '',
    void 0,
    config,
    {},
    {
      status: 600,
      data: [],
      statusText: 'Bad Request',
      headers: {},
      config,
    },
  );

  await expect(retry.validate(error, config, 1)).resolves.toBeFalsy();
  await expect(retry1.validate(error, config, 1)).resolves.toBeTruthy();
});

describe('解决401授权问题', () => {
  const config: InternalAxiosRequestConfig = {
    url: '/users',
    method: 'post',
    headers: new AxiosHeaders(),
  };
  const error = new AxiosError(
    '',
    void 0,
    config,
    {},
    {
      status: 401,
      data: [],
      statusText: 'Unauthorized',
      headers: {},
      config,
    },
  );

  test('返回true', async () => {
    const retry = new RetrySlot({
      allowedMethods: ['get'],
      allowedHttpStatus: [400],
      async resolveUnauthorized() {
        return true;
      },
    });
    await expect(retry.validate(error, config, 1)).resolves.toBeTruthy();
  });

  test('返回false', async () => {
    const retry = new RetrySlot({
      allowedMethods: ['get'],
      allowedHttpStatus: [400],
      async resolveUnauthorized() {
        return false;
      },
    });
    await expect(retry.validate(error, config, 1)).resolves.toBeFalsy();
  });

  test('报错', async () => {
    const retry = new RetrySlot({
      allowedMethods: ['get'],
      allowedHttpStatus: [400],
      async resolveUnauthorized() {
        throw new Error('x');
      },
    });
    await expect(retry.validate(error, config, 1)).resolves.toBeFalsy();
  });

  test('函数内不允许retry', async () => {
    const retry = new RetrySlot({
      allowedMethods: ['get'],
      allowedHttpStatus: [400],
      async resolveUnauthorized() {
        const config1: InternalAxiosRequestConfig = {
          url: '/users',
          method: 'get',
          headers: new AxiosHeaders(),
        };
        const error1 = new AxiosError(
          '',
          void 0,
          config1,
          {},
          {
            status: 400,
            data: [],
            statusText: 'Bad Request',
            headers: {},
            config,
          },
        );
        await expect(retry.validate(error1, config1, 1)).resolves.toBeFalsy();
        await expect(retry.validate(error, config, 1)).resolves.toBeFalsy();

        return true;
      },
    });
    await expect(retry.validate(error, config, 1)).resolves.toBeTruthy();
  });
});
