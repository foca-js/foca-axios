import axios, { Axios, AxiosError, AxiosResponse } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import Cancel from 'axios/lib/cancel/Cancel';
import { FocaRequestConfig, RetrySlot } from '../src';

const instance = axios.create();
const mock = new MockAdapter(instance);

const onResolve = (response: AxiosResponse) => response;
const onReject = (err: AxiosError) => {
  return Promise.reject(err);
};

afterEach(() => {
  mock.reset();
});

test('RetrySlot accepts an adapter', () => {
  expect(
    () => new RetrySlot(undefined, new Axios().defaults?.adapter!, undefined),
  ).toThrowError();
});

test('Common request will not retry', async () => {
  const retry = new RetrySlot(undefined, mock.adapter(), undefined);

  mock.onGet('/users').networkErrorOnce();
  mock.onGet('/users').replyOnce(200);
  const config: FocaRequestConfig = {
    url: '/users',
    method: 'get',
  };

  await expect(retry.hit(config, [onResolve, onReject])).rejects.toThrowError();
});

test('Request can retry', async () => {
  const retry = new RetrySlot({}, mock.adapter(), undefined);

  mock.onGet('/users').networkErrorOnce();
  mock.onGet('/users').replyOnce(200, 'abc');
  const config: FocaRequestConfig = {
    url: '/users',
    method: 'get',
  };

  await expect(retry.hit(config, [onResolve, onReject])).resolves.toMatchObject(
    {
      data: 'abc',
    },
  );
});

test('Can set max retry times', async () => {
  const retry = new RetrySlot(
    {
      maxTimes: 2,
    },
    mock.adapter(),
    undefined,
  );

  const config: FocaRequestConfig = {
    url: '/users',
    method: 'get',
  };

  mock.onGet('/users').networkErrorOnce();
  mock.onGet('/users').timeoutOnce();
  mock.onGet('/users').networkErrorOnce();
  mock.onGet('/users').reply(200, 'abc');
  await expect(retry.hit(config, [onResolve, onReject])).rejects.toThrowError();

  mock.reset();

  mock.onGet('/users').networkErrorOnce();
  mock.onGet('/users').timeoutOnce();
  mock.onGet('/users').reply(200, 'abc');
  await expect(retry.hit(config, [onResolve, onReject])).resolves.toMatchObject(
    {
      data: 'abc',
    },
  );
});

test('Can retry non-standart response', async () => {
  const retry = new RetrySlot(
    {},
    mock.adapter(),
    (response) => response.data.code,
  );

  const config: FocaRequestConfig = {
    url: '/users',
    method: 'get',
    validateStatus: instance.defaults.validateStatus,
  };

  mock.onGet('/users').replyOnce(200, { code: 201, data: 'abc' });
  await expect(retry.hit(config, [onResolve, onReject])).resolves.toMatchObject(
    {
      data: {
        data: 'abc',
        code: 201,
      },
    },
  );

  mock.onGet('/users').replyOnce(200, { code: 400, data: 'abc' });
  await expect(retry.hit(config, [onResolve, onReject])).rejects.toThrowError();
});

test('The aborted request should not retry', async () => {
  const retry = new RetrySlot({}, mock.adapter(), undefined);

  const config: FocaRequestConfig = {
    url: '/users',
    method: 'get',
  };

  mock.onGet('/users').replyOnce(() => {
    return Promise.reject(new Cancel('Aborted'));
  });
  mock.onGet('/users').replyOnce(200);
  await expect(retry.hit(config, [onResolve, onReject])).rejects.toBeInstanceOf(
    Cancel,
  );
});
