# foca-axios-enhancer

针对 axios 请求库的增强型适配器。

[![License](https://img.shields.io/github/license/foca-js/foca-axios-enhancer)](https://github.com/foca-js/foca-axios-enhancer/blob/master/LICENSE)
[![GitHub Workflow Status (branch)](https://img.shields.io/github/workflow/status/foca-js/foca-axios-enhancer/CI/master)](https://github.com/foca-js/foca-axios-enhancer/actions)
[![Codecov](https://img.shields.io/codecov/c/github/foca-js/foca-axios-enhancer)](https://codecov.io/gh/foca-js/foca-axios-enhancer)
[![npm](https://img.shields.io/npm/v/foca-axios-enhancer)](https://www.npmjs.com/package/foca-axios-enhancer)

# 特性

- 合并相同的并发请求
- 失败重试
- 缓存响应成功的数据
- 优化 axios 返回值

# 安装

```bash
yarn add axios foca-axios-enhancer
```

# 使用

```typescript
// File: http.ts
import axios from 'axios';
import { enhanceAxios } from 'foca-axios-enhancer';

const instance = axios.create();
export const http = enhanceAxios(instance); // http === instance
```
