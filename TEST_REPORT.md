# @dreamer/router 测试报告

## 测试概览

| 项目 | 信息 |
|------|------|
| 测试库版本 | 1.0.0-beta.9 |
| 运行时适配器 | @dreamer/runtime-adapter@^1.0.0-beta.22 |
| 测试框架 | @dreamer/test@^1.0.0-beta.40 |
| 测试时间 | 2026-02-03 |
| 测试环境 | Deno + Bun + Puppeteer (浏览器测试) |

## 测试结果

### 总体统计

| 指标 | 数值 |
|------|------|
| 总测试数 | 130 |
| 通过 | 130 |
| 失败 | 0 |
| 通过率 | 100% |
| 执行时间 | ~31s |

### 运行时兼容性

| 运行时 | 测试数 | 通过 | 状态 |
|--------|--------|------|------|
| Deno | 130 | 130 | ✅ |
| Bun | 130 | 130 | ✅ |

### 测试文件统计

| 测试文件 | 测试数量 | 通过 | 失败 | 状态 |
|----------|----------|------|------|------|
| client-browser.test.ts | 27 | 27 | 0 | ✅ |
| client.test.ts | 69 | 69 | 0 | ✅ |
| mod.test.ts | 34 | 34 | 0 | ✅ |

## 功能测试详情

### 1. 客户端路由器浏览器测试 (client-browser.test.ts) - 27 个测试

**测试环境**：使用 HTTP 服务器 + Puppeteer 进行真实浏览器测试

- ✅ 导出所有必要的函数、useRouter 错误、getEngine 引擎
- ✅ navigate 导航、replace 模式
- ✅ onRouteChange、beforeRoute、afterRoute 守卫
- ✅ back/forward/go 历史操作
- ✅ 动态路由、查询参数、组件加载器
- ✅ start 链接拦截（同源、外部、target=_blank、修饰键等）
- ✅ destroy 销毁

### 2. 客户端路由器单元测试 (client.test.ts) - 69 个测试

- ✅ createRouter（preact、react、空路由）
- ✅ match（静态、动态、通配符、可选参数、查询参数）
- ✅ onRouteChange、getCurrentRoute
- ✅ beforeRoute、afterRoute 守卫
- ✅ getEngine（preact、react）
- ✅ 动态路由管理、组件加载器、守卫管理
- ✅ start、destroy、边界情况
- ✅ 路由元数据、基础路径、路由模式、导航状态、isActive、重定向、缓存

### 3. 服务端路由器测试 (mod.test.ts) - 34 个测试

- ✅ constructor、scan、match、getRoutes、getSpecialFile
- ✅ 重定向、中间件、getClientRoutes、skipAppValidation
- ✅ getEngine、getApiMode、isSSREnabled、clearCache
- ✅ RouteMatch 扩展（load、fullPath、meta）

## 结论

@dreamer/router 测试覆盖率达到 100%，共 130 个测试全部通过。支持 Preact 和 React 两种渲染引擎，涵盖服务端路由扫描/匹配与客户端路由导航/守卫/链接拦截等功能。

---

**报告生成时间**: 2026-02-03
**测试执行环境**: Deno + Bun + Puppeteer
