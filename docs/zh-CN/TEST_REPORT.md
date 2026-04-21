# @dreamer/router 测试报告

## 测试概览

| 项目       | 说明                                 |
| ---------- | ------------------------------------ |
| 测试库版本 | @dreamer/test@^1.1.7                 |
| 运行时适配 | @dreamer/runtime-adapter@^1.0.18     |
| 测试框架   | @dreamer/test（describe/it/expect）  |
| 测试日期   | 2026-04-21                           |
| 测试环境   | Deno + Bun + Puppeteer（浏览器测试） |

## 测试结果

### 总体统计（以 Deno 为权威用例数）

| 指标     | 数值       |
| -------- | ---------- |
| 总用例数 | 193        |
| 通过     | 193        |
| 失败     | 0          |
| 通过率   | 100%       |
| 执行耗时 | 全套约 31s |

**Bun**（`bun test tests/`）：**189** 通过、**0** 失败（约 32s）。与 Deno
计数不同来自运行器对嵌套 **`describe`** 的统计方式；源码文件一致且均通过。

### 运行时兼容性

| 运行时 | 报告用例数 | 通过 | 状态 |
| ------ | ---------- | ---- | ---- |
| Deno   | 193        | 193  | ✅   |
| Bun    | 189        | 189  | ✅   |

### 测试文件统计

| 测试文件                 | 用例数 | 通过 | 失败 | 状态 |
| ------------------------ | ------ | ---- | ---- | ---- |
| client-browser.test.ts   | 28     | 28   | 0    | ✅   |
| client.test.ts           | 101    | 101  | 0    | ✅   |
| mod.test.ts              | 45     | 45   | 0    | ✅   |
| nav-match.test.ts        | 5      | 5    | 0    | ✅   |
| specificity-sort.test.ts | 14     | 14   | 0    | ✅   |

## 功能测试摘要

### 1. 客户端浏览器测试（`client-browser.test.ts`）— 28 个用例

**环境**：HTTP 服务 + Puppeteer 真实浏览器。

- ✅ 导出、`useRouter` 无全局实例、`getEngine`、`navigate`、`replace`
- ✅ 守卫、`back`/`forward`/`go`、动态路由、查询串、自定义组件加载器
- ✅ `start` 链接拦截与 `destroy`

### 2. 客户端单元测试（`client.test.ts`）— 101 个用例

- ✅ `createRouter`、`match`、守卫、`prefetch`、`loadComponent`
  缓存、`isActive`、元数据、`basePath`、history/hash、导航状态
- ✅ 链接拦截多种形态、**`Route`** 特异性与 **`addRoute`** 重排
- ✅ 无全局 **`ClientRouter`** 时的 Hooks（SSR 安全）

### 3. 服务端路由测试（`mod.test.ts`）— 45 个用例

- ✅ **`Router`** 构造、**`scan`**、**`match`**、布局链、重定向、中间件
- ✅ 扁平 API 文件注册 **`/api/foo/:method`** 与 **`match`**
- ✅ 非页面 **`.ts`/`.js`** 忽略、bundle 路径启发式等

### 4. 导航匹配（`nav-match.test.ts`）— 5 个用例

- ✅ **`normalizePathname`**、**`isNavActive`**

### 5. 特异性排序（`specificity-sort.test.ts`）— 14 个用例

- ✅ 元组比较、**`Router.scan`** 集成下静态优先于动态

## 结论

Deno **193**、Bun **189** 全部通过。包覆盖服务端文件路由（含特异性排序及扁平 API
文件的 `:method` 动态段）、客户端导航与 **`nav-match`**
辅助函数、浏览器集成与核心匹配逻辑。

---

**报告生成**：2026-04-21 **环境**：Deno + Bun + Puppeteer
