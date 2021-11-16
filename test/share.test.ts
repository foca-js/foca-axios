import { FocaRequestConfig, ShareSlot } from '../src';
import { rejectRespone, resolveResponse } from './utils';

test('Common request will not share', async () => {
  const share = new ShareSlot();
  const config: FocaRequestConfig = {
    method: 'get',
    url: '/users',
  };

  const [a, b] = await Promise.all([
    share.hit(config, resolveResponse),
    share.hit(config, resolveResponse),
  ]);
  expect(a.data).not.toEqual(b.data);
});

test('Same request can be shared', async () => {
  const share = new ShareSlot({});
  const config: FocaRequestConfig = {
    method: 'get',
    url: '/users',
    params: {},
  };

  const [a, b] = await Promise.all([
    share.hit(config, resolveResponse),
    share.hit(config, resolveResponse),
  ]);
  expect(a.data).toEqual(b.data);
});

test('Different request can not share to each other', async () => {
  const share = new ShareSlot({});
  const config1: FocaRequestConfig = {
    method: 'get',
    url: '/users',
  };
  const config2: FocaRequestConfig = {
    ...config1,
    url: '/admins',
  };

  const [a, b] = await Promise.all([
    share.hit(config1, resolveResponse),
    share.hit(config2, resolveResponse),
  ]);
  expect(a.data).not.toEqual(b.data);
});

test('Format the config to hit the share thread', async () => {
  const share = new ShareSlot({
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

  const [a, b] = await Promise.all([
    share.hit(config1, resolveResponse),
    share.hit(config2, resolveResponse),
  ]);
  expect(a.data).toEqual(b.data);
});

test('Force to enable share and ignore the allowed methods', async () => {
  const share = new ShareSlot({
    allowedMethods: ['get', 'delete'],
    format(config) {
      Reflect.deleteProperty(config, 'method');
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
    method: 'post',
  };
  const config3: FocaRequestConfig = {
    ...config2,
    share: {
      allowedMethods: ['post'],
    },
  };

  const [a, b, c] = await Promise.all([
    share.hit(config1, resolveResponse),
    share.hit(config2, resolveResponse),
    share.hit(config3, resolveResponse),
  ]);
  expect(a.data).not.toEqual(b.data);
  expect(a.data).toEqual(c.data);
});

test('Ending share thread after promise resolved', async () => {
  const share = new ShareSlot({});
  const config: FocaRequestConfig = {
    method: 'get',
    url: '/users',
    params: {},
  };

  const a = await share.hit(config, resolveResponse);
  const b = await share.hit(config, resolveResponse);

  expect(a.data).not.toEqual(b.data);
});

test('Ending share thread after promise rejected', async () => {
  const share = new ShareSlot({});
  const config: FocaRequestConfig = {
    method: 'get',
    url: '/users',
    params: {},
  };

  const a = share.hit(config, rejectRespone);
  const b = share.hit(config, resolveResponse);

  await expect(a).rejects.toThrowError();
  await expect(b).rejects.toThrowError();

  const c = await share.hit(config, resolveResponse);
  expect(typeof c.data.num).toEqual('number');
});

test('config should not be shared', async () => {
  const share = new ShareSlot({});
  const config1: FocaRequestConfig = {
    method: 'get',
    url: '/users',
    params: {},
  };
  const config2: FocaRequestConfig = {
    ...config1,
  };

  const [a, b] = await Promise.all([
    share.hit(config1, resolveResponse),
    share.hit(config2, resolveResponse),
  ]);

  expect(a.config !== b.config).toBeTruthy();
  expect(a.config === config1).toBeTruthy();
  expect(b.config === config2).toBeTruthy();

  expect(a.headers !== b.headers).toBeTruthy();
  expect(a.headers).toStrictEqual(b.headers);

  expect(a.data !== b.data).toBeTruthy();
  expect(a.data).toStrictEqual(b.data);
});
