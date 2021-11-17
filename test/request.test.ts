import axios, { Axios, AxiosError, AxiosResponse } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { FocaRequestConfig } from '../src';
import { RequestSlot } from '../src/slots/RequestSlot';

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

  const request = new RequestSlot(
    mock.adapter(),
    (response) => response.data.code,
  );

  const config: FocaRequestConfig = {
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
});
