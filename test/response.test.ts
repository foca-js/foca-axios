import axios, { AxiosResponse } from 'axios';
import { enhance } from '../src';
import MockAdapter from 'axios-mock-adapter';

const instance = axios.create();
const mock = new MockAdapter(instance);
const http = enhance(instance);

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

  const result = await http.get<typeof data>('/users').toRawResponse();

  expect(result).toMatchObject<Partial<AxiosResponse<typeof data>>>({
    data: data,
    status: 200,
  });
});
