import clone from 'clone';
import type { AxiosResponse } from 'axios';
import { FocaRequestConfig } from '..';

/**
 * request作为XMLHttpRequest被clone时会出错
 * @see XMLHttpRequest
 */
export const cloneResponse = (
  response: AxiosResponse,
  config: FocaRequestConfig,
) => {
  const next = Object.assign({}, response);

  next.data = clone(next.data, false);
  next.headers = clone(next.headers, false);
  next.config = config;

  return next;
};
