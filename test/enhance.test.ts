import { afterAll, expect, test, vitest } from 'vitest';
import originAxios from 'axios';
import axios from '../src';
import { Server } from 'node:http';

const url = 'http://localhost:5674';
const server = new Server((_, res) => {
  res.statusCode = 200;
  res.end('foo');
});
server.listen(5674);

afterAll(() => {
  server.close();
});

test('axios包含了适配器', async () => {
  await expect(axios.get(url)).resolves.toBe('foo');
});

test('axios.create()也包含了适配器', async () => {
  await expect(axios.create().get(url)).resolves.toBe('foo');
});

test('插槽配置', async () => {
  let cfg: object | undefined;
  const spy = vitest.spyOn(originAxios, '_').mockImplementation((config) => {
    cfg = config;
    return originAxios;
  });

  axios.create({
    retry: false,
    cache: false,
    throttle: {},
    getHttpStatus: () => 204,
    baseURL: 'http://',
    timeout: 500,
  });
  expect(cfg).toMatchInlineSnapshot(`
    {
      "baseURL": "http://",
      "timeout": 500,
    }
  `);
  spy.mockRestore();
});
