import axios, { AxiosResponse } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { enhance } from '../src';
import { expect, test } from 'vitest';

let mock: MockAdapter;

const http = axios.create({
  enhance(instance) {
    mock = new MockAdapter(instance);
    return enhance(instance);
  },
});

test('Get unwrap api', async () => {
  const data = [
    { id: 1, name: 'lucifer' },
    { id: 2, name: 'Waka' },
  ];

  mock.onGet('/users').replyOnce(200, data);

  const result = await http.get<typeof data>('/users');
  expect(result).toMatchObject<typeof data>(data);
});

test('Post unwrap api', async () => {
  const data = 'Succeed';

  mock.onPost('/users').replyOnce(201, data);

  const result = await http.post<typeof data>('/users');
  expect(result).toBe(data);
});

test('Get api with original axios response', async () => {
  const data = [
    { id: 1, name: 'lucifer' },
    { id: 2, name: 'Waka' },
  ];

  mock.onGet('/users').replyOnce(200, data);

  const result = await http.get<typeof data>('/users').toRaw();

  expect(result).toMatchObject<Partial<AxiosResponse<typeof data>>>({
    data: data,
    status: 200,
  });
});
