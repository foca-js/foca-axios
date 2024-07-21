import { expect, test } from 'vitest';
import axios from '../src';
import { mockAxios } from './mocks/mock-axios';

test('axios包含了适配器', async () => {
  mockAxios(200, 'foo');

  await expect(axios.get('/')).resolves.toBe('foo');
});

test('axios.create()也包含了适配器', async () => {
  mockAxios(200, 'foo');
  await expect(axios.create().get('/')).resolves.toBe('foo');
});
