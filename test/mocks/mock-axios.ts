import { Axios } from 'axios';
import { vitest } from 'vitest';

export const mockAxios = (code: number, data: any) => {
  vitest.spyOn(Axios.prototype, 'request').mockImplementationOnce(async (config) => {
    return {
      data,
      statusCode: code,
      config,
    };
  });
};
