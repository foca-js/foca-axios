import { AxiosError, CanceledError } from 'axios';
import { FocaRequestConfig, RetrySlot } from '../src';

test('Common request will not retry', async () => {
  const retry = new RetrySlot();
  const config: FocaRequestConfig = {
    url: '/users',
    method: 'get',
  };
  const error = new AxiosError('', void 0, config, null, undefined);

  await expect(retry.validate(error, config, 1)).resolves.toBeFalsy();
});

test('Request can retry', async () => {
  const retry = new RetrySlot({});
  const config: FocaRequestConfig = {
    url: '/users',
    method: 'get',
  };
  const error = new AxiosError('', void 0, config, null, undefined);

  await expect(retry.validate(error, config, 1)).resolves.toBeTruthy();
});

test('Can set max retry times', async () => {
  const retry = new RetrySlot({
    maxTimes: 2,
  });

  const config: FocaRequestConfig = {
    url: '/users',
    method: 'get',
  };
  const error = new AxiosError('', void 0, config, null, undefined);

  await expect(retry.validate(error, config, 1)).resolves.toBeTruthy();
  await expect(retry.validate(error, config, 2)).resolves.toBeTruthy();
  await expect(retry.validate(error, config, 3)).resolves.toBeFalsy();
  await expect(retry.validate(error, config, 2)).resolves.toBeTruthy();
  await expect(retry.validate(error, config, 1)).resolves.toBeTruthy();
});

test('The aborted request should not retry', async () => {
  const retry = new RetrySlot({});
  const config: FocaRequestConfig = {
    url: '/users',
    method: 'get',
  };

  await expect(
    retry.validate(new CanceledError(''), config, 1),
  ).resolves.toBeFalsy();
});

test('Should match http status', async () => {
  const retry = new RetrySlot({});
  const retry1 = new RetrySlot({
    allowedHttpStatus: [[400, 500], 600],
  });

  const config: FocaRequestConfig = {
    url: '/users',
    method: 'get',
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
