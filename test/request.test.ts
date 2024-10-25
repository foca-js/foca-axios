import axios, {
  Axios,
  AxiosError,
  AxiosHeaders,
  AxiosResponse,
  getAdapter,
  InternalAxiosRequestConfig,
} from 'axios';
import MockAdapter from 'axios-mock-adapter';
import sleep from 'sleep-promise';
import { RequestSlot } from '../src/slots/request-slot';
import { expect, test } from 'vitest';

const onResolve = (response: AxiosResponse) => response;
const onReject = (err: AxiosError) => {
  return Promise.reject(err);
};

test('request 插槽接受适配器', () => {
  expect(() => new RequestSlot(getAdapter(new Axios().defaults?.adapter))).toThrowError();
});

test('请求费标准响应数据', async () => {
  const instance = axios.create();
  const mock = new MockAdapter(instance);

  const request = new RequestSlot(mock.adapter(), (response) => response.data.code);

  const config: InternalAxiosRequestConfig = {
    url: '/users',
    method: 'get',
    validateStatus: instance.defaults.validateStatus,
    headers: new AxiosHeaders(),
    timestamp: Date.now(),
  };

  mock.onGet('/users').replyOnce(200, { code: 201, data: 'abc' });
  await expect(
    request.hit(config, [onResolve, onReject], async () => false),
  ).resolves.toMatchObject({
    data: {
      data: 'abc',
      code: 201,
    },
  });

  mock.onGet('/users').replyOnce(200, { code: 400, data: 'abc' });
  await expect(
    request.hit(config, [onResolve, onReject], async () => false),
  ).rejects.toThrowError();

  mock.restore();
});

test('重复请求直到成功', async () => {
  const instance = axios.create();
  const mock = new MockAdapter(instance);

  const request = new RequestSlot(mock.adapter());

  const config: InternalAxiosRequestConfig = {
    url: '/users',
    method: 'get',
    validateStatus: instance.defaults.validateStatus,
    headers: new AxiosHeaders(),
    timestamp: Date.now(),
  };

  mock.onGet('/users').replyOnce(400);
  mock.onGet('/users').replyOnce(400);
  mock.onGet('/users').replyOnce(400);
  mock.onGet('/users').replyOnce(400);
  mock.onGet('/users').replyOnce(200, 'abc');

  await expect(
    request.hit(config, [onResolve, onReject], async () => {
      await sleep(100);
      return true;
    }),
  ).resolves.toMatchObject({
    status: 200,
    data: 'abc',
  });

  mock.restore();
});
