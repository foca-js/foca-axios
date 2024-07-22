# foca-axios

axios++，支持 缓存、截流、重试，响应结果去掉烦人的.data

[![License](https://img.shields.io/github/license/foca-js/foca-axios)](https://github.com/foca-js/foca-axios/blob/master/LICENSE)
[![GitHub Workflow Status (branch)](https://img.shields.io/github/actions/workflow/status/foca-js/foca-axios/test.yml?branch=master&label=test&logo=vitest)](https://github.com/foca-js/foca-axios/actions)
[![Codecov](https://img.shields.io/codecov/c/github/foca-js/foca-axios)](https://codecov.io/gh/foca-js/foca-axios)
[![npm](https://img.shields.io/npm/v/foca-axios)](https://www.npmjs.com/package/foca-axios)
[![npm dependency version](https://img.shields.io/npm/dependency-version/foca-axios/axios)](https://github.com/axios/axios)

# 特性

- 合并相同的并发请求
- 失败重试
- 缓存响应成功的数据
- 优化 axios 返回值

# 安装

```bash
pnpm add foca-axios
```

# 使用

```typescript
// File: http.ts
import { axios } from 'foca-axios';

export const http = axios;
```

# 自定义配置

```typescript
import { axios } from 'foca-axios';

export const http = axios.create({
  retry: false,
});
```

# 使用原始数据

```typescript
// [{id: 1, ...}]
await axios.get('/users');

// { data: [{id: 1, ...}], status: 200, ... }
await axios.get('/users').toRaw();
```

# 请求遇到授权限制

retry配置中提供了`resolveUnauthorized`函数

当检测到401 unauthorized状态码，如果该函数返回true，则忽略 **allowedMethods** 和 **allowedHttpStatus** 的判断并继续重试。

注意：函数内的请求即使出错也不会进行重试

```typescript
const http = axios.create({
  retry: {
    async resolveUnauthorized(config) {
      const result = await axios.post('/refresh/token', {...});
      // config是即将重试的请求配置
      config.headers.Authorization = `Bearer ${result.token}`;
      // 代表已经解决授权问题，继续重试
      return true;
    },
  },
});
```
