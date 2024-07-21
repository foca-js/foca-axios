# foca-axios

针对 axios 请求库的增强型适配器。

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
