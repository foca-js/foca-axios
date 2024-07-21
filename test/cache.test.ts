import { AxiosHeaders, InternalAxiosRequestConfig } from '../src';
import sleep from 'sleep-promise';
import { resolveResponse } from './utils';
import { expect, test } from 'vitest';
import { CacheSlot } from '../src/slots/cache-slot';

test('默认关闭', async () => {
  const cache = new CacheSlot();
  const config: InternalAxiosRequestConfig = {
    method: 'get',
    url: '/users',
    headers: new AxiosHeaders(),
  };

  const a = await cache.hit(config, resolveResponse);
  const b = await cache.hit(config, resolveResponse);

  expect(a.data).not.toEqual(b.data);
});

test('相同请求可以命中缓存', async () => {
  const cache = new CacheSlot(true);
  const config: InternalAxiosRequestConfig = {
    method: 'get',
    url: '/users',
    headers: new AxiosHeaders(),
  };

  const a = await cache.hit(config, resolveResponse);
  const b = await cache.hit(config, resolveResponse);

  expect(a.data).toEqual(b.data);
});

test('过期时间', async () => {
  const cache = new CacheSlot({
    maxAge: 2000,
  });
  const config: InternalAxiosRequestConfig = {
    method: 'get',
    url: '/users',
    headers: new AxiosHeaders(),
  };

  const a = await cache.hit(config, resolveResponse);
  const b = await cache.hit(config, resolveResponse);
  await sleep(1000);
  const c = await cache.hit(config, resolveResponse);
  await sleep(1800);
  const d = await cache.hit(config, resolveResponse);

  expect(a.data).toEqual(b.data);
  expect(a.data).toEqual(c.data);
  expect(a.data).not.toEqual(d.data);
});

test('不同的请求无法共享缓存', async () => {
  const cache = new CacheSlot(true);
  const config1: InternalAxiosRequestConfig = {
    method: 'get',
    url: '/users',
    headers: new AxiosHeaders(),
  };

  const config2: InternalAxiosRequestConfig = {
    ...config1,
    url: '/admins',
  };

  const a = await cache.hit(config1, resolveResponse);
  const b = await cache.hit(config2, resolveResponse);

  expect(a.data).not.toEqual(b.data);
});

test('设置新的key以共享缓存', async () => {
  const cache = new CacheSlot({
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
  };
  const config2: InternalAxiosRequestConfig = {
    ...config1,
    url: '/admins',
  };

  const a = await cache.hit(config1, resolveResponse);
  const b = await cache.hit(config2, resolveResponse);

  expect(a.data).toEqual(b.data);
});

test('单词请求中强制开启缓存', async () => {
  const cache = new CacheSlot(false);
  const config: InternalAxiosRequestConfig = {
    method: 'get',
    url: '/users',
    cache: {},
    headers: new AxiosHeaders(),
  };

  const a = await cache.hit(config, resolveResponse);
  const b = await cache.hit(config, resolveResponse);

  expect(a.data).toEqual(b.data);
});

test('config不会被共享', async () => {
  const cache = new CacheSlot(true);
  const config1: InternalAxiosRequestConfig = {
    method: 'get',
    url: '/users',
    params: {},
    headers: new AxiosHeaders(),
  };
  const config2: InternalAxiosRequestConfig = {
    ...config1,
  };

  const a = await cache.hit(config1, resolveResponse);
  const b = await cache.hit(config2, resolveResponse);

  expect(a.config !== b.config).toBeTruthy();
  expect(a.config === config1).toBeTruthy();
  expect(b.config === config2).toBeTruthy();

  expect(a.headers !== b.headers).toBeTruthy();
  expect(a.headers).toStrictEqual(b.headers);

  expect(a.data !== b.data).toBeTruthy();
  expect(a.data).toStrictEqual(b.data);
});

test('清除缓存', async () => {
  const cache = new CacheSlot(true);
  const config: InternalAxiosRequestConfig = {
    method: 'get',
    url: '/users',
    headers: new AxiosHeaders(),
  };

  const a = await cache.hit(config, resolveResponse);
  cache.clear();
  const b = await cache.hit(config, resolveResponse);
  expect(a.data).not.toEqual(b.data);

  const c = await cache.hit(config, resolveResponse);
  expect(c.data).toEqual(b.data);
});

test('清除指定缓存', async () => {
  const cache = new CacheSlot(true);
  const config1: InternalAxiosRequestConfig = {
    method: 'get',
    url: '/users',
    headers: new AxiosHeaders(),
  };
  const config2: InternalAxiosRequestConfig = {
    method: 'get',
    url: '/users2',
    headers: new AxiosHeaders(),
  };

  const a = await cache.hit(config1, resolveResponse);
  const b = await cache.hit(config2, resolveResponse);

  cache.clear((config) => config.url === '/users');

  const c = await cache.hit(config1, resolveResponse);
  const d = await cache.hit(config2, resolveResponse);
  expect(a.data).not.toEqual(c.data);
  expect(b.data).toEqual(d.data);

  cache.clear((config) => config.url === '/users2');

  const e = await cache.hit(config2, resolveResponse);
  expect(d.data).not.toEqual(e.data);
});
