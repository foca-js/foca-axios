import axios, { Axios, AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import sleep from 'sleep-promise';
import { RequestSlot } from '../src/slots/RequestSlot';
import { expect, test } from 'vitest';

const onResolve = (response: AxiosResponse) => response;
const onReject = (err: AxiosError) => {
  return Promise.reject(err);
};

test('RequestSlot accepts an adapter', () => {
  const emptyAdapter = new Axios().defaults?.adapter;
  expect(() => new RequestSlot(emptyAdapter!)).toThrowError();
});

test('Can request non-standart response', async () => {
  const instance = axios.create();
  const mock = new MockAdapter(instance);

  const request = new RequestSlot(mock.adapter(), (response) => response.data.code);

  const config: AxiosRequestConfig = {
    url: '/users',
    method: 'get',
    validateStatus: instance.defaults.validateStatus,
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

test('Loop request until succeed', async () => {
  const instance = axios.create();
  const mock = new MockAdapter(instance);

  const request = new RequestSlot(mock.adapter());

  const config: AxiosRequestConfig = {
    url: '/users',
    method: 'get',
    validateStatus: instance.defaults.validateStatus,
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
