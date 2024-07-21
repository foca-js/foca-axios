import { expect, test } from 'vitest';
import axios from '../src';
import { mockAxios } from './mocks/mock-axios';

test('返回纯数据', async () => {
  const data = [
    { id: 1, name: 'lucifer' },
    { id: 2, name: 'Waka' },
  ];
  mockAxios(200, data);
  await expect(axios.get('/users')).resolves.toMatchObject(data);

  mockAxios(201, 'Succeed');
  await expect(axios.post('/users')).resolves.toBe('Succeed');
});

test('返回原始值', async () => {
  const data = [
    { id: 1, name: 'lucifer' },
    { id: 2, name: 'Waka' },
  ];
  mockAxios(200, data);
  const result = await axios.get<typeof data>('/users').toRaw();
  expect(result).toMatchInlineSnapshot(`
    {
      "config": {
        "method": "get",
        "url": "/users",
      },
      "data": [
        {
          "id": 1,
          "name": "lucifer",
        },
        {
          "id": 2,
          "name": "Waka",
        },
      ],
      "statusCode": 200,
    }
  `);
});
