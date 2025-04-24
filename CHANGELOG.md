# Changelog

## [4.2.1](https://github.com/foca-js/foca-axios/compare/v4.2.0...v4.2.1) (2025-04-24)


### Bug Fixes

* 更新默认重试间隔时间从300ms到500ms ([ce7ec85](https://github.com/foca-js/foca-axios/commit/ce7ec858b61979564d4a1d6812503e6c6a690c35))

# [4.2.0](https://github.com/foca-js/foca-axios/compare/v4.1.2...v4.2.0) (2025-04-24)


### Features

* 重试机制支持Retry-After报文设置的时间 ([e039d2c](https://github.com/foca-js/foca-axios/commit/e039d2c5594b62eda3f78ed905f6d5c44f35d71c))

## [4.1.2](https://github.com/foca-js/foca-axios/compare/v4.1.1...v4.1.2) (2024-10-25)


### Bug Fixes

* 令牌刷新后只重试了其中一个接口 ([c680377](https://github.com/foca-js/foca-axios/commit/c6803770a9e967e964c434935da8883ff699deb6))

## [4.1.1](https://github.com/foca-js/foca-axios/compare/v4.1.0...v4.1.1) (2024-08-11)

# [4.1.0](https://github.com/foca-js/foca-axios/compare/v4.0.1...v4.1.0) (2024-07-22)


### Bug Fixes

* axios.create()使用了重复的适配器 ([e15590f](https://github.com/foca-js/foca-axios/commit/e15590f41104e7d9358aa1dd0d40cf668538a632))


### Features

* 重试前允许执行更新令牌操作 ([03807f2](https://github.com/foca-js/foca-axios/commit/03807f23a4ac6bf7c8d51c83b040e3df05b60d6d))


## [4.0.1](https://github.com/foca-js/foca-axios/compare/v4.0.0...v4.0.1) (2024-07-21)

# [4.0.0](https://github.com/foca-js/foca-axios/compare/v3.1.0...v4.0.0) (2024-07-21)


### Features

* axios全局开启适配器 ([42a6eb8](https://github.com/foca-js/foca-axios/commit/42a6eb88a7fc7b815fb93536194b821b349efbe2))


### BREAKING CHANGES

* 缓存默认关闭

## [3.1.0](https://github.com/foca-js/foca-axios/compare/v3.0.2...v3.1.0)&nbsp;&nbsp;(2023-03-20)

- 所有特性默认都是开启的

## [3.0.2](https://github.com/foca-js/foca-axios/compare/v3.0.0...v3.0.2)&nbsp;&nbsp;(2023-03-03)

- 导出 axios default 模块

## [3.0.0](https://github.com/foca-js/foca-axios/compare/v2.0.0...v3.0.0)&nbsp;&nbsp;(2023-03-03)

- 内置 axios 并限定版本号
- 自动执行增强函数
- 使用 `declare module 'axios'` 重定义 axios 部分类型

## [2.0.0](https://github.com/foca-js/foca-axios/compare/v1.0.2...v2.0.0)&nbsp;&nbsp;(2022-11-10)

- 升级 axios 到 1.1 版本

## [1.0.2](https://github.com/foca-js/foca-axios/compare/v1.0.1...v1.0.2)&nbsp;&nbsp;(2022-05-16)

- axios 不支持 esm 格式

## [1.0.1](https://github.com/foca-js/foca-axios/compare/v1.0.0...v1.0.1)&nbsp;&nbsp;(2022-05-13)

- 使用`.js`文件以适配旧的打包工具

## [1.0.0](https://github.com/foca-js/foca-axios/compare/v0.4.0...v1.0.0)&nbsp;&nbsp;(2022-05-10)

- [breaking] 现在只支持axios@0.27+
- 新的打包方式以更好地兼容 ESM

## [0.4.0](https://github.com/foca-js/foca-axios/compare/v0.3.0...v0.4.0)&nbsp;&nbsp;(2021-12-16)

- 新增方法 clearCache()

## [0.3.0](https://github.com/foca-js/foca-axios/compare/v0.2.0...v0.3.0)&nbsp;&nbsp;(2021-11-18)

- 属性 share 重命名为 throttle

## [0.2.0](https://github.com/foca-js/foca-axios/compare/v0.1.0...v0.2.0)&nbsp;&nbsp;(2021-11-17)

- 配置允许直接使用布尔值
- 缓存配置支持 allowedMethods
- 缓存、共享和重试配置增加 validate 方法
- 单个请求中指定了配置时，自动跳过 allowedMethods 的限制

## [0.1.0](https://github.com/foca-js/foca-axios/compare/v0.0.3...v0.1.0)&nbsp;&nbsp;(2021-11-16)

- 请求泛型返回值必须由开发者手动指定

## [0.0.3](https://github.com/foca-js/foca-axios/compare/v0.0.2...v0.0.3)&nbsp;&nbsp;(2021-11-16)

- 缓存数据
- 失败重试
- 修复共享数据复制失败问题

## [0.0.2](https://github.com/foca-js/foca-axios/compare/v0.0.1...v0.0.2)&nbsp;&nbsp;(2021-11-15)

- 实现请求共享
