import { CacheSlot } from '../src';
import { FocaRequestConfig } from '../src';
import sleep from 'sleep-promise';
import { resolveResponse } from './utils';

test('Common request will not cache', async () => {
  const cache = new CacheSlot();
  const config: FocaRequestConfig = {
    method: 'get',
    url: '/users',
  };

  const a = await cache.hit(config, resolveResponse);
  const b = await cache.hit(config, resolveResponse);

  expect(a.data).not.toEqual(b.data);
});

test('Same request can hit cache', async () => {
  const cache = new CacheSlot({});
  const config: FocaRequestConfig = {
    method: 'get',
    url: '/users',
  };

  const a = await cache.hit(config, resolveResponse);
  const b = await cache.hit(config, resolveResponse);

  expect(a.data).toEqual(b.data);
});

test('Cache has expire time', async () => {
  const cache = new CacheSlot({
    maxAge: 200,
  });
  const config: FocaRequestConfig = {
    method: 'get',
    url: '/users',
  };

  const a = await cache.hit(config, resolveResponse);
  const b = await cache.hit(config, resolveResponse);
  await sleep(150);
  const c = await cache.hit(config, resolveResponse);
  await sleep(51);
  const d = await cache.hit(config, resolveResponse);

  expect(a.data).toEqual(b.data);
  expect(a.data).toEqual(c.data);
  expect(a.data).not.toEqual(d.data);
});

test('Different request can not share the cache', async () => {
  const cache = new CacheSlot({});
  const config1: FocaRequestConfig = {
    method: 'get',
    url: '/users',
  };
  const config2: FocaRequestConfig = {
    ...config1,
    url: '/admins',
  };

  const a = await cache.hit(config1, resolveResponse);
  const b = await cache.hit(config2, resolveResponse);

  expect(a.data).not.toEqual(b.data);
});
test('Format the config to hit the cache', async () => {
  const cache = new CacheSlot({
    format(config) {
      Reflect.deleteProperty(config, 'url');
      return config;
    },
  });

  const config1: FocaRequestConfig = {
    method: 'get',
    url: '/users',
    params: {},
  };
  const config2: FocaRequestConfig = {
    ...config1,
    url: '/admins',
  };

  const a = await cache.hit(config1, resolveResponse);
  const b = await cache.hit(config2, resolveResponse);

  expect(a.data).toEqual(b.data);
});

test('force enable cache', async () => {
  const cache = new CacheSlot();
  const config: FocaRequestConfig = {
    method: 'get',
    url: '/users',
    cache: {},
  };

  const a = await cache.hit(config, resolveResponse);
  const b = await cache.hit(config, resolveResponse);

  expect(a.data).toEqual(b.data);
});

test('config should not be shared', async () => {
  const cache = new CacheSlot({});
  const config1: FocaRequestConfig = {
    method: 'get',
    url: '/users',
    params: {},
  };
  const config2: FocaRequestConfig = {
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

test('cache can be cleared', async () => {
  const cache = new CacheSlot({});
  const config: FocaRequestConfig = {
    method: 'get',
    url: '/users',
  };

  const a = await cache.hit(config, resolveResponse);
  cache.clear();
  const b = await cache.hit(config, resolveResponse);
  expect(a.data).not.toEqual(b.data);

  const c = await cache.hit(config, resolveResponse);
  expect(c.data).toEqual(b.data);
});

test('cache can be cleared with filter', async () => {
  const cache = new CacheSlot({});
  const config1: FocaRequestConfig = {
    method: 'get',
    url: '/users',
  };
  const config2: FocaRequestConfig = {
    method: 'get',
    url: '/users2',
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
