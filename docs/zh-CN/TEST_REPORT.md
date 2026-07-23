# @dreamer/router 测试报告

## 测试概览

| 项目       | 说明                                                              |
| ---------- | ----------------------------------------------------------------- |
| 测试库版本 | @dreamer/test@^1.2.3                                              |
| 运行时适配 | @dreamer/runtime-adapter@^1.2.2                                   |
| 测试框架   | @dreamer/test（describe/it/expect）                               |
| 测试日期   | 2026-07-23                                                        |
| 测试环境   | Deno 2.9 + Bun 1.3 + Node.js 22（单元）；Puppeteer（本地浏览器）  |

## 测试结果

### 总体统计（单元套件，CI 运行）

| 指标     | 数值                                                     |
| -------- | -------------------------------------------------------- |
| 总用例数 | 167 单元（Deno 报告 171，含 4 个生命周期钩子）           |
| 通过     | Deno 171 / Bun 167 / Node 167                            |
| 失败     | 0                                                        |
| 通过率   | 100%                                                     |
| 执行耗时 | 单元套件约 0.4s（每个运行时）                            |

4 个单元测试文件（`mod`、`client`、`nav-match`、`specificity-sort`）在 CI 中跨三
运行时运行。Deno 额外把 `@dreamer/test cleanup browsers` 生命周期钩子计为用例
（每文件 1 个 → +4），因此 Deno 报告 171，而 Bun/Node 报告 167。

### 运行时兼容性

| 运行时  | 报告用例数 | 通过 | 状态 |
| ------- | ---------- | ---- | ---- |
| Deno    | 171        | 171  | ✅   |
| Bun     | 167        | 167  | ✅   |
| Node.js | 167        | 167  | ✅   |

### 测试文件统计

| 测试文件                 | 用例数 | 通过 | 失败 | 状态 | CI  |
| ------------------------ | ------ | ---- | ---- | ---- | --- |
| client.test.ts           | 100    | 100  | 0    | ✅   | ✅  |
| mod.test.ts              | 50     | 50   | 0    | ✅   | ✅  |
| specificity-sort.test.ts | 13     | 13   | 0    | ✅   | ✅  |
| nav-match.test.ts        | 4      | 4    | 0    | ✅   | ✅  |
| client-browser.test.ts   | 28     | 28   | 0    | ✅   | ❌（仅本地 `test:browser`） |

## 功能测试摘要

### 1. 客户端单元测试（`client.test.ts`）— 100 个用例

- ✅ `createRouter`、`match`、守卫、`prefetch`、`loadComponent`
  缓存、`isActive`、元数据、`basePath`、history/hash、导航状态
- ✅ 链接拦截多种形态、**`Route`** 特异性与 **`addRoute`** 重排
- ✅ 无全局 **`ClientRouter`** 时的 Hooks（SSR 安全）

### 2. 服务端路由测试（`mod.test.ts`）— 50 个用例

- ✅ **`Router`** 构造、**`scan`**、**`match`**、布局链、重定向、中间件
- ✅ 嵌套 **`_middleware`** 路径收集及 **`handleRequest`** 链式执行顺序
- ✅ 扁平 API 文件注册 **`/api/foo/:method`** 与 **`match`**
- ✅ 非页面 **`.ts`/`.js`** 忽略、bundle 路径启发式等

### 3. 特异性排序（`specificity-sort.test.ts`）— 13 个用例

- ✅ 元组比较、**`Router.scan`** 集成下静态优先于动态

### 4. 导航匹配（`nav-match.test.ts`）— 4 个用例

- ✅ **`normalizePathname`**、**`isNavActive`**

### 5. 客户端浏览器测试（`client-browser.test.ts`）— 28 个用例（本地）

**环境**：HTTP 服务 + Puppeteer 真实浏览器。不进 CI，本地通过
`deno task test:browser` 运行。

- ✅ 导出、`useRouter` 无全局实例、`getEngine`、`navigate`、`replace`
- ✅ 守卫、`back`/`forward`/`go`、动态路由、查询串、自定义组件加载器
- ✅ `start` 链接拦截与 `destroy`

## 结论

Deno **171**、Bun **167**、Node.js **167** 单元测试全部通过。包覆盖服务端文件路由
（含特异性排序、扁平 API `:method` 动态段及嵌套 **`_middleware` 链**）、客户端导航与
**`nav-match`** 辅助函数、布局/中间件 key 辅助、bundle 路径启发式，以及服务端与客户端
共用的核心匹配/排序逻辑。Playwright 浏览器集成测试（28 用例）本地通过，为稳定性不进 CI。

---

**报告生成**：2026-07-23 **环境**：Deno 2.9 + Bun 1.3 + Node.js 22（单元）；Puppeteer（本地浏览器）
