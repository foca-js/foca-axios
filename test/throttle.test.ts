import { AxiosHeaders, InternalAxiosRequestConfig } from '../src';
import { ThrottleSlot } from '../src/slots/throttle-slot';
import { rejectResponse, resolveResponse } from './utils';
import { expect, test } from 'vitest';

test('Same request can hit throttle', async () => {
  const throttle = new ThrottleSlot();
  const config: InternalAxiosRequestConfig = {
    method: 'get',
    url: '/users',
    params: {},
    headers: new AxiosHeaders(),
    timestamp: Date.now(),
  };

  const [a, b] = await Promise.all([
    throttle.hit(config, resolveResponse),
    throttle.hit(config, resolveResponse),
  ]);
  expect(a.data).toEqual(b.data);
});

test('Different request can not throttle to each other', async () => {
  const throttle = new ThrottleSlot();
  const config1: InternalAxiosRequestConfig = {
    method: 'get',
    url: '/users',
    headers: new AxiosHeaders(),
    timestamp: Date.now(),
  };
  const config2: InternalAxiosRequestConfig = {
    ...config1,
    url: '/admins',
  };

  const [a, b] = await Promise.all([
    throttle.hit(config1, resolveResponse),
    throttle.hit(config2, resolveResponse),
  ]);
  expect(a.data).not.toEqual(b.data);
});

test('Format the config to hit the throttle thread', async () => {
  const throttle = new ThrottleSlot({
    format(config) {
      Reflect.deleteProperty(config, 'url');
      return config;
    },
  });
  const config1: InternalAxiosRequestConfig = {
    method: 'get',
    url: '/users',
    params: {},
    headers: new AxiosHeaders(),
    timestamp: Date.now(),
  };
  const config2: InternalAxiosRequestConfig = {
    ...config1,
    url: '/admins',
  };

  const [a, b] = await Promise.all([
    throttle.hit(config1, resolveResponse),
    throttle.hit(config2, resolveResponse),
  ]);
  expect(a.data).toEqual(b.data);
});

test('Force to enable throttle and ignore the allowed methods', async () => {
  const throttle = new ThrottleSlot({
    allowedMethods: ['get', 'delete'],
    format(config) {
      Reflect.deleteProperty(config, 'method');
      return config;
    },
  });
  const config1: InternalAxiosRequestConfig = {
    method: 'get',
    url: '/users',
    params: {},
    headers: new AxiosHeaders(),
    timestamp: Date.now(),
  };
  const config2: InternalAxiosRequestConfig = {
    ...config1,
    method: 'post',
  };
  const config3: InternalAxiosRequestConfig = {
    ...config2,
    throttle: {
      allowedMethods: ['post'],
    },
  };

  const [a, b, c] = await Promise.all([
    throttle.hit(config1, resolveResponse),
    throttle.hit(config2, resolveResponse),
    throttle.hit(config3, resolveResponse),
  ]);
  expect(a.data).not.toEqual(b.data);
  expect(a.data).toEqual(c.data);
});

test('Remove throttle thread after promise resolved', async () => {
  const throttle = new ThrottleSlot({});
  const config: InternalAxiosRequestConfig = {
    method: 'get',
    url: '/users',
    params: {},
    headers: new AxiosHeaders(),
    timestamp: Date.now(),
  };

  const a = await throttle.hit(config, resolveResponse);
  const b = await throttle.hit(config, resolveResponse);

  expect(a.data).not.toEqual(b.data);
});

test('Remove throttle thread after promise rejected', async () => {
  const throttle = new ThrottleSlot({});
  const config: InternalAxiosRequestConfig = {
    method: 'get',
    url: '/users',
    params: {},
    headers: new AxiosHeaders(),
    timestamp: Date.now(),
  };

  const a = throttle.hit(config, rejectResponse);
  const b = throttle.hit(config, resolveResponse);

  await expect(a).rejects.toThrowError();
  await expect(b).rejects.toThrowError();

  const c = await throttle.hit(config, resolveResponse);
  expect(c.data).toHaveProperty('num');
});

test('config should not be shared', async () => {
  const throttle = new ThrottleSlot({});
  const config1: InternalAxiosRequestConfig = {
    method: 'get',
    url: '/users',
    params: {},
    headers: new AxiosHeaders(),
    timestamp: Date.now(),
  };
  const config2: InternalAxiosRequestConfig = {
    ...config1,
  };

  const [a, b] = await Promise.all([
    throttle.hit(config1, resolveResponse),
    throttle.hit(config2, resolveResponse),
  ]);

  expect(a.config !== b.config).toBeTruthy();
  expect(a.config === config1).toBeTruthy();
  expect(b.config === config2).toBeTruthy();

  expect(a.headers !== b.headers).toBeTruthy();
  expect(a.headers).toStrictEqual(b.headers);

  expect(a.data !== b.data).toBeTruthy();
  expect(a.data).toStrictEqual(b.data);
});
