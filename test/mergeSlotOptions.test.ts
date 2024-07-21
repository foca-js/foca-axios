import { expect, test } from 'vitest';
import { mergeSlotOptions } from '../src';

test('Input undefined', () => {
  expect(mergeSlotOptions(undefined, undefined)).toStrictEqual({
    enable: true,
  });

  expect(mergeSlotOptions(undefined, true)).toStrictEqual({
    enable: true,
  });

  expect(mergeSlotOptions(true, undefined)).toStrictEqual({
    enable: true,
  });

  expect(mergeSlotOptions(undefined, { enable: false })).toStrictEqual({
    enable: false,
  });

  expect(mergeSlotOptions(undefined, { enable: true })).toStrictEqual({
    enable: true,
  });

  expect(mergeSlotOptions({ enable: true }, undefined)).toStrictEqual({
    enable: true,
  });

  expect(mergeSlotOptions({ enable: false }, undefined)).toStrictEqual({
    enable: false,
  });
});

test('Both boolean', () => {
  expect(mergeSlotOptions(true, true)).toStrictEqual({
    enable: true,
  });

  expect(mergeSlotOptions(true, false)).toStrictEqual({
    enable: false,
  });

  expect(mergeSlotOptions(false, true)).toStrictEqual({
    enable: true,
  });
});

test('Both object', () => {
  expect(mergeSlotOptions({}, {})).toStrictEqual({
    enable: true,
  });

  expect(mergeSlotOptions({ enable: false }, {})).toStrictEqual({
    enable: true,
  });

  expect(mergeSlotOptions({}, { enable: false })).toStrictEqual({
    enable: false,
  });

  expect(mergeSlotOptions({ enable: true, a: 1, b: 2 }, { enable: true })).toStrictEqual({
    enable: true,
    a: 1,
    b: 2,
  });

  expect(
    mergeSlotOptions({ enable: true, a: 1, b: 2 }, { enable: true, a: 2 }),
  ).toStrictEqual({
    enable: true,
    a: 2,
    b: 2,
  });
});
